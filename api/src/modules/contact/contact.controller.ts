import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContactService } from '@modules/contact/contact.service';
import {
  CreateContactMessageDto,
  MarkContactReadDto,
  NewsletterSubscribeDto,
} from '@modules/contact/dto/contact.dto';
import { Public } from '@common/decorators/public.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';

@ApiTags('contact')
@Controller()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Public()
  @Post('contact')
  @ApiOperation({ summary: 'İletişim formu gönder' })
  create(@Body() dto: CreateContactMessageDto) {
    return this.contactService.createMessage(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('contact/admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: iletişim mesajları' })
  list() {
    return this.contactService.listMessages();
  }

  @Roles(UserRole.ADMIN)
  @Get('contact/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: iletişim mesajları (alias)' })
  listMessagesAlias() {
    return this.contactService.listMessages();
  }

  @Roles(UserRole.ADMIN)
  @Patch('contact/admin/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: mesajı okundu işaretle' })
  markRead(@Param('id') id: string, @Body() dto: MarkContactReadDto) {
    return this.contactService.markRead(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @Patch('contact/messages/:id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: mesajı okundu (alias)' })
  markReadAlias(@Param('id') id: string, @Body() dto: MarkContactReadDto) {
    return this.contactService.markRead(id, dto);
  }

  @Public()
  @Post('newsletter/subscribe')
  @ApiOperation({ summary: 'Bülten aboneliği' })
  subscribe(@Body() dto: NewsletterSubscribeDto) {
    return this.contactService.subscribeNewsletter(dto);
  }

  @Public()
  @Post('newsletter')
  @ApiOperation({ summary: 'Bülten aboneliği (kısa yol)' })
  subscribeShort(@Body() dto: NewsletterSubscribeDto) {
    return this.contactService.subscribeNewsletter(dto);
  }

  @Roles(UserRole.ADMIN)
  @Get('newsletter/subscribers')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: bülten aboneleri' })
  listSubscribers() {
    return this.contactService.listSubscribers();
  }
}
