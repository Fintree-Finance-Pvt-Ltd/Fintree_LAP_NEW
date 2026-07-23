import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { randomBytes } from 'crypto';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';
import { CustomerType } from '../../common/enums/customer-profile.enum';
import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import {
  KycOwnerType,
  KycVerificationStatus,
  KycVerificationStatusValue,
} from './entities/kyc-verification-status.entity';

@Injectable()
export class VarificationService {
  private readonly logger = new Logger(VarificationService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private readonly profiles: Repository<CustomerProfile>,
    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
    @InjectRepository(KycVerificationStatus)
    private readonly kycVerificationStatusRepository: Repository<KycVerificationStatus>,
    private readonly dataSource: DataSource,
  ) {}

  async verifyPan(
    panNumber: string,
    name: string | undefined,
    applicationId: number,
  ) {
    const finalPan = String(panNumber || '').trim().toUpperCase();
    const finalName = String(name || '').trim().replace(/\s+/g, ' ');

    if (!finalPan) {
      throw new HttpException('panNumber is required', 400);
    }
    if (!finalName) {
      throw new HttpException('name is required', 400);
    }
    if (!applicationId) {
      throw new HttpException(
        'applicationId is required to mark pan_verified in customer_profiles',
        400,
      );
    }

    const panApiRequest = {
      panNumber: finalPan,
      name: finalName,
    };

    try {
      const response = await axios.post(
        'https://sandbox.fintreelms.com/pan/verify',
        panApiRequest,
        {
          headers: {
            'X-api-key': 'Fintree@2026',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const panApiResponse = response?.data ?? null;

      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!application) {
          throw new NotFoundException(
            `Application ${applicationId} was not found.`,
          );
        }

        application.customerName = finalName;
        application.pan = finalPan;
        application.panVerified = true;
        await manager.save(application);

        let profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        const nameParts = finalName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || finalName || 'Customer';
        const middleName =
          nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
        const lastName =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

        if (!profile) {
          profile = manager.create(CustomerProfile, {
            applicationId,
            customerType: CustomerType.INDIVIDUAL,
            firstName,
            lastName,
            mobile: application.mobile,
          });
        }

        profile.firstName = firstName;
        profile.middleName = middleName || undefined;
        profile.lastName = lastName;
        profile.panNumber = finalPan;
        profile.panVerified = true;

        if (!profile.mobile) {
          profile.mobile = application.mobile;
        }

        const savedProfile = await manager.save(profile);

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        kycStatus.applicantId = Number(savedProfile.id);
        kycStatus.panStatus = KycVerificationStatusValue.VERIFIED;
        kycStatus.panApiRequest = JSON.stringify(panApiRequest);
        kycStatus.panApiResponse = JSON.stringify(panApiResponse);
        kycStatus.firstName = firstName;
        kycStatus.middleName = middleName || undefined;
        kycStatus.lastName = lastName;

        await manager.save(kycStatus);
      });

      return {
        success: true,
        message: 'PAN verification successful',
        data: {
          applicationId,
          panNumber: finalPan,
          name: finalName,
          panVerified: true,
          kycStatus: KycVerificationStatusValue.VERIFIED,
          upstream: response?.data ?? null,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'PAN verification failed';

      this.logger.error(`verifyPan failed: ${message}`);

      await this.storeFailedPanVerification({
        applicationId,
        finalPan,
        finalName,
        panApiRequest,
        error,
        message,
      });

      throw new InternalServerErrorException(
        `Unable to verify PAN. ${message}`,
      );
    }
  }

  private async storeFailedPanVerification(params: {
    applicationId: number;
    finalPan: string;
    finalName: string;
    panApiRequest: any;
    error: any;
    message: string;
  }) {
    const { applicationId, finalName, panApiRequest, error, message } = params;

    try {
      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
        });

        if (!application) {
          return;
        }

        const nameParts = finalName.split(/\s+/).filter(Boolean);
        const firstName = nameParts[0] || finalName || 'Customer';
        const middleName =
          nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : null;
        const lastName =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

        let profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
        });

        let applicantId: number | undefined;
        if (profile) {
          applicantId = Number(profile.id);
        }

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        kycStatus.applicantId = applicantId;
        kycStatus.panStatus = KycVerificationStatusValue.FAILED;
        kycStatus.panApiRequest = JSON.stringify(panApiRequest);
        kycStatus.panApiResponse = JSON.stringify({
          message,
          upstream: error?.response?.data ?? null,
          statusCode: error?.response?.status ?? null,
        });
        kycStatus.firstName = firstName;
        kycStatus.middleName = middleName || undefined;
        kycStatus.lastName = lastName;

        await manager.save(kycStatus);
      });
    } catch (storeError: any) {
      this.logger.error(
        `Unable to store failed PAN verification status: ${
          storeError?.message || storeError
        }`,
      );
    }
  }

  async verifyGst(gstNumber: string, applicationId: number) {
    const finalGst = String(gstNumber || '').trim().toUpperCase();

    if (!finalGst) {
      throw new HttpException('gstNumber is required', 400);
    }
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(finalGst)) {
      throw new HttpException('Enter a valid GST number', 400);
    }
    if (!applicationId) {
      throw new HttpException(
        'applicationId is required to store GST verification status',
        400,
      );
    }

    const gstApiRequest = { gstNumber: finalGst };
    let finalProvider = 'SANDBOX';
    let finalApiResponse: any = null;
    let sandboxResult: any = null;
    let zoopResult: any = null;

    try {
      // 1. TRY SANDBOX FIRST
      try {
        this.logger.log(`GST sandbox request gstNumber=${finalGst}`);
        const sandboxResponse = await axios.post(
          'https://sandbox.fintreelms.com/gst/verify',
          { gstNumber: finalGst },
          {
            headers: {
              accept: '*/*',
              'X-API-Key': 'Fintree@2026',
              'Content-Type': 'application/json',
            },
            timeout: 60000,
            validateStatus: () => true,
          },
        );

        sandboxResult = {
          provider: 'SANDBOX',
          statusCode: sandboxResponse.status,
          data: sandboxResponse?.data ?? null,
        };

        this.logger.log(
          `GST sandbox response: status=${
            sandboxResponse.status
          }, data=${JSON.stringify(sandboxResponse?.data ?? null)}`,
        );

        const sandboxSuccess =
          sandboxResponse.status >= 200 &&
          sandboxResponse.status < 300 &&
          sandboxResponse?.data?.success !== false &&
          sandboxResponse?.data?.is_success !== false;

        if (sandboxSuccess) {
          finalProvider = 'SANDBOX';
          finalApiResponse = sandboxResult;
        }
      } catch (sandboxError: any) {
        sandboxResult = {
          provider: 'SANDBOX',
          statusCode: sandboxError?.response?.status ?? null,
          error:
            sandboxError?.response?.data ?? sandboxError?.message ?? null,
        };
        this.logger.error(
          `GST sandbox failed: ${sandboxError?.message || sandboxError}`,
        );
      }

      // 2. IF SANDBOX FAILED, TRY ZOOP
      if (!finalApiResponse) {
        this.logger.warn(
          `GST sandbox failed for ${finalGst}. Trying Zoop fallback.`,
        );
        zoopResult = await this.callZoopGstVerification(finalGst);
        finalProvider = 'ZOOP';
        finalApiResponse = zoopResult;
      }

      // 3. SAVE VERIFIED GST
      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!application) {
          throw new NotFoundException(
            `Application ${applicationId} was not found.`,
          );
        }

        let profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!profile) {
          const nameParts = String(application.customerName || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const firstName =
            nameParts[0] || application.customerName || 'Customer';
          const lastName =
            nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

          profile = manager.create(CustomerProfile, {
            applicationId,
            customerType: CustomerType.INDIVIDUAL,
            firstName,
            lastName,
            mobile: application.mobile,
          });
        }

        profile.gstNumber = finalGst;
        const savedProfile = await manager.save(profile);

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        kycStatus.applicantId = Number(savedProfile.id);
        kycStatus.gstStatus = KycVerificationStatusValue.VERIFIED;
        kycStatus.gstApiRequest = JSON.stringify({
          requestedGstNumber: finalGst,
          sandboxRequest: gstApiRequest,
          zoopFallbackUsed: finalProvider === 'ZOOP',
        });
        kycStatus.gstApiResponse = JSON.stringify({
          verifiedBy: finalProvider,
          sandbox: sandboxResult,
          zoop: zoopResult,
          finalResponse: finalApiResponse,
        });
        kycStatus.firstName = profile.firstName;
        kycStatus.middleName = profile.middleName;
        kycStatus.lastName = profile.lastName;

        await manager.save(kycStatus);
      });

      return {
        success: true,
        message:
          finalProvider === 'ZOOP'
            ? 'GST verification successful using Zoop fallback'
            : 'GST verification successful',
        data: {
          applicationId,
          gstNumber: finalGst,
          gstVerified: true,
          customerProfileUpdated: true,
          kycStatus: KycVerificationStatusValue.VERIFIED,
          verifiedBy: finalProvider,
          upstream: finalApiResponse,
        },
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'GST verification failed';

      this.logger.error(
        `verifyGst failed: ${message}. Upstream=${JSON.stringify(
          error?.response?.data ?? null,
        )}`,
      );

      await this.storeFailedGstVerification({
        applicationId,
        finalGst,
        gstApiRequest: {
          requestedGstNumber: finalGst,
          sandboxRequest: gstApiRequest,
          zoopFallbackAttempted: true,
        },
        error: {
          response: {
            status: error?.response?.status ?? null,
            data: {
              message,
              sandbox: sandboxResult,
              zoop: zoopResult,
              rawError: error?.response?.data ?? null,
            },
          },
        },
        message,
      });

      throw new HttpException(message, 400);
    }
  }

  private async storeFailedGstVerification(params: {
    applicationId: number;
    finalGst: string;
    gstApiRequest: any;
    error: any;
    message: string;
  }) {
    const { applicationId, gstApiRequest, error, message } = params;

    try {
      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
        });

        if (!application) {
          return;
        }

        const profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
        });

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        if (profile?.id) {
          kycStatus.applicantId = Number(profile.id);
        }

        kycStatus.gstStatus = KycVerificationStatusValue.FAILED;
        kycStatus.gstApiRequest = JSON.stringify(gstApiRequest);
        kycStatus.gstApiResponse = JSON.stringify({
          message,
          upstream: error?.response?.data ?? null,
          statusCode: error?.response?.status ?? null,
        });

        if (profile) {
          kycStatus.firstName = profile.firstName;
          kycStatus.middleName = profile.middleName;
          kycStatus.lastName = profile.lastName;
        }

        await manager.save(kycStatus);
      });
    } catch (storeError: any) {
      this.logger.error(
        `Unable to store failed GST verification status: ${
          storeError?.message || storeError
        }`,
      );
    }
  }

  private async callZoopGstVerification(gstNumber: string) {
    const zoopUrl = process.env.ZOOP_GST_API_URL;
    const zoopApiKey = process.env.ZOOP_API_KEY;
    const zoopAppId = process.env.ZOOP_APP_ID;

    if (!zoopUrl || !zoopApiKey || !zoopAppId) {
      throw new Error(
        'Zoop GST fallback configuration missing. Please set ZOOP_GST_API_URL, ZOOP_API_KEY and ZOOP_APP_ID.',
      );
    }

    const payload = {
      mode: 'sync',
      data: {
        business_gstin_number: gstNumber.toUpperCase(),
        contact_info: true,
        financial_year: process.env.ZOOP_GST_FINANCIAL_YEAR || '2024-25',
        consent: 'Y',
        consent_text:
          'I hereby declare my consent agreement for fetching my information via ZOOP API.',
      },
      task_id: randomUUID(),
    };

    this.logger.log(`GST Zoop fallback request gstNumber=${gstNumber}`);

    const response = await axios.post(zoopUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': zoopApiKey,
        'app-id': zoopAppId,
      },
      timeout: 60000,
      validateStatus: () => true,
    });

    const zoopData = response?.data ?? null;

    this.logger.log(
      `GST Zoop fallback response: status=${
        response.status
      }, data=${JSON.stringify(zoopData)}`,
    );

    const zoopFailed =
      response.status < 200 ||
      response.status >= 300 ||
      zoopData?.success === false ||
      zoopData?.is_success === false ||
      String(zoopData?.status || '').toLowerCase() === 'failed';

    if (zoopFailed) {
      throw new Error(
        zoopData?.message ||
          zoopData?.error ||
          zoopData?.response_message ||
          'Zoop GST verification failed',
      );
    }

    return {
      provider: 'ZOOP',
      statusCode: response.status,
      request: payload,
      data: zoopData,
    };
  }

  async initAadhaarKyc(applicationId: number) {
    if (!applicationId) {
      throw new HttpException('applicationId is required', 400);
    }

    const digitapBaseUrl = process.env.DIGITAP_BASE_URL;
    const digitapClientId = process.env.DIGITAP_CLIENT_ID;
    const digitapClientSecret = process.env.DIGITAP_CLIENT_SECRET;
    const aadhaarRedirectUrl = process.env.AADHAAR_REDIRECT_URL;

    if (
      !digitapBaseUrl ||
      !digitapClientId ||
      !digitapClientSecret ||
      !aadhaarRedirectUrl
    ) {
      throw new HttpException(
        'Digitap Aadhaar configuration missing in env.',
        500,
      );
    }

    const application = await this.applications.findOne({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException(
        `Application ${applicationId} was not found.`,
      );
    }

    let profile = await this.profiles.findOne({
      where: { applicationId },
    });

    const customerName =
      profile?.firstName || profile?.lastName
        ? `${profile?.firstName || ''} ${profile?.middleName || ''} ${
            profile?.lastName || ''
          }`
            .replace(/\s+/g, ' ')
            .trim()
        : application.customerName || 'Customer';

    const mobile = profile?.mobile || application.mobile;
    const email = profile?.email || application.email;

    if (!email) {
      throw new HttpException(
        'Customer email not found. Please save customer email before sending Aadhaar KYC link.',
        400,
      );
    }

    const randomSuffix = randomBytes(5).toString('hex');
    const uniqueId = `${
      application.applicationNumber || `APP_${applicationId}`
    }_${Date.now()}_${randomSuffix}`;

    const aadhaarApiRequest = {
      uniqueId,
      redirectionUrl: aadhaarRedirectUrl,
      expiryHours: 72,
    };

    try {
      const authHeader = Buffer.from(
        `${digitapClientId}:${digitapClientSecret}`,
      ).toString('base64');

      const response = await axios.post(
        `${digitapBaseUrl}/kyc-unified/v1/generate-url/`,
        aadhaarApiRequest,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${authHeader}`,
          },
          timeout: 60000,
          validateStatus: () => true,
        },
      );

      const aadhaarApiResponse = response?.data ?? null;

      this.logger.log(
        `Aadhaar init response: status=${
          response.status
        }, data=${JSON.stringify(aadhaarApiResponse)}`,
      );

      if (
        response.status < 200 ||
        response.status >= 300 ||
        aadhaarApiResponse?.success === false
      ) {
        throw new HttpException(
          aadhaarApiResponse?.message ||
            aadhaarApiResponse?.error ||
            'Aadhaar KYC initiation failed',
          400,
        );
      }

      const model =
        aadhaarApiResponse?.model || aadhaarApiResponse?.data || {};
      const kycUrl = model.shortUrl || model.url;
      const unifiedTransactionId =
        model.unifiedTransactionId ||
        model.transactionId ||
        model.id ||
        uniqueId;

      if (!kycUrl) {
        throw new HttpException(
          'Aadhaar KYC URL not received from Digitap.',
          400,
        );
      }

      await this.dataSource.transaction(async (manager) => {
        const lockedApplication = await manager.findOne(Application, {
          where: { id: applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedApplication) {
          throw new NotFoundException(
            `Application ${applicationId} was not found.`,
          );
        }

        let lockedProfile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedProfile) {
          const nameParts = String(customerName || '')
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          const firstName = nameParts[0] || 'Customer';
          const lastName =
            nameParts.length > 1 ? nameParts[nameParts.length - 1] : firstName;

          lockedProfile = manager.create(CustomerProfile, {
            applicationId,
            customerType: CustomerType.INDIVIDUAL,
            firstName,
            lastName,
            mobile,
            email,
          });
        }

        if (!lockedProfile.mobile && mobile) {
          lockedProfile.mobile = mobile;
        }
        if (!lockedProfile.email && email) {
          lockedProfile.email = email;
        }

        const savedProfile = await manager.save(lockedProfile);

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        kycStatus.applicantId = Number(savedProfile.id);
        kycStatus.aadhaarStatus = KycVerificationStatusValue.INITIATED;
        kycStatus.aadhaarTransactionId = String(unifiedTransactionId);
        kycStatus.aadhaarApiRequest = JSON.stringify(aadhaarApiRequest);
        kycStatus.aadhaarApiResponse = JSON.stringify(aadhaarApiResponse);
        kycStatus.firstName = savedProfile.firstName;
        kycStatus.middleName = savedProfile.middleName;
        kycStatus.lastName = savedProfile.lastName;

        await manager.save(kycStatus);
      });

      let emailSent = false;
      try {
        await this.sendAadhaarKycEmail({
          to: email,
          customerName,
          applicationNumber:
            application.applicationNumber || `APP-${applicationId}`,
          kycUrl,
          uniqueId,
          unifiedTransactionId: String(unifiedTransactionId),
        });
        emailSent = true;
        this.logger.log(`Aadhaar KYC email sent to ${email}`);
      } catch (mailError: any) {
        this.logger.error(
          `Aadhaar KYC email failed for ${email}: ${
            mailError?.message || mailError
          }`,
        );
        throw new HttpException(
          `Aadhaar KYC link generated but email sending failed. ${
            mailError?.message || ''
          }`,
          400,
        );
      }

      return {
        success: true,
        message: 'Aadhaar KYC initiated successfully',
        data: {
          applicationId,
          customerName,
          mobile,
          email,
          uniqueId,
          unifiedTransactionId,
          kycUrl,
          aadhaarStatus: KycVerificationStatusValue.INITIATED,
        },
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Aadhaar KYC initiation failed';

      this.logger.error(
        `initAadhaarKyc failed: ${message}. Upstream=${JSON.stringify(
          error?.response?.data ?? null,
        )}`,
      );

      await this.storeFailedAadhaarVerification({
        applicationId,
        aadhaarApiRequest,
        error,
        message,
      });

      throw new HttpException(message, 400);
    }
  }

  private async storeFailedAadhaarVerification(params: {
    applicationId: number;
    aadhaarApiRequest: any;
    error: any;
    message: string;
  }) {
    const { applicationId, aadhaarApiRequest, error, message } = params;

    try {
      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
        });

        if (!application) {
          return;
        }

        const profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
        });

        let kycStatus = await manager.findOne(KycVerificationStatus, {
          where: {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          },
        });

        if (!kycStatus) {
          kycStatus = manager.create(KycVerificationStatus, {
            applicationId,
            ownerType: KycOwnerType.APPLICANT,
          });
        }

        if (profile?.id) {
          kycStatus.applicantId = Number(profile.id);
          kycStatus.firstName = profile.firstName;
          kycStatus.middleName = profile.middleName;
          kycStatus.lastName = profile.lastName;
        }

        kycStatus.aadhaarStatus = KycVerificationStatusValue.FAILED;
        kycStatus.aadhaarApiRequest = JSON.stringify(aadhaarApiRequest);
        kycStatus.aadhaarApiResponse = JSON.stringify({
          message,
          upstream: error?.response?.data ?? null,
          statusCode: error?.response?.status ?? null,
        });

        await manager.save(kycStatus);
      });
    } catch (storeError: any) {
      this.logger.error(
        `Unable to store failed Aadhaar verification status: ${
          storeError?.message || storeError
        }`,
      );
    }
  }

  async updateAadhaarKycStatus(body: any) {
    const payload = body || {};
    const data = payload?.data || payload?.model || payload || {};
    const transactionId =
      payload?.transactionId ||
      payload?.unifiedTransactionId ||
      payload?.model?.unifiedTransactionId ||
      payload?.data?.unifiedTransactionId ||
      data?.transactionId ||
      data?.unifiedTransactionId ||
      null;
    const uniqueId =
      payload?.uniqueId ||
      payload?.data?.uniqueId ||
      payload?.model?.uniqueId ||
      data?.uniqueId ||
      null;

    if (!transactionId && !uniqueId) {
      this.logger.warn('Aadhaar webhook ignored: transactionId/uniqueId missing');
      return {
        success: true,
        message: 'ignored',
        data: { reason: 'TRANSACTION_ID_OR_UNIQUE_ID_MISSING' },
      };
    }

    const normalizedStatus = String(
      payload?.status ||
        data?.status ||
        payload?.eventStatus ||
        data?.eventStatus ||
        '',
    )
      .trim()
      .toLowerCase();

    const isSuccess =
      normalizedStatus === 'success' ||
      normalizedStatus === 'completed' ||
      normalizedStatus === 'verified' ||
      payload?.success === true ||
      data?.success === true;

    const kycStatus = await this.findAadhaarKycStatusForWebhook(
      transactionId ? String(transactionId) : null,
      uniqueId ? String(uniqueId) : null,
    );

    if (!kycStatus) {
      this.logger.warn(
        `Aadhaar webhook ignored: no KYC row found for transactionId=${
          transactionId || 'NA'
        }, uniqueId=${uniqueId || 'NA'}`,
      );
      return {
        success: true,
        message: 'no-matching-kyc-row',
        data: { transactionId, uniqueId },
      };
    }

    if (!isSuccess) {
      await this.kycVerificationStatusRepository.update(
        { id: kycStatus.id },
        {
          aadhaarStatus: KycVerificationStatusValue.FAILED,
          aadhaarWebhookResponse: JSON.stringify(payload),
        },
      );

      return {
        success: true,
        message: 'failure-processed',
        data: {
          applicationId: kycStatus.applicationId,
          transactionId,
          uniqueId,
          aadhaarStatus: KycVerificationStatusValue.FAILED,
        },
      };
    }

    const aadhaarName =
      data?.name ||
      data?.full_name ||
      data?.fullName ||
      data?.customer_name ||
      data?.aadhaarName ||
      null;

    const maskedAadhaar =
      data?.maskedAdharNumber ||
      data?.maskedAadhaar ||
      data?.masked_aadhaar ||
      data?.aadhaarMaskedNumber ||
      data?.aadhaar_number ||
      null;

    const aadhaarDob = this.parseAadhaarDob(
      data?.dob || data?.date_of_birth || data?.dateOfBirth || null,
    );

    const aadhaarAddress = this.formatAadhaarAddress(
      data?.address || data?.full_address || data?.aadhaarAddress || null,
    );

    await this.dataSource.transaction(async (manager) => {
      const lockedKycStatus = await manager.findOne(KycVerificationStatus, {
        where: { id: kycStatus.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedKycStatus) {
        return;
      }

      const applicationId = Number(lockedKycStatus.applicationId);
      const profile = await manager.findOne(CustomerProfile, {
        where: { applicationId },
        lock: { mode: 'pessimistic_write' },
      });

      lockedKycStatus.aadhaarStatus = KycVerificationStatusValue.VERIFIED;
      lockedKycStatus.aadhaarName = aadhaarName || undefined;
      lockedKycStatus.aadhaarMaskedNumber = maskedAadhaar || undefined;
      lockedKycStatus.aadhaarDob = aadhaarDob || undefined;
      lockedKycStatus.aadhaarAddress = aadhaarAddress || undefined;
      lockedKycStatus.aadhaarWebhookResponse = JSON.stringify(payload);

      if (profile) {
        profile.aadhaarVerified = true;
        const aadhaarDigits = String(maskedAadhaar || '').replace(/\D/g, '');
        if (aadhaarDigits) {
          profile.aadhaarNumber = aadhaarDigits.slice(-12);
        }
        if (!profile.dob && aadhaarDob) {
          profile.dob = aadhaarDob.toISOString().slice(0, 10);
        }
        if (!profile.currentAddress && aadhaarAddress) {
          profile.currentAddress = aadhaarAddress;
        }
        await manager.save(profile);
      }

      await manager.save(lockedKycStatus);
    });

    return {
      success: true,
      message: 'Aadhaar KYC webhook processed successfully',
      data: {
        applicationId: kycStatus.applicationId,
        transactionId,
        uniqueId,
        aadhaarStatus: KycVerificationStatusValue.VERIFIED,
        aadhaarName,
        aadhaarMaskedNumber: maskedAadhaar,
      },
    };
  }

async getAadhaarKycStatus(applicationId: number) {
  const rows = await this.dataSource.query(
    `
      SELECT
        application_id AS applicationId,
        aadhaar_status AS aadhaarStatus,
        aadhaar_transaction_id AS aadhaarTransactionId,
        aadhaar_unique_id AS aadhaarUniqueId,
        aadhaar_name AS aadhaarName,
        aadhaar_masked_number AS aadhaarMaskedNumber,
        aadhaar_dob AS aadhaarDob,
        aadhaar_address AS aadhaarAddress,
        updated_at AS updatedAt
      FROM kyc_verification_status
      WHERE application_id = ?
      ORDER BY id DESC
      LIMIT 1
    `,
    [applicationId],
  );

  if (!rows.length) {
    return {
      success: true,
      message: "Aadhaar KYC status not initiated.",
      data: {
        applicationId,
        aadhaarStatus: "NOT_INITIATED",
      },
    };
  }

  return {
    success: true,
    message: "Aadhaar KYC status fetched successfully.",
    data: rows[0],
  };
}

  async getKycVerificationStatus(applicationId: number) {
    const status = await this.kycVerificationStatusRepository.findOne({
      where: {
        applicationId,
        ownerType: KycOwnerType.APPLICANT,
      },
      order: {
        updatedAt: 'DESC',
        id: 'DESC',
      },
      select: {
        id: true,
        applicationId: true,
        ownerType: true,
        applicantId: true,
        panStatus: true,
        gstStatus: true,
        aadhaarStatus: true,
        bureauStatus: true,
        mobileStatus: true,
        emailStatus: true,
        updatedAt: true,
      },
    });

    if (!status) {
      return {
        success: true,
        message: 'KYC verification has not been initiated for this application.',
        data: {
          applicationId,
          ownerType: KycOwnerType.APPLICANT,
          panStatus: KycVerificationStatusValue.PENDING,
          gstStatus: KycVerificationStatusValue.PENDING,
          aadhaarStatus: KycVerificationStatusValue.PENDING,
          bureauStatus: KycVerificationStatusValue.PENDING,
          mobileStatus: KycVerificationStatusValue.PENDING,
          emailStatus: KycVerificationStatusValue.PENDING,
          updatedAt: null,
        },
      };
    }

    return {
      success: true,
      message: 'KYC verification status fetched successfully.',
      data: status,
    };
  }

  private async findAadhaarKycStatusForWebhook(
    transactionId: string | null,
    uniqueId: string | null,
  ) {
    const qb = this.kycVerificationStatusRepository
      .createQueryBuilder('kyc')
      .where('1 = 0');

    if (transactionId) {
      qb.orWhere('kyc.aadhaarTransactionId = :transactionId', {
        transactionId,
      });
    }

    if (uniqueId) {
      qb.orWhere('kyc.aadhaarApiRequest LIKE :uniqueIdSearch', {
        uniqueIdSearch: `%${uniqueId}%`,
      });
      qb.orWhere('kyc.aadhaarApiResponse LIKE :uniqueIdSearch', {
        uniqueIdSearch: `%${uniqueId}%`,
      });
    }

    return qb.getOne();
  }

  private parseAadhaarDob(value: any): Date | null {
    if (!value) return null;
    const raw = String(value).trim();
    const ddMmYyyy = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (ddMmYyyy) {
      const [, dd, mm, yyyy] = ddMmYyyy;
      const parsed = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private formatAadhaarAddress(address: any): string | null {
    if (!address) return null;
    if (typeof address === 'string') return address.trim() || null;
    const parts = [
      address.house,
      address.street,
      address.loc,
      address.vtc,
      address.po,
      address.subdist,
      address.dist,
      address.state,
      address.pc,
    ]
      .map((part) => String(part || '').trim())
      .filter(Boolean);

    if (parts.length) {
      return parts.join(', ');
    }
    return JSON.stringify(address);
  }

  private async sendAadhaarKycEmail(params: {
    to: string;
    customerName: string;
    applicationNumber: string;
    kycUrl: string;
    uniqueId: string;
    unifiedTransactionId: string;
  }) {
    const {
      to,
      customerName,
      applicationNumber,
      kycUrl,
      uniqueId,
      unifiedTransactionId,
    } = params;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = String(process.env.SMTP_SECURE || 'false') === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      throw new Error(
        'SMTP configuration missing. Please set SMTP_HOST, SMTP_USER, SMTP_PASS and SMTP_FROM.',
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px;">
        <div style="max-width:620px; margin:auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
          <div style="background:#2563eb; color:#ffffff; padding:18px 22px;">
            <h2 style="margin:0; font-size:20px;">Aadhaar KYC Verification</h2>
            <p style="margin:6px 0 0; font-size:13px;">Fintree Finance Private Limited</p>
          </div>
          <div style="padding:24px;">
            <p style="font-size:14px; color:#334155;">Dear ${
              customerName || 'Customer'
            },</p>
            <p style="font-size:14px; color:#334155; line-height:1.6;">
              Please complete your Aadhaar DigiLocker KYC verification for your LAP application.
            </p>
            <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:10px; padding:14px; margin:18px 0;">
              <p style="margin:0; font-size:13px; color:#475569;">
                <strong>Application Number:</strong> ${
                  applicationNumber || '-'
                }<br/>
                <strong>Reference ID:</strong> ${uniqueId}<br/>
                <strong>Transaction ID:</strong> ${unifiedTransactionId}
              </p>
            </div>
            <div style="text-align:center; margin:26px 0;">
              <a href="${kycUrl}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:13px 22px; border-radius:10px; font-size:14px; font-weight:bold;">
                Complete Aadhaar KYC
              </a>
            </div>
            <p style="font-size:12px; color:#64748b; line-height:1.6;">
              This link is valid for a limited time. Please do not share this link or any OTP with anyone.
            </p>
            <p style="font-size:13px; color:#334155; margin-top:24px;">
              Regards,<br/>
              <strong>Fintree Finance Private Limited</strong>
            </p>
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: smtpFrom,
      to,
      subject: `Complete Aadhaar KYC - ${
        applicationNumber || 'Fintree LAP'
      }`,
      html,
    });
  }
}
