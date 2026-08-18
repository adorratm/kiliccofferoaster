import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_EINVOICE } from '@modules/queues/queue.constants';

@Injectable()
export class EinvoiceScheduler implements OnModuleInit {
  private readonly logger = new Logger(EinvoiceScheduler.name);

  constructor(@InjectQueue(QUEUE_EINVOICE) private readonly queue: Queue) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'einvoice-poll-repeat',
      { every: 5 * 60 * 1000 },
      {
        name: 'poll',
        data: { reason: 'repeat' },
        opts: { removeOnComplete: 20, removeOnFail: 50 },
      },
    );
    this.logger.log('Scheduled e-belge poll every 5m');
  }
}
