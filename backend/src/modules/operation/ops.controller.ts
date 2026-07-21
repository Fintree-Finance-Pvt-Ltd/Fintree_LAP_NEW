import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { OpsService } from './ops.service';

@Controller('operations')
export class OpsController {
  constructor(
    private readonly operationsService: OpsService,
  ) {}

  @Get('checker/:applicationId')
  async getCheckerCase(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.operationsService.getCheckerCase(applicationId);

    return {
      success: true,
      message: 'Operations checker case fetched successfully',
      data,
    };
  }

  // GET /api/bm-reviews/queue
  @Get("queue")
  async getSubmittedToBmCases() {
    const applications =
      await this.operationsService.getSubmittedToOpsCheckerCases();

    return {
      success: true,
      applications,
    };
  }
}