import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
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

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OtpSession)
    private readonly otpSessions: Repository<OtpSession>,

    private readonly smsService: SmsService,

    private readonly dataSource: DataSource,

    @InjectRepository(Application)
    private readonly applications: Repository<Application>,

    @InjectRepository(CustomerProfile)
    private readonly customerProfiles: Repository<CustomerProfile>,

    @InjectRepository(Workflow)
    private readonly workflows: Repository<Workflow>,

    @InjectRepository(WorkflowHistory)
    private readonly workflowHistory: Repository<WorkflowHistory>,
  ) {}

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

  const session = await this.otpSessions.findOne({
    where: {
      mobileNumber: mobile,
    },
    order: {
      id: 'DESC',
    },
  });

  if (!session) {
    throw new BadRequestException('OTP not generated.');
  }

  if (session.verified) {
    throw new BadRequestException('OTP already verified.');
  }

  if (new Date() > session.expiresAt) {
    throw new BadRequestException('OTP expired.');
  }

  if (session.otp !== otp) {
    session.attempts += 1;
    await this.otpSessions.save(session);

    throw new BadRequestException('Invalid OTP.');
  }

  // OTP Verified
  session.verified = true;
  session.consentGiven = true;
  session.consentText = consentText;
  session.consentAt = new Date();

  await this.otpSessions.save(session);

  // Create Application
  const application = this.applications.create({
    applicationNumber: 'TEMP',
    customerName,
    mobile,
    status: ApplicationStatus.DRAFT,
    stage: ApplicationStage.RM,
    version: 1,
  });

  const saved = await this.applications.save(application);

  saved.applicationNumber = createReferenceNumber('LAP', saved.id);

  await this.applications.save(saved);

  // Split Customer Name
  const names = customerName.split(/\s+/);

  const firstName = names[0] || '';
  const lastName =
    names.length > 1 ? names[names.length - 1] : '';

  const middleName =
    names.length > 2
      ? names.slice(1, -1).join(' ')
      : null;

  // Create Customer Profile
 const profile = this.customerProfiles.create({
  applicationId: saved.id,
  firstName,
  middleName: middleName || undefined, // Ensure middleName is undefined if null
  lastName,
  mobile,
});

await this.customerProfiles.save(profile);

  await this.customerProfiles.save(profile);

  // Update OTP Session
  session.applicationId = saved.id;
  await this.otpSessions.save(session);

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
}

