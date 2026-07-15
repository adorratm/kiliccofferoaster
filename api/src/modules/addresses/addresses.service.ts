import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { Address } from '@entities/address.entity';
import {
  CreateAddressDto,
  UpdateAddressDto,
} from '@modules/addresses/dto/addresses.dto';

@Injectable()
export class AddressesService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  listForUser(userId: string): Promise<Address[]> {
    return this.em.find(Address, {
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOwned(id: string, userId: string): Promise<Address> {
    const address = await this.em.findOne(Address, { where: { id } });
    if (!address) {
      throw new NotFoundException('Adres bulunamadı');
    }
    if (address.userId !== userId) {
      throw new ForbiddenException('Bu adrese erişim yok');
    }
    return address;
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    return this.em.transaction(async (tx) => {
      const count = await tx.count(Address, { where: { userId } });
      const makeShipping =
        dto.isDefaultShipping === true || count === 0;
      const makeBilling =
        dto.isDefaultBilling === true || count === 0;

      if (makeShipping) {
        await tx.update(
          Address,
          { userId, isDefaultShipping: true },
          { isDefaultShipping: false },
        );
      }
      if (makeBilling) {
        await tx.update(
          Address,
          { userId, isDefaultBilling: true },
          { isDefaultBilling: false },
        );
      }

      const address = tx.create(Address, {
        userId,
        title: dto.title,
        fullName: dto.fullName,
        phone: dto.phone,
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood ?? null,
        addressLine: dto.addressLine,
        postalCode: dto.postalCode,
        isDefaultShipping: makeShipping,
        isDefaultBilling: makeBilling,
      });
      return tx.save(address);
    });
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    return this.em.transaction(async (tx) => {
      const address = await tx.findOne(Address, { where: { id } });
      if (!address) {
        throw new NotFoundException('Adres bulunamadı');
      }
      if (address.userId !== userId) {
        throw new ForbiddenException('Bu adrese erişim yok');
      }

      if (dto.title !== undefined) address.title = dto.title;
      if (dto.fullName !== undefined) address.fullName = dto.fullName;
      if (dto.phone !== undefined) address.phone = dto.phone;
      if (dto.city !== undefined) address.city = dto.city;
      if (dto.district !== undefined) address.district = dto.district;
      if (dto.neighborhood !== undefined) {
        address.neighborhood = dto.neighborhood || null;
      }
      if (dto.addressLine !== undefined) {
        address.addressLine = dto.addressLine;
      }
      if (dto.postalCode !== undefined) address.postalCode = dto.postalCode;

      if (dto.isDefaultShipping === true) {
        await tx.update(
          Address,
          { userId, isDefaultShipping: true },
          { isDefaultShipping: false },
        );
        address.isDefaultShipping = true;
      } else if (dto.isDefaultShipping === false) {
        address.isDefaultShipping = false;
      }

      if (dto.isDefaultBilling === true) {
        await tx.update(
          Address,
          { userId, isDefaultBilling: true },
          { isDefaultBilling: false },
        );
        address.isDefaultBilling = true;
      } else if (dto.isDefaultBilling === false) {
        address.isDefaultBilling = false;
      }

      return tx.save(address);
    });
  }

  async remove(id: string, userId: string): Promise<void> {
    const address = await this.findOwned(id, userId);
    await this.em.remove(address);
  }
}
