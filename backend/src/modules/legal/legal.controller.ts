// src/modules/legal/legal.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

import type { Actor } from '../applications/applications.service';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(
    private readonly service: LegalService,
  ) {}

  /*
   * Public dashboard API.
   * Keep this static route before :applicationId.
   */
  @Public()
@Get('cases-requiring-attention')
getCasesRequiringAttention() {
  return this.service.getCasesRequiringAttention();
}

  /*
   * Existing Legal cases API.
   */
  @Get('cases')
  getCases() {
    return this.service.getCases();
  }

  /*
   * Application status API.
   * Keep before the generic :applicationId route.
   */
  @Get(':applicationId/status')
  getStatus(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    return this.service.getStatus(applicationId);
  }

  @Get(':applicationId/assessment')
  getAssessment(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    return this.service.getAssessment(applicationId);
  }

  /*
   * Generic dynamic route should remain after static routes.
   */
  @Get(':applicationId')
  getApplication(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    return this.service.getApplication(applicationId);
  }

  @Post(':applicationId/save-draft')
  saveDraft(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.saveDraft(
      applicationId,
      body,
      user,
    );
  }

  @Post(':applicationId/raise-query')
  raiseQuery(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.raiseQuery(
      applicationId,
      body,
      user,
    );
  }

  @Post(':applicationId/mark-negative')
  markNegative(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.markNegative(
      applicationId,
      body,
      user,
    );
  }

  @Post(':applicationId/approve-to-ops-maker')
  approveToOpsMaker(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.approveToOpsMaker(
      applicationId,
      body,
      user,
    );
  }
}