import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  QUEUE_NOTIFICATIONS,
  NotificationJobPayload,
} from '@modules/queues/queue.constants';
import { NotificationsService } from '@modules/notifications/notifications.service';

@Processor(QUEUE_NOTIFICATIONS)
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notifications: NotificationsService) {
    super();
  }

  async process(job: Job<NotificationJobPayload>): Promise<void> {
    this.logger.log(
      `Processing notification job ${job.id} template=${job.data.template}`,
    );
    await this.notifications.processJob(job.data);
  }
}
