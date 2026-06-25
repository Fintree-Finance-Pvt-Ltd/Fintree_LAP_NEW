import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { FieldVisitsService } from '../visits/field-visits.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number | string;
    userId?: number | string;
    sub?: number | string;
  };
};

@Controller('applications/:applicationId/field-visits')
export class FieldVisitsController {
  constructor(private readonly fieldVisitsService: FieldVisitsService) {}

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeVisit(
    @Param('applicationId', ParseIntPipe) applicationId: number,
    @Body() body: Record<string, unknown>,
    @Req() request: AuthenticatedRequest,
  ) {
    const createdBy =
      request.user?.id ?? request.user?.userId ?? request.user?.sub ?? null;

    const data = await this.fieldVisitsService.completeVisit(
      applicationId,
      body,
      createdBy,
    );

    return {
      success: true,
      message: data.alreadyCompleted
        ? 'Visit was already completed'
        : 'Visit completed successfully',
      data,
    };
  }

  @Get('status')
  async getVisitStatus(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return {
      success: true,
      data: await this.fieldVisitsService.getVisitStatus(applicationId),
    };
  }

  @Get('history')
  async getVisitHistory(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return {
      success: true,
      data: await this.fieldVisitsService.getVisitHistory(applicationId),
    };
  }
}
