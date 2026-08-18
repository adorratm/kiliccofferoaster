import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, MoreThanOrEqual } from 'typeorm';
import { Order, OrderStatus } from '@entities/order.entity';
import { OrderItem } from '@entities/order-item.entity';
import { MarketplaceAccount } from '@entities/marketplace-account.entity';
import { LowStockService } from '@modules/catalog/low-stock.service';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'Ödeme bekliyor',
  paid: 'Ödendi',
  processing: 'Hazırlanıyor',
  shipped: 'Kargoda',
  delivered: 'Teslim',
  cancelled: 'İptal',
  refunded: 'İade',
};

export type DashboardDayPoint = {
  date: string;
  orders: number;
  revenue: number;
};

export type DashboardStats = {
  ordersToday: number;
  lowStockCount: number;
  revenueToday: number;
  pendingOrders: number;
  marketplaceSync: {
    platform: string;
    storeName: string;
    lastSyncAt: string | null;
    lastSyncStatus: string | null;
  }[];
  series: DashboardDayPoint[];
  byStatus: { status: string; label: string; count: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
};

@Injectable()
export class AdminService {
  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly lowStock: LowStockService,
  ) {}

  async getStats(lowStockThreshold?: number): Promise<DashboardStats> {
    const start = startOfIstanbulDay(0);
    const start14 = startOfIstanbulDay(13);
    const start30 = startOfIstanbulDay(29);

    const threshold =
      lowStockThreshold !== undefined && Number.isFinite(lowStockThreshold)
        ? lowStockThreshold
        : this.lowStock.threshold();

    const [
      ordersToday,
      lowStockRows,
      revenueRow,
      pendingOrders,
      accounts,
      dailyRows,
      statusRows,
      topRows,
    ] = await Promise.all([
      this.em.count(Order, {
        where: { createdAt: MoreThanOrEqual(start) },
      }),
      this.lowStock.listLowStock(threshold),
      this.em
        .createQueryBuilder(Order, 'o')
        .select('COALESCE(SUM(o.total), 0)', 'sum')
        .where('o.created_at >= :start', { start })
        .andWhere("o.status NOT IN ('cancelled', 'pending_payment')")
        .getRawOne<{ sum: string }>(),
      this.em.count(Order, {
        where: { status: OrderStatus.PROCESSING },
      }),
      this.em.find(MarketplaceAccount, {
        order: { updatedAt: 'DESC' },
      }),
      this.em.query<
        { day: string; orders: string; revenue: string }[]
      >(
        `
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'Europe/Istanbul'), 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS orders,
               COALESCE(SUM(CASE WHEN status::text NOT IN ('cancelled', 'pending_payment') THEN total ELSE 0 END), 0) AS revenue
        FROM orders
        WHERE created_at >= $1
        GROUP BY 1
        ORDER BY 1
        `,
        [start14],
      ),
      this.em.query<{ status: string; count: string }[]>(
        `SELECT status::text AS status, COUNT(*)::int AS count FROM orders GROUP BY 1`,
      ),
      this.em
        .createQueryBuilder(OrderItem, 'oi')
        .innerJoin('oi.order', 'o')
        .select('oi.productName', 'name')
        .addSelect('SUM(oi.quantity)', 'quantity')
        .addSelect('COALESCE(SUM(oi.lineTotal), 0)', 'revenue')
        .where('o.createdAt >= :start30', { start30 })
        .andWhere('o.status NOT IN (:...skip)', {
          skip: [OrderStatus.CANCELLED, OrderStatus.PENDING_PAYMENT],
        })
        .groupBy('oi.productName')
        .orderBy('SUM(oi.quantity)', 'DESC')
        .limit(6)
        .getRawMany<{ name: string; quantity: string; revenue: string }>(),
    ]);

    const dailyMap = new Map(
      dailyRows.map((r) => [
        r.day,
        { orders: Number(r.orders), revenue: Number(r.revenue) },
      ]),
    );

    return {
      ordersToday,
      lowStockCount: lowStockRows.length,
      revenueToday: Number(revenueRow?.sum || 0),
      pendingOrders,
      marketplaceSync: accounts.map((a) => ({
        platform: a.platform,
        storeName: a.storeName,
        lastSyncAt: a.lastSyncAt ? a.lastSyncAt.toISOString() : null,
        lastSyncStatus: a.lastSyncStatus ?? null,
      })),
      series: fillDays(14, dailyMap),
      byStatus: statusRows.map((r) => ({
        status: r.status,
        label: STATUS_LABEL[r.status] || r.status,
        count: Number(r.count),
      })),
      topProducts: topRows.map((r) => ({
        name: r.name,
        quantity: Number(r.quantity),
        revenue: Number(r.revenue),
      })),
    };
  }
}

function startOfIstanbulDay(daysAgo: number): Date {
  const now = new Date();
  const istanbul = new Date(
    now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }),
  );
  istanbul.setHours(0, 0, 0, 0);
  istanbul.setDate(istanbul.getDate() - daysAgo);
  return istanbul;
}

function fillDays(
  days: number,
  map: Map<string, { orders: number; revenue: number }>,
): DashboardDayPoint[] {
  const out: DashboardDayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' });
    const row = map.get(key);
    out.push({
      date: key,
      orders: row?.orders ?? 0,
      revenue: row?.revenue ?? 0,
    });
  }
  return out;
}
