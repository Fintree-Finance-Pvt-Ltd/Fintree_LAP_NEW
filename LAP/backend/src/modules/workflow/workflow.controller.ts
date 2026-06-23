import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { WorkflowService } from './workflow.service';

@ApiTags('Workflow')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}
  @Post('save-draft/:applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  saveDraft(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.saveDraft(applicationId, dto, user); }
  @Post('submit-to-bm/:applicationId') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  submitToBm(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.submitToBm(applicationId, dto, user); }
  @Post('send-back/:applicationId') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  sendBack(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.sendBack(applicationId, dto, user); }
  @Get('history/:applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  history(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findHistory(applicationId); }
  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.find(applicationId); }
}
