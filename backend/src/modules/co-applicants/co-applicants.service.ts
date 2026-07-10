// src/co-applicants/co-applicants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import { SaveCoApplicantsBulkDto } from './dto/save-co-applicants-bulk.dto';
import { CoApplicant } from './entities/co-applicant.entity';

@Injectable()
export class CoApplicantsService {
  constructor(
    @InjectRepository(CoApplicant) private readonly coApplicantsRepo: Repository<CoApplicant>,
    @InjectRepository(Application) private readonly applicationsRepo: Repository<Application>,
    private readonly dataSource: DataSource,
  ) {}

  async findByApplication(applicationId: number) {
    const data = await this.coApplicantsRepo.find({
      where: { applicationId },
      order: { id: 'ASC' }, // Consistent array reading order for your frontend rows
    });
    return { data };
  }

  async saveBulk(dto: SaveCoApplicantsBulkDto) {
    const { applicationId, coApplicants } = dto;
    console.log('[CoApplicantsService.saveBulk] payload:', {
      applicationId,
      coApplicantsCount: Array.isArray(coApplicants) ? coApplicants.length : null,
      coApplicantsPreview: Array.isArray(coApplicants) ? coApplicants.slice(0, 3) : null,
    });
    await this.assertApplication(applicationId);

    // Run using queryRunner to guarantee absolute atomic synchronization state
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Wipe previous entries under this specific application
      await queryRunner.manager.delete(CoApplicant, { applicationId });

      // 2. Map and structurally persist dynamic entries
      console.log('[CoApplicantsService.saveBulk] normalizing coApplicants...');
      const entities = coApplicants.map((item) => {
        return queryRunner.manager.create(CoApplicant, {
          ...item,
          applicationId,
          monthlyIncome: item.monthlyIncome !== undefined && item.monthlyIncome !== null 
            ? String(item.monthlyIncome) 
            : undefined,
        });
      });

      console.log('[CoApplicantsService.saveBulk] deleting done. Saving entities... count=', entities.length);
      const savedEntities = await queryRunner.manager.save(CoApplicant, entities);
      console.log('[CoApplicantsService.saveBulk] savedEntities:', savedEntities?.map((s) => ({ id: s.id, applicationId: s.applicationId, mobile: s.mobile })));
      await queryRunner.commitTransaction();

      return { 
        data: savedEntities, 
        message: 'Co-applicants multi-row layout synchronized successfully.' 
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      console.log('[CoApplicantsService.saveBulk] transaction released');
    }
  }

  private async assertApplication(applicationId: number) {
    const exists = await this.applicationsRepo.exist({ where: { id: applicationId } });
    if (!exists) throw new NotFoundException(`Application with ID ${applicationId} not found`);
  }
}