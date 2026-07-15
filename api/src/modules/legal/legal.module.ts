import { Module } from '@nestjs/common';
import { LegalService } from '@modules/legal/legal.service';
import { LegalController } from '@modules/legal/legal.controller';

@Module({
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}
