import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { CustomerType } from '../../common/enums/customer-profile.enum';
import { DocumentType } from '../../common/enums/document-type.enum';
import { WorkflowAction } from '../../common/enums/workflow-action.enum';
import { createReferenceNumber } from '../../common/utils/reference-number.util';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { CreateVisitDto } from '../visits/dto/create-visit.dto';
import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
import { CreateApplicationWithProfileDto } from './dto/create-application-with-profile.dto';
import { TransitionApplicationDto } from './dto/transition-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { Application } from './entities/application.entity';

export type Actor = { id: number; roles: string[]; permissions: string[] };

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private readonly applications: Repository<Application>,
    @InjectRepository(Visit) private readonly visits: Repository<Visit>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(WorkflowHistory) private readonly history: Repository<WorkflowHistory>,
    @InjectRepository(CustomerProfile) private readonly profiles: Repository<CustomerProfile>,
    private readonly dataSource: DataSource
  ) {}

  async findAll(query: ApplicationFilterDto) {
    const [data, total] = await this.applications.findAndCount({ order: { id: 'DESC' }, skip: (query.page - 1) * query.limit, take: query.limit });
    return { data, meta: { total, page: query.page, limit: query.limit } };
  }

  async search(term: string) {
    const where = term
      ? [{ applicationNumber: Like(`%${term}%`) }, { customerName: Like(`%${term}%`) }, { mobile: Like(`%${term}%`) }, { pan: Like(`%${term}%`) }]
      : [];
    return { data: await this.applications.find({ where, order: { id: 'DESC' }, take: 25 }) };
  }

  async create(dto: CreateApplicationDto, actor: Actor) {
    const entity = this.applications.create({ ...dto, requestedAmount: dto.requestedAmount ?? '0', applicationNumber: 'TEMP', createdBy: actor.id, updatedBy: actor.id });
    const saved = await this.applications.save(entity);
    saved.applicationNumber = createReferenceNumber('LAP', saved.id);
    return { data: await this.applications.save(saved) };
  }

  async draft(dto: CreateApplicationWithProfileDto, actor: Actor) {
    if (!dto.customerName?.trim() || !dto.mobile?.trim() || !dto.requestedAmount) {
      throw new BadRequestException('customerName, mobile and requestedAmount are required for draft');
    }
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(Application, {
        customerName: dto.customerName.trim(),
        mobile: dto.mobile.trim(),
        pan: dto.pan?.trim(),
        requestedAmount: dto.requestedAmount || '0',
        applicationNumber: 'TEMP',
        status: ApplicationStatus.DRAFT,
        stage: ApplicationStage.RM,
        createdBy: actor.id,
        updatedBy: actor.id,
      });
      const saved = await manager.save(entity);
      saved.applicationNumber = createReferenceNumber('LAP', saved.id);
      await manager.save(saved);
      const profile = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);
      await manager.save(CustomerProfile, manager.create(CustomerProfile, profile as Partial<CustomerProfile>));
      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId: saved.id, fromRole: ApplicationStage.RM, toRole: ApplicationStage.RM, action: 'SAVE_DRAFT', remarks: dto.remarks || 'Saved as draft', actionBy: actor.id }));
      return { data: saved };
    });
  }

  async submit(dto: CreateApplicationWithProfileDto, actor: Actor) {
    const errors: string[] = [];
    if (!dto.customerName?.trim()) errors.push('customerName is required');
    if (!dto.mobile?.trim()) errors.push('mobile is required');
    if (!dto.pan?.trim()) errors.push('pan is required');
    if (!dto.aadhaarNumber?.trim()) errors.push('aadhaarNumber is required');
    if (!dto.requestedAmount) errors.push('requestedAmount is required');
    if (!dto.occupationType) errors.push('occupationType is required');
    if (!dto.monthlyIncome && dto.monthlyIncome !== 0) errors.push('monthlyIncome is required');
    if (!dto.propertyType?.trim()) errors.push('propertyType is required');
    if (!dto.marketValue && dto.marketValue !== 0) errors.push('marketValue is required');
    if (!dto.propertyAddress?.trim()) errors.push('propertyAddress is required');
    if (!dto.propertyCity?.trim()) errors.push('propertyCity is required');
    if (!dto.propertyState?.trim()) errors.push('propertyState is required');
    if (!dto.propertyPincode?.trim()) errors.push('propertyPincode is required');
    if (errors.length) throw new BadRequestException(errors.join(', '));
    return this.dataSource.transaction(async (manager) => {
      const entity = manager.create(Application, {
        customerName: dto.customerName.trim(),
        mobile: dto.mobile.trim(),
        pan: dto.pan?.trim(),
        requestedAmount: dto.requestedAmount || '0',
        applicationNumber: 'TEMP',
        status: ApplicationStatus.NEW,
        stage: ApplicationStage.RM,
        createdBy: actor.id,
        updatedBy: actor.id,
      });
      const saved = await manager.save(entity);
      saved.applicationNumber = createReferenceNumber('LAP', saved.id);
      await manager.save(saved);
      const profile = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);
      await manager.save(CustomerProfile, manager.create(CustomerProfile, profile as Partial<CustomerProfile>));
      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId: saved.id, fromRole: ApplicationStage.RM, toRole: ApplicationStage.RM, action: 'SUBMIT', remarks: dto.remarks || 'Application submitted', actionBy: actor.id }));
      await manager.save(AuditLog, manager.create(AuditLog, { action: 'SUBMIT', entityName: 'applications', entityId: saved.id, snapshot: { status: saved.status, stage: saved.stage }, createdBy: actor.id }));
      return { data: saved };
    });
  }

  async findOne(id: number) {
    const application = await this.applications.findOneBy({ id });
    if (!application) throw new NotFoundException('Application not found');
    return { data: application };
  }

  async update(id: number, dto: UpdateApplicationDto, actor: Actor) {
    const application = await this.applications.preload({ id, ...dto, updatedBy: actor.id });
    if (!application) throw new NotFoundException('Application not found');
    return { data: await this.applications.save(application) };
  }

  async remove(id: number) {
    const result = await this.applications.delete(id);
    if (!result.affected) throw new NotFoundException('Application not found');
    return { data: null, message: 'Application deleted' };
  }

  async addVisit(applicationId: number, dto: CreateVisitDto, actor: Actor) {
    await this.findOne(applicationId);
    return { data: await this.visits.save(this.visits.create({ ...dto, applicationId, createdBy: actor.id, updatedBy: actor.id })) };
  }

  async listVisits(applicationId: number) {
    return { data: await this.visits.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async addDocument(applicationId: number, documentType: string, file: Express.Multer.File, actor: Actor) {
    await this.findOne(applicationId);
    return { data: await this.documents.save(this.documents.create({ applicationId, documentType: documentType as DocumentType, documentName: documentType, fileName: file.originalname, filePath: file.path ?? file.originalname, fileSize: file.size, mimeType: file.mimetype, uploadedBy: actor.id, createdBy: actor.id, updatedBy: actor.id })) };
  }

  async listDocuments(applicationId: number) {
    return { data: await this.documents.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async transition(applicationId: number, dto: TransitionApplicationDto, actor: Actor) {
    if (!actor.permissions?.includes(PERMISSIONS.APPLICATION_TRANSITION)) throw new ForbiddenException('Missing workflow permission');
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId }, lock: { mode: 'pessimistic_write' } });
      if (!application) throw new NotFoundException('Application not found');
      if (application.version !== dto.expectedVersion) throw new BadRequestException('Application version changed');
      const fromStage = application.stage;
      if (dto.action === WorkflowAction.SUBMIT_TO_BM) {
        if (application.stage !== ApplicationStage.RM) throw new BadRequestException('Invalid stage for BM submission');
        application.stage = ApplicationStage.BM;
        application.status = ApplicationStatus.BM_PENDING;
      } else if (dto.action === 'BM_APPROVE') {
        if (!actor.permissions.includes(PERMISSIONS.BM_APPROVE)) throw new ForbiddenException('Missing BM approval permission');
        if (application.stage !== ApplicationStage.BM) throw new BadRequestException('Application is not in BM review');
        application.stage = ApplicationStage.CM;
        application.status = ApplicationStatus.CM_PENDING;
      }
      application.updatedBy = actor.id;
      const saved = await manager.save(application);
      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId, fromRole: fromStage, toRole: saved.stage, action: dto.action, remarks: dto.remarks, actionBy: actor.id }));
      await manager.save(AuditLog, manager.create(AuditLog, { action: dto.action, entityName: 'applications', entityId: applicationId, snapshot: { fromStage, toStage: saved.stage }, createdBy: actor.id }));
      return { data: saved };
    });
  }

  async workflowHistory(applicationId: number) {
    return { data: await this.history.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  private money(dto: Record<string, unknown>) {
    const copy = { ...dto };
    for (const key of ['monthlyIncome', 'annualIncome', 'marketValue', 'distressValue', 'averageBalance', 'foir', 'eligibleAmount', 'roi', 'emi', 'recommendedAmount', 'recommendedRoi']) {
      if (copy[key] !== undefined) copy[key] = String(copy[key]);
    }
    return copy;
  }

  private buildProfile(application: Application, dto: CreateApplicationWithProfileDto): Record<string, unknown> {
    const parts = dto.customerName.trim().split(/\s+/);
    return {
      applicationId: application.id,
      customerType: dto.customerType || CustomerType.INDIVIDUAL,
      firstName: dto.firstName || parts[0] || dto.customerName.trim(),
      lastName: dto.lastName || parts[parts.length - 1] || dto.customerName.trim(),
      middleName: dto.middleName || (parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined),
      mobile: dto.mobile.trim(),
      email: dto.email || undefined,
      occupationType: dto.occupationType,
      businessName: dto.businessName || undefined,
      monthlyIncome: dto.monthlyIncome ?? undefined,
      panNumber: dto.pan || undefined,
      aadhaarNumber: dto.aadhaarNumber || undefined,
      propertyType: dto.propertyType || undefined,
      propertyAddress: dto.propertyAddress || undefined,
      propertyCity: dto.propertyCity || undefined,
      propertyState: dto.propertyState || undefined,
      propertyPincode: dto.propertyPincode || undefined,
      marketValue: dto.marketValue ?? undefined,
      foir: dto.foir ?? undefined,
      eligibleAmount: dto.eligibleAmount ?? (dto.requestedAmount ? Number(dto.requestedAmount) : undefined),
      roi: dto.roi ?? undefined,
      tenure: dto.tenure ?? undefined,
      emi: dto.emi ?? undefined,
      recommendedAmount: dto.recommendedAmount ?? undefined,
      recommendedRoi: dto.recommendedRoi ?? undefined,
      recommendedTenure: dto.recommendedTenure ?? undefined,
      rmRecommendation: dto.rmRecommendation || undefined,
      remarks: dto.remarks || undefined,
    };
  }
}
