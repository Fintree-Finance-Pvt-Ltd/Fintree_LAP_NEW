import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { DataSource, Repository } from 'typeorm';

import { OtpService } from '../otp/otp.service';
import {
  KycOwnerType,
  KycVerificationStatus,
  KycVerificationStatusValue,
} from '../varification/entities/kyc-verification-status.entity';
import { CoApplicant } from './entities/co-applicant.entity';

@Injectable()
export class CoApplicantVerificationService {
  private readonly logger = new Logger(CoApplicantVerificationService.name);

  constructor(
    @InjectRepository(CoApplicant)
    private readonly coApplicants: Repository<CoApplicant>,
    @InjectRepository(KycVerificationStatus)
    private readonly kycStatuses: Repository<KycVerificationStatus>,
    private readonly otpService: OtpService,
    private readonly dataSource: DataSource,
  ) {}

  async sendMobileOtp(coApplicantId: number, body: Record<string, any>) {
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const mobile = this.validMobile(body.mobile ?? coApplicant.mobile);
    if (mobile !== coApplicant.mobile) {
      coApplicant.mobile = mobile;
      await this.coApplicants.save(coApplicant);
    }
    const result = await this.otpService.sendOtp(mobile);
    await this.updateOtpStatusSafely(coApplicant, {
      mobileStatus: KycVerificationStatusValue.INITIATED,
      mobileApiRequest: JSON.stringify({ mobile: this.maskMobile(mobile), action: 'SEND_OTP' }),
      mobileApiResponse: JSON.stringify(result),
    });
    return { ...result, data: { ...(result as any).data, coApplicantId } };
  }

  async verifyMobileOtp(coApplicantId: number, body: Record<string, any>) {
    if (body.consentGiven !== true) {
      throw new BadRequestException('Co-applicant consent is required before OTP verification.');
    }
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const mobile = this.validMobile(body.mobile ?? coApplicant.mobile);
    if (mobile !== coApplicant.mobile) {
      throw new BadRequestException('Mobile number does not match the saved co-applicant.');
    }
    const result = await this.otpService.verifyOtp(
      mobile,
      body.otp,
      body.consentText || 'Co-applicant consented to mobile verification for the loan application.',
    );
    await this.updateOtpStatusSafely(coApplicant, {
      mobileStatus: KycVerificationStatusValue.VERIFIED,
      mobileApiRequest: JSON.stringify({ mobile: this.maskMobile(mobile), action: 'VERIFY_OTP' }),
      mobileApiResponse: JSON.stringify(result),
    });
    return { ...result, data: { ...(result as any).data, coApplicantId } };
  }

  async sendEmailOtp(coApplicantId: number, body: Record<string, any>) {
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const email = this.validEmail(body.email ?? coApplicant.email);
    if (email !== coApplicant.email) {
      coApplicant.email = email;
      await this.coApplicants.save(coApplicant);
    }
    const result = await this.otpService.sendEmailOtp({ email });
    await this.updateOtpStatusSafely(coApplicant, {
      emailStatus: KycVerificationStatusValue.INITIATED,
      emailApiRequest: JSON.stringify({ email: this.maskEmail(email), action: 'SEND_OTP' }),
      emailApiResponse: JSON.stringify(result),
    });
    return { ...result, data: { ...(result as any).data, coApplicantId } };
  }

  async verifyEmailOtp(coApplicantId: number, body: Record<string, any>) {
    if (body.consentGiven !== true) {
      throw new BadRequestException('Co-applicant consent is required before OTP verification.');
    }
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const email = this.validEmail(body.email ?? coApplicant.email);
    if (email !== coApplicant.email) {
      throw new BadRequestException('Email address does not match the saved co-applicant.');
    }
    const result = await this.otpService.verifyEmailOtp({
      email,
      otp: body.otp,
      sessionId: body.sessionId,
      consentGiven: body.consentGiven,
      consentText: body.consentText,
    });
    await this.updateOtpStatusSafely(coApplicant, {
      emailStatus: KycVerificationStatusValue.VERIFIED,
      emailApiRequest: JSON.stringify({ email: this.maskEmail(email), action: 'VERIFY_OTP' }),
      emailApiResponse: JSON.stringify(result),
    });
    return { ...result, data: { ...(result as any).data, coApplicantId } };
  }

  async verifyPan(coApplicantId: number, body: Record<string, any>) {
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const panNumber = String(body.panNumber || coApplicant.panNumber || '').trim().toUpperCase();
    const name = String(body.name || coApplicant.name || '').trim().replace(/\s+/g, ' ');
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
      throw new BadRequestException('Enter a valid 10-character PAN number.');
    }
    if (!name) throw new BadRequestException('PAN legal name is required.');
    const request = { panNumber, name };
    try {
      const response = await axios.post(
        `${process.env.SANDBOX_URL || 'https://sandbox.fintreelms.com'}/pan/verify`,
        request,
        {
          headers: { 'X-api-key': process.env.X_API_KEY || 'Fintree@2026' },
          timeout: 30000,
        },
      );
      coApplicant.name = name;
      coApplicant.panNumber = panNumber;
      await this.coApplicants.save(coApplicant);
      const names = this.splitName(name);
      await this.updateStatus(coApplicant, {
        panStatus: KycVerificationStatusValue.VERIFIED,
        panApiRequest: JSON.stringify(request),
        panApiResponse: JSON.stringify(response.data ?? null),
        ...names,
      });
      return {
        success: true,
        message: 'Co-applicant PAN verified successfully.',
        data: { coApplicantId, panNumber, name, panStatus: 'VERIFIED', upstream: response.data },
      };
    } catch (error: any) {
      await this.updateStatus(coApplicant, {
        panStatus: KycVerificationStatusValue.FAILED,
        panApiRequest: JSON.stringify(request),
        panApiResponse: JSON.stringify({
          message: error?.response?.data?.message || error?.message,
          upstream: error?.response?.data ?? null,
        }),
      });
      throw new HttpException(
        error?.response?.data?.message || error?.message || 'PAN verification failed.',
        error?.response?.status || 400,
      );
    }
  }

  async initAadhaar(coApplicantId: number) {
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const email = this.validEmail(coApplicant.email);
    const baseUrl = process.env.DIGITAP_BASE_URL;
    const clientId = process.env.DIGITAP_CLIENT_ID;
    const clientSecret = process.env.DIGITAP_CLIENT_SECRET;
    const redirectionUrl = process.env.AADHAAR_REDIRECT_URL;
    if (!baseUrl || !clientId || !clientSecret || !redirectionUrl) {
      throw new HttpException('Digitap Aadhaar configuration missing in env.', 500);
    }
    const uniqueId = `CO_${coApplicant.applicationId}_${coApplicant.id}_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const request = { uniqueId, redirectionUrl, expiryHours: 72 };
    try {
      const response = await axios.post(`${baseUrl}/kyc-unified/v1/generate-url/`, request, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        timeout: 60000,
        validateStatus: () => true,
      });
      const providerResponse = response.data ?? {};
      if (response.status < 200 || response.status >= 300 || providerResponse.success === false) {
        throw new Error(providerResponse.message || providerResponse.error || 'Identity link generation failed.');
      }
      const model = providerResponse.model || providerResponse.data || {};
      const kycUrl = model.shortUrl || model.url;
      const transactionId = model.unifiedTransactionId || model.transactionId || model.id || uniqueId;
      if (!kycUrl) throw new Error('Identity verification URL was not returned by Digitap.');
      await this.updateStatus(coApplicant, {
        aadhaarStatus: KycVerificationStatusValue.INITIATED,
        aadhaarTransactionId: String(transactionId),
        aadhaarApiRequest: JSON.stringify(request),
        aadhaarApiResponse: JSON.stringify(providerResponse),
      });
      await this.sendIdentityEmail(email, coApplicant.name, kycUrl);
      return {
        success: true,
        message: 'Secure identity verification link sent to the co-applicant.',
        data: { coApplicantId, uniqueId, transactionId, kycUrl, aadhaarStatus: 'INITIATED' },
      };
    } catch (error: any) {
      await this.updateStatus(coApplicant, {
        aadhaarStatus: KycVerificationStatusValue.FAILED,
        aadhaarApiRequest: JSON.stringify(request),
        aadhaarApiResponse: JSON.stringify({ message: error?.message, upstream: error?.response?.data ?? null }),
      });
      throw new HttpException(error?.message || 'Unable to initiate identity verification.', 400);
    }
  }

  async getStatus(coApplicantId: number) {
    const coApplicant = await this.getCoApplicant(coApplicantId);
    const status = await this.kycStatuses.findOne({
      where: { applicationId: coApplicant.applicationId, ownerType: KycOwnerType.CO_APPLICANT, coApplicantId },
      order: { id: 'DESC' },
    });
    return {
      success: true,
      data: status || {
        applicationId: coApplicant.applicationId,
        coApplicantId,
        ownerType: KycOwnerType.CO_APPLICANT,
        panStatus: 'PENDING', mobileStatus: 'PENDING', emailStatus: 'PENDING', aadhaarStatus: 'PENDING',
      },
    };
  }

  private async getCoApplicant(id: number) {
    const item = await this.coApplicants.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Co-applicant ${id} was not found.`);
    return item;
  }

  private async updateStatus(coApplicant: CoApplicant, patch: Partial<KycVerificationStatus>) {
    await this.dataSource.transaction(async (manager) => {
      let status = await manager.findOne(KycVerificationStatus, {
        where: {
          applicationId: coApplicant.applicationId,
          ownerType: KycOwnerType.CO_APPLICANT,
          coApplicantId: Number(coApplicant.id),
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!status) status = manager.create(KycVerificationStatus, {
        applicationId: coApplicant.applicationId,
        ownerType: KycOwnerType.CO_APPLICANT,
        coApplicantId: Number(coApplicant.id),
      });
      Object.assign(status, patch);
      await manager.save(status);
    });
  }

  private async updateOtpStatusSafely(
    coApplicant: CoApplicant,
    patch: Partial<KycVerificationStatus>,
  ) {
    try {
      await this.updateStatus(coApplicant, patch);
    } catch (error: any) {
      // OTP delivery/verification has already completed at this point. Do not
      // return a failed HTTP response that prevents the UI from accepting the
      // OTP or causes an already-verified OTP to be submitted again.
      this.logger.warn(
        `OTP succeeded but KYC audit persistence failed for co-applicant ${coApplicant.id}: ${
          error?.message || error
        }`,
      );
    }
  }

  private validMobile(value: unknown) {
    const mobile = String(value || '').replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) throw new BadRequestException('Enter a valid 10-digit Indian mobile number.');
    return mobile;
  }

  private validEmail(value: unknown) {
    const email = String(value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Enter a valid email address.');
    return email;
  }

  private splitName(name: string) {
    const parts = name.split(/\s+/).filter(Boolean);
    return {
      firstName: parts[0] || name,
      middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined,
      lastName: parts.length > 1 ? parts[parts.length - 1] : parts[0] || name,
    };
  }

  private maskMobile(mobile: string) {
    return `${'*'.repeat(Math.max(mobile.length - 4, 0))}${mobile.slice(-4)}`;
  }

  private maskEmail(email: string) {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 3))}@${domain}`;
  }

  private async sendIdentityEmail(to: string, name: string, kycUrl: string) {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM || user;
    if (!host || !user || !pass || !from) throw new Error('SMTP configuration is incomplete.');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from, to,
      subject: 'Complete your Fintree identity verification',
      text: `Dear ${name || 'Co-applicant'}, complete your secure DigiLocker identity verification: ${kycUrl}`,
      html: `<p>Dear ${name || 'Co-applicant'},</p><p>Please complete your secure DigiLocker identity verification.</p><p><a href="${kycUrl}">Complete identity verification</a></p><p>Do not share this link or any OTP.</p>`,
    });
  }
}
