import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import {
  InjectRepository,
} from '@nestjs/typeorm';

import {
  Repository,
} from 'typeorm';

import { Application } from '../applications/entities/application.entity';

import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

import { CustomerProfile } from './entities/customer-profile.entity';

@Injectable()
export class CustomerProfilesService {
  private readonly logger = new Logger(
    CustomerProfilesService.name,
  );

  constructor(
    @InjectRepository(CustomerProfile)
    private readonly profiles:
      Repository<CustomerProfile>,

    @InjectRepository(Application)
    private readonly applications:
      Repository<Application>,
  ) {}

  async create(
    dto: CreateCustomerProfileDto,
  ) {
    try {
      await this.assertApplication(
        dto.applicationId,
      );

      const existing =
        await this.profiles.findOne({
          where: {
            applicationId:
              dto.applicationId,
          },
        });

      const profile =
        this.profiles.create({
          ...(existing || {}),

          ...this.money(
            dto as unknown as Record<
              string,
              unknown
            >,
          ),

          applicationId:
            dto.applicationId,
        });

      const savedProfile =
        await this.profiles.save(
          profile,
        );

      return {
        success: true,
        message:
          'Customer profile saved successfully.',
        data: savedProfile,
      };
    } catch (error) {
      this.handleError(
        error,
        `Unable to create customer profile for application ${dto.applicationId}`,
      );
    }
  }

  async findByApplication(
    applicationId: number,
  ) {
    try {
      const profile =
        await this.profiles.findOne({
          where: {
            applicationId,
          },
        });

      if (!profile) {
        throw new NotFoundException(
          `Customer profile for application ${applicationId} was not found.`,
        );
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      this.handleError(
        error,
        `Unable to fetch customer profile for application ${applicationId}`,
      );
    }
  }

  async update(
    applicationId: number,
    dto: UpdateCustomerProfileDto,
  ) {
    try {
      const profile =
        await this.profiles.findOne({
          where: {
            applicationId,
          },
        });

      if (!profile) {
        throw new NotFoundException(
          `Customer profile for application ${applicationId} was not found.`,
        );
      }

      const updateData =
        this.money(
          dto as unknown as Record<
            string,
            unknown
          >,
        );

      this.profiles.merge(
        profile,
        updateData,
      );

      const savedProfile =
        await this.profiles.save(
          profile,
        );

      return {
        success: true,
        message:
          'Customer profile updated successfully.',
        data: savedProfile,
      };
    } catch (error) {
      this.handleError(
        error,
        `Unable to update customer profile for application ${applicationId}`,
      );
    }
  }

  private async assertApplication(
    applicationId: number,
  ) {
    const exists =
      await this.applications.exist({
        where: {
          id: applicationId,
        },
      });

    if (!exists) {
      throw new NotFoundException(
        `Application ${applicationId} was not found.`,
      );
    }
  }

  private money(
    input: Record<string, unknown>,
  ) {
    const copy = {
      ...input,
    };

    const moneyFields = [
      'monthlyIncome',
      'annualIncome',
      'marketValue',
      'distressValue',
      'averageBalance',
      'foir',
      'eligibleAmount',
      'roi',
      'emi',
      'recommendedAmount',
      'recommendedRoi',
    ];

    for (const key of moneyFields) {
      if (
        copy[key] !== undefined &&
        copy[key] !== null &&
        copy[key] !== ''
      ) {
        copy[key] = String(
          copy[key],
        );
      }
    }

    return copy;
  }

  private handleError(
    error: unknown,
    context: string,
  ): never {
    if (
      error instanceof HttpException
    ) {
      throw error;
    }

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    const stack =
      error instanceof Error
        ? error.stack
        : undefined;

    this.logger.error(
      `${context}: ${message}`,
      stack,
    );

    throw new InternalServerErrorException(
      'Unable to process customer profile request.',
    );
  }
}