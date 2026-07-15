import { Module } from '@nestjs/common';
import { TrackingGateway } from '@modules/tracking/tracking.gateway';

@Module({
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule {}
