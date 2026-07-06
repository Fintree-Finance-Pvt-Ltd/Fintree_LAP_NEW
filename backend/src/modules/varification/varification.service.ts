import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { DataSource, Repository } from 'typeorm';
import { CustomerType } from '../../common/enums/customer-profile.enum';
import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';

@Injectable()
export class VarificationService {
  private readonly logger = new Logger(VarificationService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private readonly profiles: Repository<CustomerProfile>,

    @InjectRepository(Application)
    private readonly applications: Repository<Application>,

    private readonly dataSource: DataSource,
  ) {}

  async verifyPan(panNumber: string, name: string | undefined, applicationId: number) {
    const finalPan = String(panNumber || '').trim();
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

    try {
      const response = await axios.post(
        'https://sandbox.fintreelms.com/pan/verify',
        {
          panNumber: finalPan,
          name: finalName,
        },
        {
          headers: {
            'X-api-key': 'Fintree@2026',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      await this.dataSource.transaction(async (manager) => {
        const application = await manager.findOne(Application, {
          where: { id: applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!application) {
          throw new NotFoundException(`Application ${applicationId} was not found.`);
        }

        application.customerName = finalName;
        application.pan = finalPan;
        application.panVerified = true;
        await manager.save(application);

        let profile = await manager.findOne(CustomerProfile, {
          where: { applicationId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!profile) {
          const nameParts = finalName.split(/\s+/).filter(Boolean);
          const firstName = nameParts[0] || finalName || 'Customer';
          const lastName =
            nameParts.length > 1
              ? nameParts[nameParts.length - 1]
              : firstName;

          profile = manager.create(CustomerProfile, {
            applicationId,
            customerType: CustomerType.INDIVIDUAL,
            firstName,
            lastName,
            mobile: application.mobile,
          });
        }

        const nameParts = finalName.split(/\s+/).filter(Boolean);
        profile.firstName = nameParts[0] || finalName;
        profile.middleName =
          nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : undefined;
        profile.lastName =
          nameParts.length > 1 ? nameParts[nameParts.length - 1] : profile.firstName;
        profile.panNumber = finalPan;
        profile.panVerified = true;

        if (!profile.mobile) {
          profile.mobile = application.mobile;
        }

        await manager.save(profile);
      });

      return {
        success: true,
        message: 'PAN verification successful',
        data: {
          panNumber: finalPan,
          name: finalName,
          panVerified: true,
          upstream: response?.data ?? null,
        },
      };
    } catch (error: any) {
      if (error instanceof HttpException) throw error;

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'PAN verification failed';

      this.logger.error(`verifyPan failed: ${message}`);

      throw new InternalServerErrorException(
        `Unable to verify PAN. ${message}`,
      );
    }
  }
}
