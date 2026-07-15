import { Module } from '@nestjs/common';
import { MarketplaceService } from '@modules/marketplace/marketplace.service';
import { MarketplaceController } from '@modules/marketplace/marketplace.controller';
import {
  TrendyolAdapter,
  HepsiburadaAdapter,
  N11Adapter,
} from '@modules/marketplace/adapters/providers';

@Module({
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    TrendyolAdapter,
    HepsiburadaAdapter,
    N11Adapter,
  ],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
