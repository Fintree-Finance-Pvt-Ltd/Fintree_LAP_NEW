// src/co-applicants/co-applicants.controller.ts
import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CoApplicantsService } from './co-applicants.service';
import { CoApplicantVerificationService } from './co-applicant-verification.service';


@ApiTags('Co Applicants')
@ApiBearerAuth()
@Controller('co-applicants')
export class CoApplicantsController {
  constructor(
    private readonly service: CoApplicantsService,
    private readonly verification: CoApplicantVerificationService,
  ) {}

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

  @Post(':id/mobile/send-otp')
  @HttpCode(HttpStatus.OK)
  sendMobileOtp(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.verification.sendMobileOtp(id, body || {});
  }

  @Post(':id/mobile/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyMobileOtp(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.verification.verifyMobileOtp(id, body || {});
  }

  @Post(':id/email/send-otp')
  @HttpCode(HttpStatus.OK)
  sendEmailOtp(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.verification.sendEmailOtp(id, body || {});
  }

  @Post(':id/email/verify-otp')
  @HttpCode(HttpStatus.OK)
  verifyEmailOtp(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.verification.verifyEmailOtp(id, body || {});
  }

  @Post(':id/pan/verify')
  @HttpCode(HttpStatus.OK)
  verifyPan(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.verification.verifyPan(id, body || {});
  }

  @Post(':id/aadhaar/init')
  @HttpCode(HttpStatus.OK)
  initAadhaar(@Param('id', ParseIntPipe) id: number) {
    return this.verification.initAadhaar(id);
  }

  @Get(':id/aadhaar/status')
  getAadhaarStatus(@Param('id', ParseIntPipe) id: number) {
    return this.verification.getStatus(id);
  }
}
