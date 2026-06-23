import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { DashboardsService } from './dashboards.service';

@ApiTags('RM Dashboard')
@ApiBearerAuth()
@Controller('rm/dashboard')
export class DashboardsController {
  constructor(private readonly service: DashboardsService) {}
  @Get() @Permissions(PERMISSIONS.DASHBOARD_READ)
  rm(@CurrentUser() user: Actor) { return this.service.rm(user); }
}
