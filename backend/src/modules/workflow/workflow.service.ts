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
import { WorkflowApprovalLog } from './entities/workflow-approval-log.entity';
import { WorkflowLog } from './entities/workflow-log.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowTransitionService } from './workflow-transition.service';

@Injectable()
export class WorkflowService {
  private readonly requiredDocuments = [DocumentType.PAN, DocumentType.AADHAAR, DocumentType.PHOTO, DocumentType.BANK_STATEMENT, DocumentType.PROPERTY_DOCUMENT, DocumentType.INCOME_PROOF];

  constructor(
    @InjectRepository(Workflow) private readonly workflows: Repository<Workflow>,
    @InjectRepository(WorkflowHistory) private readonly history: Repository<WorkflowHistory>,
    @InjectRepository(WorkflowApprovalLog) private readonly approvalLogs: Repository<WorkflowApprovalLog>,
    @InjectRepository(WorkflowLog) private readonly workflowLogs: Repository<WorkflowLog>,
    private readonly dataSource: DataSource,
    private readonly workflowTransitions: WorkflowTransitionService,
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
      const movement = await this.workflowTransitions.move({
        applicationId,
        action: 'RM_SUBMIT_TO_BM',
        remarks: dto.remarks,
        actor,
        manager,
      });
      const saved = movement.data.application;
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
    const application = await this.dataSource.manager.findOne(Application, { where: { id: applicationId } });
    return { success: true, data: { workflow, application } };
  }

  async findHistory(applicationId: number) {
    return {
      success: true,
      data: await this.approvalLogs.find({
        where: { applicationId },
        order: { createdAt: 'DESC', id: 'DESC' },
      }),
    };
  }

  async findCases(query: any) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const builder = this.workflows.createQueryBuilder('workflow')
      .leftJoinAndSelect('workflow.application', 'application');
    if (query?.stage) builder.andWhere('workflow.currentStage = :stage', { stage: String(query.stage).toUpperCase() });
    if (query?.status) builder.andWhere('workflow.currentStatus = :status', { status: String(query.status).toUpperCase() });
    if (query?.assignedToRole) {
      builder.andWhere('workflow.currentAssignedRole = :assignedToRole', {
        assignedToRole: String(query.assignedToRole).toUpperCase(),
      });
    }
    const [data, total] = await builder.orderBy('workflow.updatedAt', 'DESC')
      .skip((page - 1) * limit).take(limit).getManyAndCount();
    return { success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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
