import { Module } from '@nestjs/common';
import { ContactService } from '@modules/contact/contact.service';
import { ContactController } from '@modules/contact/contact.controller';

@Module({
  controllers: [ContactController],
  providers: [ContactService],
  exports: [ContactService],
})
export class ContactModule {}
