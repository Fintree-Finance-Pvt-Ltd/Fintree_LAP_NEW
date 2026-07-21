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
import type { Actor } from '../applications/applications.service';
import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(private readonly service: LegalService) {}


  //   @Get('cases-requiring-attention')
  // getCasesRequiringAttention() {
  //   return this.service.getCasesRequiringAttention();
  // }

  // @Get(':applicationId/status')
  // getStatus(
  //   @Param('applicationId', ParseIntPipe) id: number,
  // ) {
  //   return this.service.getStatus(id);
  // }
  
  @Get('cases')
  getCases() {
    return this.service.getCases();
  }

  @Get(':applicationId')
  getApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.service.getApplication(applicationId);
  }

  @Get(':applicationId/assessment')
  getAssessment(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.service.getAssessment(applicationId);
  }

  @Post(':applicationId/save-draft')
  saveDraft(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.saveDraft(applicationId, body, user);
  }

  @Post(':applicationId/raise-query')
  raiseQuery(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.raiseQuery(applicationId, body, user);
  }

  @Post(':applicationId/mark-negative')
  markNegative(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.markNegative(applicationId, body, user);
  }

  @Post(':applicationId/approve-to-ops-maker')
  approveToOpsMaker(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.approveToOpsMaker(applicationId, body, user);
  }
}