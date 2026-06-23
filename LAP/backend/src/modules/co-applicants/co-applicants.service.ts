import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { CreateCoApplicantDto } from './dto/create-co-applicant.dto';
import { UpdateCoApplicantDto } from './dto/update-co-applicant.dto';
import { CoApplicant } from './entities/co-applicant.entity';

@Injectable()
export class CoApplicantsService {
  constructor(
    @InjectRepository(CoApplicant) private readonly coApplicants: Repository<CoApplicant>,
    @InjectRepository(Application) private readonly applications: Repository<Application>
  ) {}
  async create(dto: CreateCoApplicantDto) {
    await this.assertApplication(dto.applicationId);
    return { data: await this.coApplicants.save(this.coApplicants.create({ ...dto, monthlyIncome: dto.monthlyIncome === undefined ? undefined : String(dto.monthlyIncome) })) };
  }
  async findByApplication(applicationId: number) {
    return { data: await this.coApplicants.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }
  async update(id: number, dto: UpdateCoApplicantDto) {
    const entity = await this.coApplicants.preload({ ...dto, id, monthlyIncome: dto.monthlyIncome === undefined ? undefined : String(dto.monthlyIncome) });
    if (!entity) throw new NotFoundException('Co-applicant not found');
    return { data: await this.coApplicants.save(entity) };
  }
  async remove(id: number) {
    const result = await this.coApplicants.delete(id);
    if (!result.affected) throw new NotFoundException('Co-applicant not found');
    return { data: null, message: 'Co-applicant deleted' };
  }
  private async assertApplication(applicationId: number) {
    if (!(await this.applications.exist({ where: { id: applicationId } }))) throw new NotFoundException('Application not found');
  }
}
