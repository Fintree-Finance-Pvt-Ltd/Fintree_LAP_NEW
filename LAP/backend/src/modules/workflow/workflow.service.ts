import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { DocumentType } from '../../common/enums/document-type.enum';
import { RoleCode } from '../../common/enums/role.enum';
import { WorkflowAction } from '../../common/enums/workflow-action.enum';
import { WorkflowLogAction } from '../../common/enums/workflow-log-action.enum';
import type { Actor } from '../applications/applications.service';
import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { WorkflowActionDto } from './dto/workflow-action.dto';
import { WorkflowHistory } from './entities/workflow-history.entity';
import { WorkflowLog } from './entities/workflow-log.entity';
import { Workflow } from './entities/workflow.entity';

@Injectable()
export class WorkflowService {
  private readonly requiredDocuments = [DocumentType.PAN, DocumentType.AADHAAR, DocumentType.PHOTO, DocumentType.BANK_STATEMENT, DocumentType.PROPERTY_DOCUMENT, DocumentType.INCOME_PROOF];

  constructor(
    @InjectRepository(Workflow) private readonly workflows: Repository<Workflow>,
    @InjectRepository(WorkflowHistory) private readonly history: Repository<WorkflowHistory>,
    @InjectRepository(WorkflowLog) private readonly workflowLogs: Repository<WorkflowLog>,
    private readonly dataSource: DataSource
  ) {}

  async saveDraft(applicationId: number, dto: WorkflowActionDto, actor: Actor) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId }, lock: { mode: 'pessimistic_write' } });
      if (!application) throw new NotFoundException('Application not found');
      application.stage = ApplicationStage.RM;
      application.status = ApplicationStatus.DRAFT;
      application.updatedBy = actor.id;
      const saved = await manager.save(application);
      await this.upsertWorkflow(manager, saved, WorkflowAction.SAVE_DRAFT, dto.remarks, RoleCode.RM, actor.id);
      return { data: saved };
    });
  }

  async submitToBm(applicationId: number, dto: WorkflowActionDto, actor: Actor) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId }, lock: { mode: 'pessimistic_write' } });
      if (!application) throw new NotFoundException('Application not found');
      await this.validateRmSubmission(manager, applicationId);
      application.stage = ApplicationStage.BM;
      application.status = ApplicationStatus.BM_PENDING;
      application.updatedBy = actor.id;
      const saved = await manager.save(application);
      await this.upsertWorkflow(manager, saved, WorkflowAction.SUBMIT_TO_BM, dto.remarks, RoleCode.BM, actor.id);
      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId, fromRole: RoleCode.RM, toRole: RoleCode.BM, action: WorkflowAction.SUBMIT_TO_BM, remarks: dto.remarks ?? 'Submitted to BM', actionBy: actor.id }));
      await manager.save(WorkflowLog, manager.create(WorkflowLog, { applicationId, action: WorkflowLogAction.SUBMITTED_TO_BM, remarks: dto.remarks ?? 'Submitted to BM', createdBy: actor.id }));
      await manager.save(Notification, manager.create(Notification, { applicationId, title: 'LAP case pending BM review', message: `${application.applicationNumber} is pending BM review.` }));
      await manager.save(AuditLog, manager.create(AuditLog, { action: WorkflowAction.SUBMIT_TO_BM, entityName: 'applications', entityId: applicationId, snapshot: { status: saved.status, stage: saved.stage }, createdBy: actor.id }));
      return { data: saved };
    });
  }

  async sendBack(applicationId: number, dto: WorkflowActionDto, actor: Actor) {
    if (!dto.remarks) throw new BadRequestException('Remarks are required to send back');
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId }, lock: { mode: 'pessimistic_write' } });
      if (!application) throw new NotFoundException('Application not found');
      const fromRole = application.stage;
      application.stage = ApplicationStage.RM;
      application.status = ApplicationStatus.DRAFT;
      application.updatedBy = actor.id;
      const saved = await manager.save(application);
      await this.upsertWorkflow(manager, saved, WorkflowAction.SEND_BACK, dto.remarks, RoleCode.RM, actor.id);
      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId, fromRole, toRole: RoleCode.RM, action: WorkflowAction.SEND_BACK, remarks: dto.remarks, actionBy: actor.id }));
      return { data: saved };
    });
  }

  async find(applicationId: number) {
    const workflow = await this.workflows.findOneBy({ applicationId });
    if (!workflow) throw new NotFoundException('Workflow not found');
    return { data: workflow };
  }

  async findHistory(applicationId: number) {
    return { data: await this.history.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  private async upsertWorkflow(manager: DataSource['manager'], application: Application, action: WorkflowAction, remarks: string | undefined, assignedTo: RoleCode, actorId: number) {
    const existing = await manager.findOne(Workflow, { where: { applicationId: application.id } });
    await manager.save(Workflow, manager.create(Workflow, {
      ...(existing ?? {}),
      applicationId: application.id,
      currentStage: application.stage,
      currentStatus: application.status,
      assignedTo,
      currentOwner: application.assignedTo,
      lastAction: action,
      lastRemarks: remarks,
    }));
    await manager.save(AuditLog, manager.create(AuditLog, { action, entityName: 'workflow', entityId: application.id, snapshot: { assignedTo, actorId }, createdBy: actorId }));
  }

  private async validateRmSubmission(manager: DataSource['manager'], applicationId: number) {
    const profile = await manager.findOne(CustomerProfile, { where: { applicationId } });
    if (!profile) throw new BadRequestException('Customer profile is required');
    if (!profile.panVerified) throw new BadRequestException('PAN verification is required');
    if (!profile.aadhaarVerified) throw new BadRequestException('Aadhaar verification is required');
    if (!profile.foir || !profile.eligibleAmount || !profile.roi || !profile.tenure || !profile.emi) throw new BadRequestException('Eligibility calculation is required');
    if (!profile.recommendedAmount || !profile.recommendedRoi || !profile.recommendedTenure || !profile.rmRecommendation) throw new BadRequestException('RM recommendation is required');
    const documents = await manager.find(Document, { where: { applicationId, documentType: In(this.requiredDocuments) }, select: ['documentType'] });
    const uploaded = new Set(documents.map((document) => document.documentType));
    const missing = this.requiredDocuments.filter((type) => !uploaded.has(type));
    if (missing.length) throw new BadRequestException(`Required documents missing: ${missing.join(', ')}`);
  }
}
