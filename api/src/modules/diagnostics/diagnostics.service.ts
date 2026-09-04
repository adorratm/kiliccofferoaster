import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager } from 'typeorm';
import { MobileClientEvent } from '@entities/mobile-client-event.entity';
import { CreateMobileClientEventDto } from '@modules/diagnostics/dto/diagnostics.dto';

@Injectable()
export class DiagnosticsService {
  constructor(@InjectEntityManager() private readonly em: EntityManager) {}

  async record(dto: CreateMobileClientEventDto) {
    const row = this.em.create(MobileClientEvent, {
      event: dto.event.trim().slice(0, 64),
      platform: dto.platform?.slice(0, 16) ?? null,
      appVersion: dto.appVersion?.slice(0, 32) ?? null,
      runtimeVersion: dto.runtimeVersion?.slice(0, 64) ?? null,
      updateChannel: dto.updateChannel?.slice(0, 64) ?? null,
      orderNumber: dto.orderNumber?.slice(0, 64) ?? null,
      sessionId: dto.sessionId?.slice(0, 120) ?? null,
      meta: dto.meta ?? null,
    });
    return this.em.save(row);
  }

  async listRecent(limit = 100) {
    const take = Math.min(Math.max(limit, 1), 500);
    return this.em.find(MobileClientEvent, {
      order: { createdAt: 'DESC' },
      take,
    });
  }
}
