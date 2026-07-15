export const QUEUE_NOTIFICATIONS = 'notifications';
export const QUEUE_SHIPPING_POLL = 'shipping-poll';

export type NotificationJobPayload = {
  orderId: string;
  shipmentId?: string | null;
  template: string;
  channels: Array<'email' | 'sms'>;
  context?: Record<string, unknown>;
};

export type ShippingPollJobPayload = {
  reason?: string;
};
