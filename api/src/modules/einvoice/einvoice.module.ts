import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '@modules/notifications/notifications.module';
import { EinvoiceGateway } from '@modules/einvoice/einvoice.gateway';
import { EinvoiceService } from '@modules/einvoice/einvoice.service';
import { MockEinvoiceAdapter } from '@modules/einvoice/mock.adapter';
import { TurkcellEinvoiceAdapter } from '@modules/einvoice/turkcell.adapter';
import { EinvoiceProcessor } from '@modules/einvoice/einvoice.processor';
import { EinvoiceScheduler } from '@modules/einvoice/einvoice.scheduler';
import { EinvoiceController } from '@modules/einvoice/einvoice.controller';
import { QUEUE_EINVOICE } from '@modules/queues/queue.constants';

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_EINVOICE }),
    NotificationsModule,
  ],
  controllers: [EinvoiceController],
  providers: [
    MockEinvoiceAdapter,
    TurkcellEinvoiceAdapter,
    EinvoiceService,
    EinvoiceProcessor,
    EinvoiceScheduler,
    { provide: EinvoiceGateway, useExisting: EinvoiceService },
  ],
  exports: [EinvoiceService, EinvoiceGateway],
})
export class EinvoiceModule {}
