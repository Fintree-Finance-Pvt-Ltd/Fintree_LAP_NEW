import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { OpsService } from './ops.service';
import { Request } from 'express';


@Controller('operations')
export class OpsController {
  constructor(
    private readonly operationsService: OpsService,
  ) {}

   @Get('head/:applicationId')
  async getOpsHeadCase(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.operationsService.getOpsHeadCase(applicationId);

    return {
      success: true,
      message: 'Operations head case fetched successfully',
      data,
    };
  }


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
  async getSubmittedToBmCases(
    @Req() request : Request,
  ) {

    const user = request.user as any;
    const applications =
      await this.operationsService.getSubmittedToOpsCheckerCases(user,);

    return {
      success: true,
      applications,
    };
  }
}