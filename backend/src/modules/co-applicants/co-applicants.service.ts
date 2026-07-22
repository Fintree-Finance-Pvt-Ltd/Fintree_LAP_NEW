// src/co-applicants/co-applicants.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
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
      // Preserve row IDs so verification records remain attached to the correct person.
      const existing = await queryRunner.manager.find(CoApplicant, { where: { applicationId } });
      const existingById = new Map(existing.map((item) => [Number(item.id), item]));
      const retainedIds = coApplicants
        .map((item) => Number(item.id))
        .filter((id) => Number.isInteger(id) && existingById.has(id));
      const removedIds = existing.map((item) => Number(item.id)).filter((id) => !retainedIds.includes(id));

      if (removedIds.length) {
        await queryRunner.manager.delete('kyc_verification_status', { coApplicantId: In(removedIds) });
        await queryRunner.manager.delete(CoApplicant, { id: In(removedIds), applicationId });
      }

      const entities = coApplicants.map((item) => {
        const id = Number(item.id);
        const entity = Number.isInteger(id) && existingById.has(id)
          ? existingById.get(id)!
          : queryRunner.manager.create(CoApplicant, { applicationId });
        entity.name = String(item.name || '').trim();
        entity.mobile = String(item.mobile || '').trim();
        entity.email = item.email ? String(item.email).trim().toLowerCase() : undefined;
        entity.panNumber = item.panNumber ? String(item.panNumber).trim().toUpperCase() : undefined;
        entity.relationship = item.relationship;
        entity.occupation = item.occupation;
        entity.monthlyIncome = item.monthlyIncome !== undefined && item.monthlyIncome !== null
          ? String(item.monthlyIncome) : undefined;
        return entity;
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
