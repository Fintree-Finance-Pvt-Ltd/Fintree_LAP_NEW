import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { DocumentType } from '../../common/enums/document-type.enum';
import { WorkflowAction } from '../../common/enums/workflow-action.enum';
import { createReferenceNumber } from '../../common/utils/reference-number.util';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Document } from '../documents/entities/document.entity';
import { CreateVisitDto } from '../visits/dto/create-visit.dto';
import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { ApplicationFilterDto } from './dto/application-filter.dto';
import { CreateApplicationDto } from './dto/create-application.dto';
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
}
