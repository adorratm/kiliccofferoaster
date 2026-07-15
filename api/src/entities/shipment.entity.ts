import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@entities/base.entity';
import { Order } from '@entities/order.entity';

export enum ShipmentStatus {
  PENDING = 'pending',
  LABEL_CREATED = 'label_created',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned',
}

export enum ShippingProviderCode {
  YURTICI = 'yurtici',
  KOLAY_GELSIN = 'kolay_gelsin',
  DHL = 'dhl',
  SURAT = 'surat',
  PTT = 'ptt',
  HEPSIJET = 'hepsijet',
  TRENDYOL_EXPRESS = 'trendyol_express',
}

@Entity('shipments')
export class Shipment extends BaseEntity {
  @ManyToOne(() => Order, (order) => order.shipments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @Column({
    type: 'enum',
    enum: ShippingProviderCode,
  })
  provider!: ShippingProviderCode;

  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    default: ShipmentStatus.PENDING,
  })
  status!: ShipmentStatus;

  @Column({ name: 'tracking_number', type: 'varchar', length: 120, nullable: true })
  trackingNumber!: string | null;

  @Column({ name: 'tracking_url', type: 'varchar', length: 500, nullable: true })
  trackingUrl!: string | null;

  @Column({ name: 'label_url', type: 'varchar', length: 500, nullable: true })
  labelUrl!: string | null;

  @Column({ name: 'raw_response', type: 'jsonb', nullable: true })
  rawResponse!: Record<string, unknown> | null;
}
