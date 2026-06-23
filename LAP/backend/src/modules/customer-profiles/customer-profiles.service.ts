import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { CustomerProfile } from './entities/customer-profile.entity';

@Injectable()
export class CustomerProfilesService {
  constructor(
    @InjectRepository(CustomerProfile) private readonly profiles: Repository<CustomerProfile>,
    @InjectRepository(Application) private readonly applications: Repository<Application>
  ) {}

  async create(dto: CreateCustomerProfileDto) {
    await this.assertApplication(dto.applicationId);
    const existing = await this.profiles.findOneBy({ applicationId: dto.applicationId });
    const profile = this.profiles.create({ ...(existing ?? {}), ...this.money(dto as unknown as Record<string, unknown>), applicationId: dto.applicationId });
    return { data: await this.profiles.save(profile) };
  }

  async findByApplication(applicationId: number) {
    const profile = await this.profiles.findOneBy({ applicationId });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return { data: profile };
  }

  async update(applicationId: number, dto: UpdateCustomerProfileDto) {
    const profile = await this.profiles.findOneBy({ applicationId });
    if (!profile) throw new NotFoundException('Customer profile not found');
    return { data: await this.profiles.save(this.profiles.merge(profile, this.money(dto as unknown as Record<string, unknown>))) };
  }

  private async assertApplication(applicationId: number) {
    if (!(await this.applications.exist({ where: { id: applicationId } }))) throw new NotFoundException('Application not found');
  }

  private money(dto: Record<string, unknown>) {
    const copy = { ...dto };
    for (const key of ['monthlyIncome', 'annualIncome', 'marketValue', 'distressValue', 'averageBalance', 'foir', 'eligibleAmount', 'roi', 'emi', 'recommendedAmount', 'recommendedRoi']) {
      if (copy[key] !== undefined) copy[key] = String(copy[key]);
    }
    return copy;
  }
}
