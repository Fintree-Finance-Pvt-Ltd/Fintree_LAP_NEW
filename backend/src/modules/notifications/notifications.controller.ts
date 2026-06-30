import { Controller, Get, Param, ParseIntPipe, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}
  @Get() @Permissions(PERMISSIONS.NOTIFICATION_READ)
  findMine(@CurrentUser() user: Actor) { return this.service.findMine(user); }
  @Put(':id/read') @Permissions(PERMISSIONS.NOTIFICATION_READ)
  markRead(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: Actor) { return this.service.markRead(id, user); }
}
