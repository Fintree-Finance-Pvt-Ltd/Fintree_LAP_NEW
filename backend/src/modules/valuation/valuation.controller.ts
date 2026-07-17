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
  constructor(private readonly valuationService: ValuationService) {}

  @Get('cases')
  getValuationCases() {
    return this.valuationService.getValuationCases();
  }

  @Get(':applicationId')
  getValuationApplication(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.valuationService.getValuationApplication(applicationId);
  }

  @Post(':applicationId/raise-query')
  raiseTechnicalQuery(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.valuationService.raiseTechnicalQuery(
      applicationId,
      body,
      user,
    );
  }

  @Post(':applicationId/mark-negative')
  markNegative(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.valuationService.markNegative(
      applicationId,
      body,
      user,
    );
  }

  @Post(':applicationId/approve')
  approveAndSendToLegal(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: any,
    @CurrentUser() user: Actor,
  ) {
    return this.valuationService.approveAndSendToLegal(
      applicationId,
      body,
      user,
    );
  }
}