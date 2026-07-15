import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_SHIPPING_POLL } from '@modules/queues/queue.constants';

@Injectable()
export class ShippingPollScheduler implements OnModuleInit {
  private readonly logger = new Logger(ShippingPollScheduler.name);

  constructor(
    @InjectQueue(QUEUE_SHIPPING_POLL) private readonly pollQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.pollQueue.add(
      'poll-open-shipments',
      { reason: 'repeat' },
      {
        repeat: { every: 15 * 60 * 1000 },
        jobId: 'shipping-poll-repeat',
        removeOnComplete: 20,
        removeOnFail: 50,
      },
    );
    this.logger.log('Scheduled shipping-poll every 15 minutes');
  }
}
