import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@entities/user.entity';

@ApiTags('notifications')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Admin: sipariş bildirim logları' })
  listForOrder(@Param('orderId') orderId: string) {
    return this.notifications.listForOrder(orderId);
  }
}
