

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
import { ValuationService } from './valuation.service';

@Controller('valuation')
export class ValuationController {
  constructor(private readonly service: ValuationService) {}

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

  @Post(':applicationId/approve')
  approveToLegal(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.service.approveToLegal(applicationId, body, user);
  }
}