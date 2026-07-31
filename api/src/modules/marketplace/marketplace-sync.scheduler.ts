import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_MARKETPLACE_SYNC } from '@modules/queues/queue.constants';

@Injectable()
export class MarketplaceSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(MarketplaceSyncScheduler.name);

  constructor(
    @InjectQueue(QUEUE_MARKETPLACE_SYNC) private readonly queue: Queue,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    const enabled = this.config.get<boolean>('marketplaceSync.enabled');
    if (enabled === false) {
      this.logger.log('Marketplace sync scheduler skipped (disabled)');
      return;
    }

    const minutes = Math.max(
      5,
      Number(this.config.get<number>('marketplaceSync.intervalMinutes') || 60),
    );
    const every = minutes * 60 * 1000;

    await this.queue.upsertJobScheduler(
      'marketplace-sync-repeat',
      { every },
      {
        name: 'sync-enabled-accounts',
        data: { reason: 'repeat', mode: 'all' },
        opts: {
          removeOnComplete: 20,
          removeOnFail: 50,
        },
      },
    );
    this.logger.log(`Scheduled marketplace sync every ${minutes} minutes`);
  }
}
