import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { AccountingSettings } from '@entities/accounting-settings.entity';
import { UpdateAccountingSettingsDto } from '@modules/accounting/dto/accounting.dto';

@Injectable()
export class AccountingSettingsService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async get(): Promise<AccountingSettings> {
    let row = await this.em.findOne(AccountingSettings, { where: {} });
    if (!row) {
      row = await this.em.save(
        this.em.create(AccountingSettings, {
          companyTitle: 'Kılıç Coffee Roaster',
        }),
      );
    }
    return row;
  }

  async update(dto: UpdateAccountingSettingsDto): Promise<AccountingSettings> {
    const row = await this.get();
    Object.assign(row, dto);
    return this.em.save(row);
  }
}
