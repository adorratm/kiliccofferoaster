import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_ABANDONED_CART } from '@modules/queues/queue.constants';

@Injectable()
export class AbandonedCartScheduler implements OnModuleInit {
  private readonly logger = new Logger(AbandonedCartScheduler.name);

  constructor(
    @InjectQueue(QUEUE_ABANDONED_CART) private readonly queue: Queue,
  ) {}

  async onModuleInit() {
    await this.queue.upsertJobScheduler(
      'abandoned-cart-repeat',
      { every: 60 * 60 * 1000 },
      {
        name: 'scan-abandoned-carts',
        data: { reason: 'repeat' },
        opts: {
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      },
    );
    this.logger.log('Scheduled abandoned-cart scan every 60 minutes');
  }
}
