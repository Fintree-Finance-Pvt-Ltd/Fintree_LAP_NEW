// src/co-applicants/co-applicants.controller.ts
import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CoApplicantsService } from './co-applicants.service';


@ApiTags('Co Applicants')
@ApiBearerAuth()
@Controller('co-applicants')
export class CoApplicantsController {
  constructor(private readonly service: CoApplicantsService) {}

  @Get('application/:applicationId')

  @ApiOperation({ summary: 'Retrieve all joint co-applicants under an active application context' })
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.service.findByApplication(applicationId);
  }

  @Post('save-CoApplicants')
  @ApiOperation({ summary: 'Atomic synchronization workflow for multi-card UI layouts' })
  saveBulk(@Body() dto: any) {
    return this.service.saveBulk(dto);
  }
}