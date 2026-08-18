import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { InboxService } from '@modules/notifications/inbox.service';
import {
  InboxQueryDto,
  RegisterDeviceDto,
  UnregisterDeviceDto,
  UpdateNotificationPrefsDto,
} from '@modules/notifications/dto/inbox.dto';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@entities/user.entity';
import { PushPlatform } from '@entities/device-push-token.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly inbox: InboxService,
  ) {}

  @Roles(UserRole.ADMIN)
  @Get('order/:orderId')
  @ApiOperation({ summary: 'Admin: sipariş bildirim logları' })
  listForOrder(@Param('orderId') orderId: string) {
    return this.notifications.listForOrder(orderId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Kullanıcının bildirimleri' })
  listInbox(@CurrentUser() user: User, @Query() query: InboxQueryDto) {
    return this.inbox.listInbox(user.id, query.page, query.limit);
  }

  @Get('inbox/unread-count')
  @ApiOperation({ summary: 'Okunmamış bildirim sayısı' })
  unreadCount(@CurrentUser() user: User) {
    return this.inbox.unreadCount(user.id);
  }

  @Patch('inbox/read-all')
  @ApiOperation({ summary: 'Tümünü okundu işaretle' })
  markAllRead(@CurrentUser() user: User) {
    return this.inbox.markAllRead(user.id);
  }

  @Patch('inbox/:id/read')
  @ApiOperation({ summary: 'Bildirimi okundu işaretle' })
  markRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.inbox.markRead(user.id, id);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Bildirim tercihleri' })
  getPreferences(@CurrentUser() user: User) {
    return this.inbox.getPreferences(user.id);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Bildirim tercihlerini güncelle' })
  updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateNotificationPrefsDto,
  ) {
    return this.inbox.updatePreferences(user.id, dto);
  }

  @Post('devices')
  @ApiOperation({ summary: 'Push cihaz token kaydet (Expo)' })
  registerDevice(@CurrentUser() user: User, @Body() dto: RegisterDeviceDto) {
    return this.inbox.registerDevice(
      user.id,
      dto.token,
      dto.platform || PushPlatform.UNKNOWN,
    );
  }

  @Delete('devices')
  @ApiOperation({ summary: 'Push cihaz token sil' })
  unregisterDevice(@CurrentUser() user: User, @Body() dto: UnregisterDeviceDto) {
    return this.inbox.unregisterDevice(user.id, dto.token);
  }
}
