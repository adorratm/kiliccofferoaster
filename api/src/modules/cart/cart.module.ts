import { Module } from '@nestjs/common';
import { CartService } from '@modules/cart/cart.service';
import { CartController } from '@modules/cart/cart.controller';

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
