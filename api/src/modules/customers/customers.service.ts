import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In, IsNull } from 'typeorm';
import { User, UserRole, AuthProvider } from '@entities/user.entity';
import { Address } from '@entities/address.entity';
import { Order, OrderStatus } from '@entities/order.entity';
import { ReturnRequest } from '@entities/return-request.entity';
import { ProductReview } from '@entities/product-review.entity';
import { WishlistItem } from '@entities/wishlist-item.entity';
import {
  paginateResult,
  PaginatedResult,
} from '@common/utils/pagination';
import {
  CustomerQueryDto,
  UpdateCustomerDto,
} from '@modules/customers/dto/customers.dto';

export type CustomerListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  provider: AuthProvider;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  addressCount: number;
};

export type CustomerProfile = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  provider: AuthProvider;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  emailVerified: boolean;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const SPENT_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

@Injectable()
export class CustomersService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async list(
    query: CustomerQueryDto = {},
  ): Promise<PaginatedResult<CustomerListItem>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;

    const qb = this.em
      .createQueryBuilder(User, 'u')
      .where('u.role = :role', { role: UserRole.CUSTOMER })
      .orderBy('u.created_at', 'DESC');

    if (query.active === 'true') {
      qb.andWhere('u.is_active = true');
    } else if (query.active === 'false') {
      qb.andWhere('u.is_active = false');
    }

    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;
      qb.andWhere(
        `(
          u.email ILIKE :q OR
          COALESCE(u.first_name, '') ILIKE :q OR
          COALESCE(u.last_name, '') ILIKE :q OR
          COALESCE(u.phone, '') ILIKE :q
        )`,
        { q },
      );
    }

    const [users, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const stats = await this.loadListStats(users.map((u) => u.id));

    const items: CustomerListItem[] = users.map((u) => {
      const row = stats.get(u.id);
      return {
        id: u.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        phone: u.phone,
        provider: u.provider,
        avatarUrl: u.avatarUrl,
        isActive: u.isActive,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        orderCount: row?.orderCount ?? 0,
        totalSpent: row?.totalSpent ?? 0,
        addressCount: row?.addressCount ?? 0,
      };
    });

    return paginateResult(items, total, page, limit);
  }

  async getById(id: string) {
    const user = await this.em.findOne(User, {
      where: { id, role: UserRole.CUSTOMER },
    });
    if (!user) {
      throw new NotFoundException('Müşteri bulunamadı');
    }

    const [addresses, orders, guestOrders, reviews, wishlist] =
      await Promise.all([
        this.em.find(Address, {
          where: { userId: user.id },
          order: { createdAt: 'DESC' },
        }),
        this.em.find(Order, {
          where: { userId: user.id },
          relations: { items: true, payment: true, shipments: true },
          order: { createdAt: 'DESC' },
        }),
        this.em.find(Order, {
          where: { customerEmail: user.email, userId: IsNull() },
          relations: { items: true, payment: true, shipments: true },
          order: { createdAt: 'DESC' },
        }),
        this.em.find(ProductReview, {
          where: { userId: user.id },
          relations: { product: true },
          order: { createdAt: 'DESC' },
        }),
        this.em.find(WishlistItem, {
          where: { userId: user.id },
          relations: { product: true },
          order: { createdAt: 'DESC' },
        }),
      ]);

    const orderIds = [...orders, ...guestOrders].map((o) => o.id);
    const returns = orderIds.length
      ? await this.em.find(ReturnRequest, {
          where: [{ userId: user.id }, { orderId: In(orderIds) }],
          relations: { order: true },
          order: { createdAt: 'DESC' },
        })
      : await this.em.find(ReturnRequest, {
          where: { userId: user.id },
          relations: { order: true },
          order: { createdAt: 'DESC' },
        });

    const uniqueReturns = [
      ...new Map(returns.map((r) => [r.id, r])).values(),
    ];

    const spentOrders = orders.filter((o) =>
      SPENT_STATUSES.includes(o.status),
    );

    return {
      user: this.profile(user),
      stats: {
        orderCount: orders.length,
        guestOrderCount: guestOrders.length,
        totalSpent: spentOrders.reduce((sum, o) => sum + Number(o.total || 0), 0),
        addressCount: addresses.length,
        returnCount: uniqueReturns.length,
        reviewCount: reviews.length,
        wishlistCount: wishlist.length,
      },
      addresses,
      orders,
      guestOrders,
      returns: uniqueReturns.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order?.orderNumber ?? null,
        type: r.type,
        status: r.status,
        reason: r.reason,
        adminNote: r.adminNote,
        refundAmount: r.refundAmount,
        createdAt: r.createdAt,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        productId: r.productId,
        productName: r.product?.name ?? null,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isApproved: r.isApproved,
        createdAt: r.createdAt,
      })),
      wishlist: wishlist.map((w) => ({
        id: w.id,
        productId: w.productId,
        productName: w.product?.name ?? null,
        createdAt: w.createdAt,
      })),
    };
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const user = await this.em.findOne(User, {
      where: { id, role: UserRole.CUSTOMER },
    });
    if (!user) {
      throw new NotFoundException('Müşteri bulunamadı');
    }
    if (dto.isActive !== undefined) {
      user.isActive = dto.isActive;
    }
    await this.em.save(user);
    return this.getById(id);
  }

  private profile(user: User): CustomerProfile {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      provider: user.provider,
      role: user.role,
      avatarUrl: user.avatarUrl,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      hasPassword: Boolean(user.passwordHash),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async loadListStats(
    ids: string[],
  ): Promise<Map<string, { orderCount: number; totalSpent: number; addressCount: number }>> {
    const map = new Map<
      string,
      { orderCount: number; totalSpent: number; addressCount: number }
    >();
    if (!ids.length) return map;

    const [orderRows, addressRows] = await Promise.all([
      this.em
        .createQueryBuilder(Order, 'o')
        .select('o.user_id', 'user_id')
        .addSelect('COUNT(*)', 'order_count')
        .addSelect(
          `COALESCE(SUM(CASE WHEN o.status IN (:...spent) THEN o.total ELSE 0 END), 0)`,
          'total_spent',
        )
        .where('o.user_id IN (:...ids)', { ids, spent: SPENT_STATUSES })
        .groupBy('o.user_id')
        .getRawMany<{
          user_id: string;
          order_count: string;
          total_spent: string;
        }>(),
      this.em
        .createQueryBuilder(Address, 'a')
        .select('a.user_id', 'user_id')
        .addSelect('COUNT(*)', 'address_count')
        .where('a.user_id IN (:...ids)', { ids })
        .groupBy('a.user_id')
        .getRawMany<{ user_id: string; address_count: string }>(),
    ]);

    for (const id of ids) {
      map.set(id, { orderCount: 0, totalSpent: 0, addressCount: 0 });
    }
    for (const row of orderRows) {
      const cur = map.get(row.user_id);
      if (cur) {
        cur.orderCount = Number(row.order_count) || 0;
        cur.totalSpent = Number(row.total_spent) || 0;
      }
    }
    for (const row of addressRows) {
      const cur = map.get(row.user_id);
      if (cur) cur.addressCount = Number(row.address_count) || 0;
    }
    return map;
  }
}
