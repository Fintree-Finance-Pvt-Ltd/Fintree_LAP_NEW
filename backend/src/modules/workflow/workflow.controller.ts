import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { WorkflowService } from './workflow.service';
import { WorkflowTransitionService } from './workflow-transition.service';

@ApiTags('Workflow')
@ApiBearerAuth()
@Controller('workflow')
export class WorkflowController {
  constructor(
    private readonly service: WorkflowService,
    private readonly transitions: WorkflowTransitionService,
  ) {}
  @Post('save-draft/:applicationId') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  saveDraft(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.saveDraft(applicationId, dto, user); }
  @Post('submit-to-bm/:applicationId') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  submitToBm(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.submitToBm(applicationId, dto, user); }
  @Post('send-back/:applicationId') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  sendBack(@Param('applicationId', ParseIntPipe) applicationId: number, @Body() dto: WorkflowActionDto, @CurrentUser() user: Actor) { return this.service.sendBack(applicationId, dto, user); }
  @Get('history/:applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  history(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findHistory(applicationId); }
  @Get('cases') @Permissions(PERMISSIONS.APPLICATION_READ)
  cases(@Query() query: any) { return this.service.findCases(query); }
  @Get(':applicationId/history') @Permissions(PERMISSIONS.APPLICATION_READ)
  approvalHistory(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findHistory(applicationId);
  }
  @Post(':applicationId/transition') @Permissions(PERMISSIONS.APPLICATION_TRANSITION)
  transition(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.transitions.move({
      applicationId,
      action: body?.action,
      decision: body?.decision,
      assignedToUserId: body?.assignedToUserId,
      remarks: body?.remarks,
      payload: body?.payload,
      actor: user || {},
    });
  }
  @Patch(':applicationId/verification') @Permissions(PERMISSIONS.APPLICATION_UPDATE)
  updateVerification(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
  ) {
    const allowed = [
      'rmFieldVisitRequired', 'rmFieldVisitCompleted', 'rmGeoRequired', 'rmGeoCompleted',
      'valuationFieldVisitRequired', 'valuationFieldVisitCompleted',
      'valuationGeoRequired', 'valuationGeoCompleted',
    ];
    const flags = Object.fromEntries(
      allowed.filter((key) => typeof body?.[key] === 'boolean').map((key) => [key, body[key]]),
    );
    return this.transitions.updateVerification(applicationId, flags);
  }
  @Get(':applicationId') @Permissions(PERMISSIONS.APPLICATION_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.find(applicationId); }
}
