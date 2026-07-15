import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InjectEntityManager } from '@nestjs/typeorm';
import { EntityManager, In } from 'typeorm';
import {
  QUEUE_SHIPPING_POLL,
  ShippingPollJobPayload,
} from '@modules/queues/queue.constants';
import { Shipment, ShipmentStatus } from '@entities/shipment.entity';
import { ShippingService } from '@modules/shipping/shipping.service';

@Processor(QUEUE_SHIPPING_POLL)
export class ShippingPollProcessor extends WorkerHost {
  private readonly logger = new Logger(ShippingPollProcessor.name);

  constructor(
    @InjectEntityManager() private readonly em: EntityManager,
    private readonly shippingService: ShippingService,
  ) {
    super();
  }

  async process(job: Job<ShippingPollJobPayload>): Promise<{ polled: number }> {
    this.logger.log(`Shipping poll job ${job.id} reason=${job.data?.reason || 'schedule'}`);

    const openStatuses = [
      ShipmentStatus.PENDING,
      ShipmentStatus.LABEL_CREATED,
      ShipmentStatus.IN_TRANSIT,
    ];

    const shipments = await this.em.find(Shipment, {
      where: {
        status: In(openStatuses),
      },
      take: 100,
      order: { updatedAt: 'ASC' },
    });

    let polled = 0;
    for (const shipment of shipments) {
      if (!shipment.trackingNumber) continue;
      try {
        await this.shippingService.trackShipment({
          provider: shipment.provider,
          trackingNumber: shipment.trackingNumber,
        });
        polled += 1;
      } catch (err) {
        this.logger.warn(
          `Poll failed for ${shipment.trackingNumber}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
    }

    return { polled };
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Shipping poll failed ${job?.id}: ${error.message}`);
  }
}
