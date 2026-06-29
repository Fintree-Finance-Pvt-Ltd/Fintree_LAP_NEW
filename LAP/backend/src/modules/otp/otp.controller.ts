import {
  BadRequestException,
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import {
  ApiTags,
} from '@nestjs/swagger';

import { OtpService } from './otp.service';

@ApiTags('OTP')
@Controller('otp')
export class OtpController {
  constructor(
    private readonly otpService:
      OtpService,
  ) { }

  /*
   * Both routes work:
   *
   * POST /api/otp/send
   * POST /api/otp/send-otp
   */
  @Post([
    'send',
    'send-otp',
  ])
  sendOtp(
    @Body()
    body: Record<string, unknown>,
  ) {
    if (
      !body ||
      typeof body !== 'object'
    ) {
      throw new BadRequestException(
        'Request body is required.',
      );
    }

    return this.otpService.sendOtp(
      body.mobile,
      body.applicationId,
    );
  }

  /*
   * Both routes work:
   *
   * POST /api/otp/verify
   * POST /api/otp/verify-otp
   */
  @Post([
    'verify',
    'verify-otp',
  ])
  verifyOtp(
    @Body()
    body: Record<string, unknown>,
  ) {
    if (
      !body ||
      typeof body !== 'object'
    ) {
      throw new BadRequestException(
        'Request body is required.',
      );
    }

    return this.otpService.verifyOtp(
      body.mobile,
      body.otp,
      body.consentText,
      body.applicationId,
    );
  }

  /*
   * OTP verify AND create application (OTP-gated lead creation)
   */
  @Post([
    'verify-and-create',
    'verify-and-create-application',
  ])
  verifyOtpAndCreate(
    @Body()
    body: Record<string, unknown>,
  ) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException(
        'Request body is required.',
      );
    }

    return this.otpService.verifyOtpAndCreate(
      body,
    );
  }

  @Post('email/send')
  // sendEmailOtp(
  //   @Body()
  //   body: {
  //     email?: string;
  //     applicationId?: number | string;
  //   },
  // ) {
  //   return this.otpService.sendEmailOtp(body);
  // }
  sendEmailOtp(@Body() body: any) {
    console.log(
      'EMAIL OTP CONTROLLER HIT:',
      body,
    );

    return this.otpService.sendEmailOtp(
      body,
    );
  }
  // New email endpoint
  @Post('email/verify')
  verifyEmailOtp(
    @Body()
    body: {
      email?: string;
      otp?: string;
      sessionId?: number | string;
      applicationId?: number | string;
      consentGiven?: boolean;
      consentText?: string;
    },
  ) {
    return this.otpService.verifyEmailOtp(
      body,
    );
  }

}
