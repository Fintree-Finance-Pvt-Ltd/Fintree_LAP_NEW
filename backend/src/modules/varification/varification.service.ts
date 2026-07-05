import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
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
  ) {}

  async verifyPan(panNumber: string, applicationId: number) {
    const finalPan = String(panNumber || '').trim();

    if (!finalPan) {
      throw new HttpException('panNumber is required', 400);
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
        { panNumber: finalPan },
        {
          headers: {
            'X-api-key': 'Fintree@2026',
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const exists = await this.applications.exist({ where: { id: applicationId } });
      if (!exists) {
        throw new NotFoundException(`Application ${applicationId} was not found.`);
      }

      const profile = await this.profiles.findOne({ where: { applicationId } });
      if (!profile) {
        throw new NotFoundException(`Customer profile for application ${applicationId} was not found.`);
      }

      profile.panNumber = finalPan;
      profile.panVerified = true;
      await this.profiles.save(profile);

      return {
        success: true,
        message: 'PAN verification successful',
        data: {
          panNumber: finalPan,
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

