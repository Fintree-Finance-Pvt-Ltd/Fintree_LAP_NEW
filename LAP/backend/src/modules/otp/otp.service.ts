import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  randomInt,
} from 'crypto';

import {
  Repository,
} from 'typeorm';

import { OtpSession } from './entities/otp-session.entity';
import { SmsService } from './sms/sms.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpSession)
    private readonly otpSessions:
      Repository<OtpSession>,

    private readonly smsService:
      SmsService,
  ) {}

  /* =====================================================
     SEND OTP
  ===================================================== */

  async sendOtp(
    mobile: unknown,
    applicationId?: unknown,
  ) {
    const cleanedMobile =
      this.normalizeMobile(mobile);

    const normalizedApplicationId =
      this.normalizeOptionalApplicationId(
        applicationId,
      );

    const now = new Date();

    const lastSession =
      await this.otpSessions.findOne({
        where: {
          mobileNumber:
            cleanedMobile,
        },

        order: {
          id: 'DESC',
        },
      });

    const cooldownSeconds =
      this.getPositiveEnvironmentNumber(
        'OTP_RESEND_COOLDOWN_SECONDS',
        60,
      );

    if (lastSession?.lastSentAt) {
      const elapsedSeconds =
        Math.floor(
          (now.getTime() -
            new Date(
              lastSession.lastSentAt,
            ).getTime()) /
            1000,
        );

      if (
        elapsedSeconds <
        cooldownSeconds
      ) {
        const retryAfterSeconds =
          cooldownSeconds -
          elapsedSeconds;

        throw new HttpException(
          {
            success: false,

            message:
              `Wait ${retryAfterSeconds} seconds before requesting another OTP.`,

            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const otp = String(
      randomInt(
        100000,
        1000000,
      ),
    );

    const expirySeconds =
      this.getPositiveEnvironmentNumber(
        'OTP_EXPIRY_SECONDS',
        300,
      );

    const expiresAt =
      new Date(
        now.getTime() +
          expirySeconds * 1000,
      );

    const session =
      this.otpSessions.create({
        mobileNumber:
          cleanedMobile,

        otp,

        verified: false,
        attempts: 0,

        expiresAt,
        lastSentAt: now,

        consentGiven: false,

        applicationId:
          normalizedApplicationId,
      });

    const savedSession =
      await this.otpSessions.save(
        session,
      );

    try {
      await this.smsService.sendOtp(
        cleanedMobile,
        otp,
      );
    } catch (error) {
      /*
       * Remove the session when SMS sending fails so that
       * the user is not blocked by the resend cooldown.
       */
      try {
        await this.otpSessions.remove(
          savedSession,
        );
      } catch {
        // Preserve original SMS error.
      }

      throw error;
    }

    const response: Record<
      string,
      unknown
    > = {
      success: true,
      message:
        'OTP sent successfully.',

      mobile:
        this.maskMobile(
          cleanedMobile,
        ),

      expiresInSeconds:
        expirySeconds,

      resendAfterSeconds:
        cooldownSeconds,
    };

    /*
     * Never expose OTP in production.
     *
     * Enable only for local testing:
     * EXPOSE_OTP_IN_RESPONSE=true
     */
    if (
      String(
        process.env
          .EXPOSE_OTP_IN_RESPONSE ||
          '',
      ).toLowerCase() === 'true'
    ) {
      response.otp = otp;
    }

    return response;
  }

  /* =====================================================
     VERIFY OTP AND SAVE CONSENT
  ===================================================== */

  async verifyOtp(
    mobile: unknown,
    otp: unknown,
    consentText: unknown,
    applicationId?: unknown,
  ) {
    const cleanedMobile =
      this.normalizeMobile(mobile);

    const cleanedOtp =
      this.normalizeOtp(otp);

    const cleanedConsentText =
      this.normalizeConsentText(
        consentText,
      );

    const normalizedApplicationId =
      this.normalizeOptionalApplicationId(
        applicationId,
      );

    /*
     * Always verify only the latest OTP session.
     * An older OTP must not work after a new OTP is sent.
     */
    const session =
      await this.otpSessions.findOne({
        where: {
          mobileNumber:
            cleanedMobile,
        },

        order: {
          id: 'DESC',
        },
      });

    if (!session) {
      throw new NotFoundException(
        'OTP session not found. Please request a new OTP.',
      );
    }

    if (
      session.applicationId &&
      normalizedApplicationId &&
      Number(
        session.applicationId,
      ) !==
        normalizedApplicationId
    ) {
      throw new BadRequestException(
        'OTP session does not belong to this application.',
      );
    }

    if (session.verified) {
      throw new ConflictException(
        'Mobile number has already been verified.',
      );
    }

    const now = new Date();

    if (
      now.getTime() >
      new Date(
        session.expiresAt,
      ).getTime()
    ) {
      throw new BadRequestException(
        'OTP has expired. Please request a new OTP.',
      );
    }

    const maximumAttempts =
      this.getPositiveEnvironmentNumber(
        'OTP_MAX_ATTEMPTS',
        5,
      );

    if (
      Number(session.attempts) >=
      maximumAttempts
    ) {
      throw new HttpException(
        {
          success: false,

          message:
            'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (
      String(session.otp) !==
      cleanedOtp
    ) {
      const nextAttemptCount =
        Number(session.attempts) +
        1;

      await this.otpSessions.update(
        session.id,
        {
          attempts:
            nextAttemptCount,
        },
      );

      const attemptsRemaining =
        Math.max(
          maximumAttempts -
            nextAttemptCount,
          0,
        );

      if (
        attemptsRemaining === 0
      ) {
        throw new HttpException(
          {
            success: false,

            message:
              'Maximum OTP verification attempts exceeded. Please request a new OTP.',

            attemptsRemaining: 0,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      throw new BadRequestException({
        success: false,
        message: 'Invalid OTP.',
        attemptsRemaining,
      });
    }

    session.verified = true;
    session.consentGiven = true;
    session.consentText =
      cleanedConsentText;
    session.consentAt = now;

    if (
      normalizedApplicationId
    ) {
      session.applicationId =
        normalizedApplicationId;
    }

    await this.otpSessions.save(
      session,
    );

    return {
      success: true,

      message:
        'Mobile verified and consent saved successfully.',

      data: {
        mobile:
          this.maskMobile(
            cleanedMobile,
          ),

        verified: true,
        consentGiven: true,

        applicationId:
          session.applicationId
            ? Number(
                session.applicationId,
              )
            : null,

        consentAt:
          session.consentAt,
      },
    };
  }

  /* =====================================================
     HELPERS
  ===================================================== */

  private normalizeMobile(
    mobile: unknown,
  ) {
    if (
      mobile === undefined ||
      mobile === null ||
      mobile === ''
    ) {
      throw new BadRequestException(
        'Mobile number is required.',
      );
    }

    const cleanedMobile =
      String(mobile).replace(
        /\D/g,
        '',
      );

    if (
      cleanedMobile.length < 10 ||
      cleanedMobile.length > 15
    ) {
      throw new BadRequestException(
        'Mobile number must contain between 10 and 15 digits.',
      );
    }

    return cleanedMobile;
  }

  private normalizeOtp(
    otp: unknown,
  ) {
    if (
      otp === undefined ||
      otp === null ||
      otp === ''
    ) {
      throw new BadRequestException(
        'OTP is required.',
      );
    }

    const cleanedOtp =
      String(otp)
        .replace(/\D/g, '')
        .trim();

    if (
      !/^\d{6}$/.test(
        cleanedOtp,
      )
    ) {
      throw new BadRequestException(
        'OTP must contain exactly 6 digits.',
      );
    }

    return cleanedOtp;
  }

  private normalizeConsentText(
    consentText: unknown,
  ) {
    if (
      typeof consentText !==
      'string'
    ) {
      throw new BadRequestException(
        'consentText is required and must be a string.',
      );
    }

    const cleanedConsentText =
      consentText.trim();

    if (!cleanedConsentText) {
      throw new BadRequestException(
        'consentText is required.',
      );
    }

    if (
      cleanedConsentText.length >
      5000
    ) {
      throw new BadRequestException(
        'consentText must not exceed 5000 characters.',
      );
    }

    return cleanedConsentText;
  }

  private normalizeOptionalApplicationId(
    applicationId: unknown,
  ) {
    if (
      applicationId === undefined ||
      applicationId === null ||
      applicationId === ''
    ) {
      return undefined;
    }

    const normalized =
      Number(applicationId);

    if (
      !Number.isInteger(
        normalized,
      ) ||
      normalized <= 0
    ) {
      throw new BadRequestException(
        'applicationId must be a valid positive integer.',
      );
    }

    return normalized;
  }

  private getPositiveEnvironmentNumber(
    name: string,
    fallback: number,
  ) {
    const value =
      Number(process.env[name]);

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return fallback;
    }

    return Math.floor(value);
  }

  private maskMobile(
    mobile: string,
  ) {
    if (mobile.length <= 4) {
      return mobile;
    }

    return `${'*'.repeat(
      mobile.length - 4,
    )}${mobile.slice(-4)}`;
  }
}