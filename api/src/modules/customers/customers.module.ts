import { Module } from '@nestjs/common';
import { CustomersController } from '@modules/customers/customers.controller';
import { CustomersService } from '@modules/customers/customers.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
