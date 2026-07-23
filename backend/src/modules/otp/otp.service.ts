import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { CustomerType } from '../../common/enums/customer-profile.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { DataSource, Repository } from 'typeorm';

import { OtpSession } from './entities/otp-session.entity';
import { SmsService } from './sms/sms.service';

import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';

import { WorkflowAction } from '../../common/enums/workflow-action.enum';
import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { createReferenceNumber } from '../../common/utils/reference-number.util';
import { EmailService } from './email/email.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpSession)
    private readonly otpSessions: Repository<OtpSession>,

    private readonly smsService: SmsService,

    private readonly emailService: EmailService,

    private readonly dataSource: DataSource,

    @InjectRepository(Application)
    private readonly applications: Repository<Application>,

    @InjectRepository(CustomerProfile)
    private readonly customerProfiles: Repository<CustomerProfile>,

    @InjectRepository(Workflow)
    private readonly workflows: Repository<Workflow>,

    @InjectRepository(WorkflowHistory)
    private readonly workflowHistory: Repository<WorkflowHistory>,
  ) { }

  /* =====================================================
     SEND OTP
  ===================================================== */

  async sendOtp(mobile: unknown, applicationId?: unknown) {
    const cleanedMobile = this.normalizeMobile(mobile);
    const normalizedApplicationId = this.normalizeOptionalApplicationId(applicationId);

    const now = new Date();

    const lastSession = await this.otpSessions.findOne({
      where: { mobileNumber: cleanedMobile },
      order: { id: 'DESC' },
    });

    const cooldownSeconds = this.getPositiveEnvironmentNumber(
      'OTP_RESEND_COOLDOWN_SECONDS',
      60,
    );

    if (lastSession?.lastSentAt) {
      const elapsedSeconds =
        Math.floor(
          (now.getTime() - new Date(lastSession.lastSentAt).getTime()) / 1000,
        );

      if (elapsedSeconds < cooldownSeconds) {
        const retryAfterSeconds = cooldownSeconds - elapsedSeconds;

        throw new HttpException(
          {
            success: false,
            message: `Wait ${retryAfterSeconds} seconds before requesting another OTP.`,
            retryAfterSeconds,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const otp = String(randomInt(100000, 1000000));

    const expirySeconds = this.getPositiveEnvironmentNumber('OTP_EXPIRY_SECONDS', 300);

    const expiresAt = new Date(now.getTime() + expirySeconds * 1000);

    const session = this.otpSessions.create({
      mobileNumber: cleanedMobile,

      otp,
      verified: false,
      attempts: 0,
      expiresAt,
      lastSentAt: now,
      consentGiven: false,
      applicationId: normalizedApplicationId,
    });

    const savedSession = await this.otpSessions.save(session);

    try {
      await this.smsService.sendOtp(cleanedMobile, otp);
    } catch (error) {
      // Remove the session when SMS sending fails so that the user is not blocked by the resend cooldown.
      try {
        await this.otpSessions.remove(savedSession);
      } catch {
        // Preserve original SMS error.
      }

      throw error;
    }

    const response: Record<string, unknown> = {
      success: true,
      message: 'OTP sent successfully.',
      mobile: this.maskMobile(cleanedMobile),
      expiresInSeconds: expirySeconds,
      resendAfterSeconds: cooldownSeconds,
    };

    // Never expose OTP in production.
    // Enable only for local testing: EXPOSE_OTP_IN_RESPONSE=true
    if (String(process.env.EXPOSE_OTP_IN_RESPONSE || '').toLowerCase() === 'true') {
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
    const cleanedMobile = this.normalizeMobile(mobile);
    const cleanedOtp = this.normalizeOtp(otp);
    const cleanedConsentText = this.normalizeConsentText(consentText);
    const normalizedApplicationId = this.normalizeOptionalApplicationId(applicationId);

    // Always verify only the latest OTP session.
    const session = await this.otpSessions.findOne({
      where: { mobileNumber: cleanedMobile },
      order: { id: 'DESC' },
    });

    if (!session) {
      throw new NotFoundException('OTP session not found. Please request a new OTP.');
    }

    if (
      session.applicationId &&
      normalizedApplicationId &&
      Number(session.applicationId) !== normalizedApplicationId
    ) {
      throw new BadRequestException('OTP session does not belong to this application.');
    }

    if (session.verified) {
      throw new ConflictException('Mobile number has already been verified.');
    }

    const now = new Date();

    if (now.getTime() > new Date(session.expiresAt).getTime()) {
      throw new BadRequestException('OTP has expired. Please request a new OTP.');
    }

    const maximumAttempts = this.getPositiveEnvironmentNumber('OTP_MAX_ATTEMPTS', 5);

    if (Number(session.attempts) >= maximumAttempts) {
      throw new HttpException(
        {
          success: false,
          message:
            'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (String(session.otp) !== cleanedOtp) {
      const nextAttemptCount = Number(session.attempts) + 1;

      await this.otpSessions.update(session.id, { attempts: nextAttemptCount });

      const attemptsRemaining = Math.max(maximumAttempts - nextAttemptCount, 0);

      if (attemptsRemaining === 0) {
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
    session.consentText = cleanedConsentText;
    session.consentAt = now;

    if (normalizedApplicationId) {
      session.applicationId = normalizedApplicationId;
    }

    await this.otpSessions.save(session);
await this.markMobileVerifiedInProfile(
  session.applicationId ? Number(session.applicationId) : null,
  cleanedMobile,
);
    return {
      success: true,
      message: 'Mobile verified and consent saved successfully.',
      data: {
        mobile: this.maskMobile(cleanedMobile),
        verified: true,
        consentGiven: true,
        applicationId: session.applicationId ? Number(session.applicationId) : null,
        consentAt: session.consentAt,
      },
    };
  }

  /* =====================================================
     OTP-GATED: VERIFY OTP AND CREATE APPLICATION
     POST /api/otp/verify-and-create
  ===================================================== */
  async verifyOtpAndCreate(body: Record<string, any>) {
    const mobile = this.normalizeMobile(body.mobile);
    const otp = this.normalizeOtp(body.otp);
    const consentText = this.normalizeConsentText(body.consentText);
    const customerName = String(body.customerName || '').trim();
    if (!customerName) {
      throw new BadRequestException('customerName is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const session = await manager.getRepository(OtpSession)
        .createQueryBuilder('session')
        .setLock('pessimistic_write')
        .where('session.mobileNumber = :mobile', { mobile })
        .orderBy('session.id', 'DESC')
        .getOne();

      if (!session) throw new BadRequestException('OTP not generated.');

      // A previous non-atomic attempt may have verified the OTP and failed
      // before linking an application. Allow that exact session to resume.
      if (session.verified && session.applicationId) {
        throw new BadRequestException('OTP already verified.');
      }
      if (new Date() > session.expiresAt) {
        throw new BadRequestException('OTP expired.');
      }
      if (session.otp !== otp) {
        session.attempts += 1;
        await manager.save(session);
        throw new BadRequestException('Invalid OTP.');
      }

      const application = manager.create(Application, {
        applicationNumber: `TMP-${Date.now()}-${randomInt(100000, 999999)}`,
        customerName,
        mobile,
        status: ApplicationStatus.DRAFT,
        stage: ApplicationStage.RM,
      });
      const saved = await manager.save(application);
      saved.applicationNumber = createReferenceNumber('LAP', saved.id);
      await manager.save(saved);

      const names = customerName.split(/\s+/);
      const firstName = names[0] || '';
      const lastName = names.length > 1 ? names[names.length - 1] : firstName;
      const middleName = names.length > 2 ? names.slice(1, -1).join(' ') : null;

      // Specify only established lead-profile columns. This keeps OTP lead
      // creation compatible while workflow schema migrations are pending.
      await manager.query(
        `INSERT INTO customer_profiles (
          application_id, customer_type, first_name, middle_name,
          last_name, mobile, mobile_verified
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saved.id,
          CustomerType.INDIVIDUAL,
          firstName,
          middleName,
          lastName,
          mobile,
          1,
        ],
      );

      session.verified = true;
      session.consentGiven = true;
      session.consentText = consentText;
      session.consentAt = new Date();
      session.applicationId = saved.id;
      await manager.save(session);

      return {
        success: true,
        message: 'Lead created successfully.',
        data: {
          applicationId: saved.id,
          applicationNumber: saved.applicationNumber,
          customerName: saved.customerName,
          mobile: saved.mobile,
        },
      };
    });
  }


  private async markMobileVerifiedInProfile(
  applicationId: number | null | undefined,
  mobile: string,
) {
  if (!applicationId) {
    return;
  }

  await this.customerProfiles.update(
    { applicationId },
    {
      mobile,
      mobileVerified: true,
    },
  );
}

private async markEmailVerifiedInProfile(
  applicationId: number | null | undefined,
  email: string,
) {
  if (!applicationId) {
    return;
  }

  await this.customerProfiles.update(
    { applicationId },
    {
      email,
      emailVerified: true,
    },
  );
}

  /* =====================================================
     HELPERS
  ===================================================== */

  private normalizeMobile(mobile: unknown) {
    if (mobile === undefined || mobile === null || mobile === '') {
      throw new BadRequestException('Mobile number is required.');
    }

    const cleanedMobile = String(mobile).replace(/\D/g, '');

    if (cleanedMobile.length < 10 || cleanedMobile.length > 15) {
      throw new BadRequestException('Mobile number must contain between 10 and 15 digits.');
    }

    return cleanedMobile;
  }

  private normalizeOtp(otp: unknown) {
    if (otp === undefined || otp === null || otp === '') {
      throw new BadRequestException('OTP is required.');
    }

    const cleanedOtp = String(otp).replace(/\D/g, '').trim();

    if (!/^\d{6}$/.test(cleanedOtp)) {
      throw new BadRequestException('OTP must contain exactly 6 digits.');
    }

    return cleanedOtp;
  }

  private normalizeConsentText(consentText: unknown) {
    if (typeof consentText !== 'string') {
      throw new BadRequestException('consentText is required and must be a string.');
    }

    const cleanedConsentText = consentText.trim();

    if (!cleanedConsentText) {
      throw new BadRequestException('consentText is required.');
    }

    if (cleanedConsentText.length > 5000) {
      throw new BadRequestException('consentText must not exceed 5000 characters.');
    }

    return cleanedConsentText;
  }

  private normalizeOptionalApplicationId(applicationId: unknown) {
    if (applicationId === undefined || applicationId === null || applicationId === '') {
      return undefined;
    }

    const normalized = Number(applicationId);

    if (!Number.isInteger(normalized) || normalized <= 0) {
      throw new BadRequestException('applicationId must be a valid positive integer.');
    }

    return normalized;
  }

  private getPositiveEnvironmentNumber(name: string, fallback: number) {
    const value = Number(process.env[name]);

    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }

    return Math.floor(value);
  }

  private maskMobile(mobile: string) {
    if (mobile.length <= 4) {
      return mobile;
    }

    return `${'*'.repeat(mobile.length - 4)}${mobile.slice(-4)}`;
  }

  async sendEmailOtp(body: {
    email?: string;
    applicationId?: number | string;
  }) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email) {
      throw new BadRequestException(
        'Email ID is required.',
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException(
        'Please enter a valid email ID.',
      );
    }

    let applicationId: number | null = null;

    if (
      body.applicationId !== undefined &&
      body.applicationId !== null &&
      body.applicationId !== ''
    ) {
      applicationId = Number(body.applicationId);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        throw new BadRequestException(
          'Invalid application ID.',
        );
      }
    }

    const currentTime = new Date();

    const existingSession =
      await this.otpSessions.findOne({
        where: {
          emailId: email,
          verified: false,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    if (existingSession) {
      const lastSentTime = new Date(
        existingSession.lastSentAt,
      ).getTime();

      const secondsPassed = Math.floor(
        (currentTime.getTime() - lastSentTime) /
        1000,
      );

      if (secondsPassed < 60) {
        throw new HttpException(
          `Please wait ${60 - secondsPassed
          } seconds before resending OTP.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const otp = randomInt(
      100000,
      1000000,
    ).toString();

    const expiresAt = new Date(
      currentTime.getTime() + 5 * 60 * 1000,
    );

    let otpSession: OtpSession;
    let isNewSession = false;

    if (existingSession) {
      existingSession.emailId = email;

      // Use entity property name, not mobile_number.
      existingSession.mobileNumber = null;

      existingSession.otp = otp;
      existingSession.verified = false;
      existingSession.attempts = 0;
      existingSession.expiresAt = expiresAt;
      existingSession.lastSentAt = currentTime;
      existingSession.applicationId =
        applicationId;

      existingSession.consentGiven = false;
      existingSession.consentText = null;
      existingSession.consentAt = null;

      otpSession =
        await this.otpSessions.save(
          existingSession,
        );
    } else {
      isNewSession = true;

      otpSession =
        this.otpSessions.create({
          // Use entity property names here.
          emailId: email,
          mobileNumber: null,

          otp,
          verified: false,
          attempts: 0,
          expiresAt,
          lastSentAt: currentTime,
          applicationId,
          consentGiven: false,

        });

      otpSession =
        await this.otpSessions.save(
          otpSession,
        );
    }

    try {
      await this.emailService.sendOtp(
        email,
        otp,
      );
    } catch (error) {
      if (isNewSession) {
        await this.otpSessions.delete(
          otpSession.id,
        );
      }

      throw error;
    }

    return {
      success: true,
      message:
        'OTP sent successfully to email ID.',
      data: {
        sessionId: otpSession.id,
        emailId: otpSession.emailId,
        expiresInSeconds: 300,
      },
    };
  }
  async verifyEmailOtp(body: {
    email?: string;
    otp?: string;
    sessionId?: number | string;
    applicationId?: number | string;
    consentGiven?: boolean;
    consentText?: string;
  }) {
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    const otp = String(body.otp || '').trim();
    const sessionId = Number(body.sessionId);

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      throw new BadRequestException(
        'Please enter a valid email ID.',
      );
    }

    if (
      !Number.isInteger(sessionId) ||
      sessionId <= 0
    ) {
      throw new BadRequestException(
        'Valid OTP session ID is required.',
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      throw new BadRequestException(
        'OTP must contain exactly 6 digits.',
      );
    }

    const session =
      await this.otpSessions.findOne({
        where: {
          id: sessionId,
          emailId: email,
        },
      });

    if (!session) {
      throw new NotFoundException(
        'Email OTP session was not found.',
      );
    }

    if (session.mobileNumber !== null) {
      throw new BadRequestException(
        'This OTP session is not an email OTP session.',
      );
    }

if (session.verified) {
  const finalApplicationId =
    body.applicationId !== undefined &&
    body.applicationId !== null &&
    body.applicationId !== ''
      ? Number(body.applicationId)
      : session.applicationId
        ? Number(session.applicationId)
        : null;

  await this.markEmailVerifiedInProfile(
    finalApplicationId,
    email,
  );

  return {
    success: true,
    message: 'Email ID is already verified.',
    data: {
      verified: true,
      sessionId: session.id,
      emailId: session.emailId,
      applicationId: finalApplicationId,
    },
  };
}

    if (
      new Date(session.expiresAt).getTime() <
      Date.now()
    ) {
      throw new UnauthorizedException(
        'OTP has expired. Please resend OTP.',
      );
    }

    if (session.attempts >= 5) {
      throw new HttpException(
        'Maximum OTP attempts exceeded. Please resend OTP.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (session.otp !== otp) {
      session.attempts += 1;

      await this.otpSessions.save(
        session,
      );

      throw new UnauthorizedException(
        `Invalid OTP. ${Math.max(
          5 - session.attempts,
          0,
        )} attempts remaining.`,
      );
    }

    session.verified = true;
    session.attempts += 1;

    if (body.consentGiven === true) {
      session.consentGiven = true;
      session.consentText =
        body.consentText ||
        'Customer consented to email verification.';
      session.consentAt = new Date();
    }

    await this.otpSessions.save(
      session,
    );

    const finalApplicationId =
  body.applicationId !== undefined &&
  body.applicationId !== null &&
  body.applicationId !== ''
    ? Number(body.applicationId)
    : session.applicationId
      ? Number(session.applicationId)
      : null;

await this.markEmailVerifiedInProfile(
  finalApplicationId,
  email,
);

    return {
      success: true,
      message:
        'Email ID verified successfully.',
      data: {
        verified: true,
        sessionId: session.id,
        emailId: session.emailId,
        applicationId:
          session.applicationId || null,
      },
    };
  }



}

