import { Module } from '@nestjs/common';
import { AddressesService } from '@modules/addresses/addresses.service';
import { AddressesController } from '@modules/addresses/addresses.controller';

@Module({
  controllers: [AddressesController],
  providers: [AddressesService],
  exports: [AddressesService],
})
export class AddressesModule {}
