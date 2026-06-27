import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

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

  async verifyOtpAndCreate(body: Record<string, unknown>) {
    const mobile = body.mobile;
    const otp = body.otp;
    const consentText = body.consentText;

    // Verify OTP first (this marks otp_sessions verified=true)
    await this.verifyOtp(mobile, otp, consentText, undefined);

    const payload = body; // Option A (top-level payload)

    const customerName = String(payload.customerName ?? '').trim();
    const mobileNumber = String(payload.mobile ?? '').trim();
    const pan = payload.pan ? String(payload.pan).trim() : undefined;
    const requestedAmount = payload.requestedAmount
      ? String(payload.requestedAmount)
      : undefined;

    if (!customerName) throw new BadRequestException('customerName is required');
    if (!mobileNumber) throw new BadRequestException('mobile is required');
    if (!pan) throw new BadRequestException('pan is required');
    if (!requestedAmount) throw new BadRequestException('requestedAmount is required');

    return this.dataSource.transaction(async (manager) => {
      const applicationRepo = manager.getRepository(Application);
      const profileRepo = manager.getRepository(CustomerProfile);
      const workflowRepo = manager.getRepository(Workflow);
      const historyRepo = manager.getRepository(WorkflowHistory);

      const application = manager.create(Application, {
        customerName,
        mobile: mobileNumber,
        pan,
        requestedAmount,
        applicationNumber: 'TEMP',
        status: ApplicationStatus.DRAFT,
        stage: ApplicationStage.RM,
        createdBy: 1,
        updatedBy: 1,
      });

      const saved = await applicationRepo.save(application);
      saved.applicationNumber = createReferenceNumber('LAP', saved.id);
      await applicationRepo.save(saved);

      // CustomerProfile best-effort mapping based on CreateApplicationWithProfileDto
      const profile = profileRepo.create({
        applicationId: saved.id,
        customerType: (payload.customerType as any) ?? 'INDIVIDUAL',
        firstName: (payload.firstName as any) ?? customerName.split(/\s+/)[0],
        middleName: payload.middleName as any,
        lastName:
          (payload.lastName as any) ??
          customerName.split(/\s+/).slice(-1)[0],
        mobile: mobileNumber,
        email: payload.email as any,
        occupationType: (payload.occupationType as any) ?? (payload.occupationType as any),
        businessName: payload.businessName as any,
        monthlyIncome: payload.monthlyIncome != null ? String(payload.monthlyIncome) : undefined,
        annualIncome: payload.annualIncome != null ? String(payload.annualIncome) : undefined,
        panNumber: pan,
        aadhaarNumber: payload.aadhaarNumber as any,
        propertyCategory: payload.propertyCategory as any,
        propertyType: payload.propertyType as any,
        propertyAddress: payload.propertyAddress as any,
        propertyCity: payload.propertyCity as any,
        propertyState: payload.propertyState as any,
        propertyPincode: payload.propertyPincode as any,
        marketValue: payload.marketValue != null ? String(payload.marketValue) : undefined,
        foir: payload.foir != null ? String(payload.foir) : undefined,
        eligibleAmount: payload.eligibleAmount != null ? String(payload.eligibleAmount) : undefined,
        roi: payload.roi != null ? String(payload.roi) : undefined,
        tenure: payload.tenure != null ? Number(payload.tenure) : undefined,
        emi: payload.emi != null ? String(payload.emi) : undefined,
        recommendedAmount:
          payload.recommendedAmount != null ? String(payload.recommendedAmount) : undefined,
        recommendedRoi:
          payload.recommendedRoi != null ? String(payload.recommendedRoi) : undefined,
        recommendedTenure:
          payload.recommendedTenure != null ? Number(payload.recommendedTenure) : undefined,
        rmRecommendation: payload.rmRecommendation as any,
        remarks: payload.remarks as any,
      });

      await profileRepo.save(profile);

      await historyRepo.save(
        historyRepo.create({
          applicationId: saved.id,
          fromRole: ApplicationStage.RM,
          toRole: ApplicationStage.RM,
          action: WorkflowAction.SAVE_DRAFT,
          remarks: 'Saved as draft after OTP verification',
          actionBy: 1,
        }),
      );

      await workflowRepo.save(
        workflowRepo.create({
          applicationId: saved.id,
          currentStage: ApplicationStage.RM,
          currentStatus: ApplicationStatus.DRAFT,
          assignedTo: undefined,
          currentOwner: 1,
          lastAction: WorkflowAction.SAVE_DRAFT,
          lastRemarks: 'Saved as draft after OTP verification',
        }),
      );

      return {
        success: true,
        applicationId: saved.id,
        applicationNumber: saved.applicationNumber,
        status: saved.status,
      };
    });
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

