import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository, SelectQueryBuilder } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { CustomerType } from '../../common/enums/customer-profile.enum';
import { DocumentType } from '../../common/enums/document-type.enum';
import { WorkflowAction } from '../../common/enums/workflow-action.enum';
import { WorkflowLogAction } from '../../common/enums/workflow-log-action.enum';
import { createReferenceNumber } from '../../common/utils/reference-number.util';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentsService } from '../documents/documents.service';

import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { Application } from './entities/application.entity';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

export type Actor = { id: number; roles: string[]; permissions: string[] };


type MisReportQuery = {
  page?: string | number;
  limit?: string | number;
  hubId?: string | number;
  spokeId?: string | number;
  fromDate?: string;
  toDate?: string;
  stage?: string;
  search?: string;
};

type MisCaseRaw = {
  id: string | number;
  leadId: string | null;
  applicant: string | null;
  mobile: string | null;
  pan: string | null;
  amount: string | number | null;
  stage: string | null;
  status: string | null;
  createdAt: Date | string | null;
  profile: string | null;
  property: string | null;
  city: string | null;
  rmId: string | number | null;
  rmName: string | null;
  partnerId: string | number | null;
  partnerName: string | null;
  spokeId: string | number | null;
  spoke: string | null;
  hubId: string | number | null;
  hub: string | null;
  source: string | null;
};

type MisStageRaw = {
  stage: string | null;
  count: string | number;
};

type MisMetricsRaw = {
  leads: string | number;
  logins: string | number;
  sanctionCount: string | number;
  sanctionAmount: string | number;
  disbursementCount: string | number;
  disbursementAmount: string | number;
};

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application) private readonly applications: Repository<Application>,
    @InjectRepository(Visit) private readonly visits: Repository<Visit>,
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(WorkflowHistory) private readonly history: Repository<WorkflowHistory>,
    @InjectRepository(Workflow) private readonly workflows: Repository<Workflow>,
    @InjectRepository(WorkflowLog) private readonly workflowLogs: Repository<WorkflowLog>,
    @InjectRepository(CustomerProfile) private readonly profiles: Repository<CustomerProfile>,
    private readonly dataSource: DataSource,
    private readonly workflowTransitions: WorkflowTransitionService,
    private readonly documentsService: DocumentsService,
  ) {}

  private isWorkflowLogAction(
  value: string,
): value is WorkflowLogAction {
  return Object.values(
    WorkflowLogAction,
  ).includes(
    value as WorkflowLogAction,
  );
}
  // async findAll(query: any) {
  //   const [data, total] = await this.applications.findAndCount({ order: { id: 'DESC' }, skip: (query.page - 1) * query.limit, take: query.limit });
  //   return { data, meta: { total, page: query.page, limit: query.limit } };
  // }

  async findAll(query: any = {}) {
  const pageValue = Number.parseInt(
    String(query?.page ?? '1'),
    10,
  );

  const limitValue = Number.parseInt(
    String(query?.limit ?? '50'),
    10,
  );

  const page =
    Number.isFinite(pageValue) &&
    pageValue > 0
      ? pageValue
      : 1;

  const limit =
    Number.isFinite(limitValue) &&
    limitValue > 0
      ? Math.min(limitValue, 100)
      : 50;

  const [data, total] =
    await this.applications.findAndCount({
      order: {
        id: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages:
        total === 0
          ? 0
          : Math.ceil(total / limit),
    },
  };
}
  /**
   * Case-level MIS sourced from applications and customer_profiles.
   * Hub, Spoke and Partner are resolved through the user who created the case.
   */
  async getMisReport(query: MisReportQuery = {}) {
    const page = this.positiveInt(query.page, 1);
    const limit = this.positiveInt(query.limit, 50, 100);
    const offset = (page - 1) * limit;
    const baseQuery = this.buildMisQuery(query);

    const caseQuery = baseQuery
      .clone()
      .select([
        'application.id AS id',
        'application.application_number AS leadId',
        'application.customer_name AS applicant',
        'application.mobile AS mobile',
        'application.pan AS pan',
        'application.requested_amount AS amount',
        'application.stage AS stage',
        'application.status AS status',
        'application.created_at AS createdAt',
        "COALESCE(profile.occupation_type, profile.customer_type, 'Not Available') AS profile",
        "COALESCE(profile.property_type, 'Not Available') AS property",
        "COALESCE(profile.property_city, profile.current_city, 'Not Available') AS city",
        'creator.id AS rmId',
        'creator.name AS rmName',
        'partner.id AS partnerId',
        'partner.name AS partnerName',
        'spoke.id AS spokeId',
        'spoke.name AS spoke',
        'hub.id AS hubId',
        'hub.name AS hub',
        "CASE WHEN partner.id IS NULL THEN 'Direct' ELSE CONCAT('Partner - ', partner.name) END AS source",
      ])
      .orderBy('application.id', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<MisCaseRaw>();

    const stageQuery = baseQuery
      .clone()
      .select('application.stage', 'stage')
      .addSelect('COUNT(DISTINCT application.id)', 'count')
      .groupBy('application.stage')
      .orderBy('COUNT(DISTINCT application.id)', 'DESC')
      .getRawMany<MisStageRaw>();

    const sanctionCondition =
      "(UPPER(application.stage) LIKE '%SANCTION%' OR UPPER(application.status) LIKE '%SANCTION%')";
    const disbursementCondition =
      "(UPPER(application.stage) LIKE '%DISBURS%' OR UPPER(application.status) LIKE '%DISBURS%')";

    const metricsQuery = baseQuery
      .clone()
      .select('COUNT(DISTINCT application.id)', 'leads')
      .addSelect(
        "COUNT(DISTINCT CASE WHEN UPPER(application.status) <> 'DRAFT' THEN application.id END)",
        'logins',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN ${sanctionCondition} THEN application.id END)`,
        'sanctionCount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN ${sanctionCondition} THEN application.requested_amount ELSE 0 END), 0)`,
        'sanctionAmount',
      )
      .addSelect(
        `COUNT(DISTINCT CASE WHEN ${disbursementCondition} THEN application.id END)`,
        'disbursementCount',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN ${disbursementCondition} THEN application.requested_amount ELSE 0 END), 0)`,
        'disbursementAmount',
      )
      .getRawOne<MisMetricsRaw>();

    const [rawCases, rawStages, rawMetrics] = await Promise.all([
      caseQuery,
      stageQuery,
      metricsQuery,
    ]);

    const metrics = rawMetrics ?? {
      leads: 0,
      logins: 0,
      sanctionCount: 0,
      sanctionAmount: 0,
      disbursementCount: 0,
      disbursementAmount: 0,
    };
    const total = Number(metrics.leads ?? 0);

    return {
      success: true,
      message: 'MIS report fetched successfully.',
      data: {
        metrics: {
          leadsMtd: total,
          loginsMtd: Number(metrics.logins ?? 0),
          sanctionsMtd: {
            count: Number(metrics.sanctionCount ?? 0),
            amount: Number(metrics.sanctionAmount ?? 0),
          },
          disbursementsMtd: {
            count: Number(metrics.disbursementCount ?? 0),
            amount: Number(metrics.disbursementAmount ?? 0),
          },
        },
        stagePipeline: rawStages.map((item) => ({
          stage: item.stage || 'Not Available',
          count: Number(item.count ?? 0),
        })),
        cases: rawCases.map((application) => {
          const amount = Number(application.amount ?? 0);

          return {
            id: Number(application.id),
            leadId: application.leadId,
            source: application.source || 'Direct',
            applicant: application.applicant || 'Not Available',
            profile: application.profile || 'Not Available',
            mobile: application.mobile || 'Not Available',
            pan: application.pan || 'Not Available',
            amount,
            amountDisplay: this.formatInr(amount),
            property: application.property || 'Not Available',
            city: application.city || 'Not Available',
            stage: application.stage || 'Not Available',
            status: application.status || 'Not Available',
            hubId: this.nullableNumber(application.hubId),
            hub: application.hub || 'Not Assigned',
            spokeId: this.nullableNumber(application.spokeId),
            spoke: application.spoke || 'Not Assigned',
            rmId: this.nullableNumber(application.rmId),
            rmName: application.rmName || 'Not Assigned',
            partnerId: this.nullableNumber(application.partnerId),
            partnerName: application.partnerName || null,
            createdAt: application.createdAt,
          };
        }),
        pagination: {
          page,
          limit,
          total,
          totalPages: total ? Math.ceil(total / limit) : 0,
        },
      },
    };
  }

  private buildMisQuery(
    query: MisReportQuery,
  ): SelectQueryBuilder<Application> {
    const qb = this.applications
      .createQueryBuilder('application')
      .leftJoin(
        'customer_profiles',
        'profile',
        'profile.application_id = application.id',
      )
      .leftJoin(
        'users',
        'creator',
        'creator.id = application.created_by',
      )
      .leftJoin(
        'partners',
        'partner',
        'partner.id = creator.partnerId',
      )
      .leftJoin(
        'spokes',
        'spoke',
        'LOWER(TRIM(spoke.name)) = LOWER(TRIM(creator.location))',
      )
      .leftJoin(
        'hubs',
        'direct_hub',
        'LOWER(TRIM(direct_hub.name)) = LOWER(TRIM(creator.location))',
      )
      .leftJoin(
        'hubs',
        'hub',
        'hub.id = COALESCE(spoke.hub_id, direct_hub.id)',
      );

    const fromDate = this.text(query.fromDate);
    const toDate = this.text(query.toDate);
    const search = this.text(query.search);
    const stage = this.text(query.stage).toUpperCase();
    const hubId = Number(query.hubId);
    const spokeId = Number(query.spokeId);

    if (fromDate) {
      qb.andWhere('DATE(application.created_at) >= :fromDate', { fromDate });
    }

    if (toDate) {
      qb.andWhere('DATE(application.created_at) <= :toDate', { toDate });
    }

    if (Number.isInteger(hubId) && hubId > 0) {
      qb.andWhere('hub.id = :hubId', { hubId });
    }

    if (Number.isInteger(spokeId) && spokeId > 0) {
      qb.andWhere('spoke.id = :spokeId', { spokeId });
    }

    if (stage && stage !== 'ALL STAGES') {
      qb.andWhere('UPPER(application.stage) = :stage', { stage });
    }

    if (search) {
      qb.andWhere(
        `(
          application.application_number LIKE :search OR
          application.customer_name LIKE :search OR
          application.mobile LIKE :search OR
          application.pan LIKE :search OR
          profile.property_type LIKE :search OR
          profile.property_city LIKE :search OR
          application.stage LIKE :search OR
          application.status LIKE :search OR
          creator.name LIKE :search OR
          partner.name LIKE :search OR
          spoke.name LIKE :search OR
          hub.name LIKE :search
        )`,
        { search: `%${search}%` },
      );
    }

    return qb;
  }

  private positiveInt(
    value: unknown,
    fallback: number,
    maximum = Number.MAX_SAFE_INTEGER,
  ): number {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, maximum)
      : fallback;
  }

  private nullableNumber(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  private text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private formatInr(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  async search(term: string) {
    const where = term
      ? [{ applicationNumber: Like(`%${term}%`) }, { customerName: Like(`%${term}%`) }, { mobile: Like(`%${term}%`) }, { pan: Like(`%${term}%`) }]
      : [];
    return { data: await this.applications.find({ where, order: { id: 'DESC' }, take: 25 }) };
  }

  async create(dto: any, actor: Actor) {
    const entity = this.applications.create({ ...dto, requestedAmount: dto.requestedAmount ?? '0', applicationNumber: 'TEMP', createdBy: actor.id, updatedBy: actor.id });
    const saved = await this.applications.save(entity) as unknown as Application;
    saved.applicationNumber = createReferenceNumber('LAP', saved.id);
    return { data: await this.applications.save(saved) };
  }

  async draft(dto: any, actor: Actor) {
    if (!dto.customerName?.trim() || !dto.mobile?.trim() || !dto.requestedAmount) {
      throw new BadRequestException('customerName, mobile and requestedAmount are required for draft');
    }

    // OTP-gating: without verified OTP token we MUST NOT create an application.
    if (!dto.applicationId && !dto.verificationToken) {
      throw new BadRequestException('verificationToken is required to create a lead draft');
    }

    return this.dataSource.transaction(async (manager) => {
      // If applicationId exists, ONLY UPDATE it (no duplicates).
      if (dto.applicationId) {
        const existing = await manager.findOne(Application, { where: { id: dto.applicationId }, lock: { mode: 'pessimistic_write' } });
        if (!existing) throw new NotFoundException('Application not found');

        existing.customerName = dto.customerName.trim();
        existing.mobile = dto.mobile.trim();
        if (dto.pan !== undefined) {
          const nextPan = dto.pan?.trim();
          existing.panVerified =
            Boolean(existing.panVerified) && nextPan === existing.pan;
          existing.pan = nextPan;
        }
        existing.requestedAmount = dto.requestedAmount || '0';
        existing.stage = ApplicationStage.RM;
        existing.status = ApplicationStatus.DRAFT;
        existing.updatedBy = actor.id;

        const saved = await manager.save(existing);

        let customerProfile = await manager.findOne(CustomerProfile, { where: { applicationId: saved.id } });
        const profileData = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);

        if (customerProfile) {
          Object.assign(customerProfile, profileData);
          await manager.save(customerProfile);
        } else {
          customerProfile = manager.create(CustomerProfile, profileData as Partial<CustomerProfile>);
          await manager.save(customerProfile);
        }

        // Keep it idempotent: only upsert workflow and history when creating for the first time.
        return { data: saved };
      }

      // If a draft already exists for this mobile + customerName in DRAFT, reuse it.
      // (Best-effort de-duplication in absence of a direct token->application mapping table.)
      const existingDraft = await manager.findOne(Application, {
        where: {
          customerName: dto.customerName.trim(),
          mobile: dto.mobile.trim(),
          status: ApplicationStatus.DRAFT,
          stage: ApplicationStage.RM,
        },
        lock: { mode: 'pessimistic_write' },
      });

      const application =
        existingDraft ??
        manager.create(Application, {
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

      if (!existingDraft) {
        const saved = await manager.save(application);
        saved.applicationNumber = createReferenceNumber('LAP', saved.id);
        await manager.save(saved);

        let customerProfile = await manager.findOne(CustomerProfile, { where: { applicationId: saved.id } });
        const profileData = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);

        if (customerProfile) {
          Object.assign(customerProfile, profileData);
          await manager.save(customerProfile);
        } else {
          customerProfile = manager.create(CustomerProfile, profileData as Partial<CustomerProfile>);
          await manager.save(customerProfile);
        }

        await manager.save(
          WorkflowHistory,
          manager.create(WorkflowHistory, {
            applicationId: saved.id,
            fromRole: ApplicationStage.RM,
            toRole: ApplicationStage.RM,
            action: WorkflowAction.SAVE_DRAFT,
            remarks: dto.remarks || 'Saved as draft',
            actionBy: actor.id,
          }),
        );

        await manager.save(
          Workflow,
          manager.create(Workflow, {
            applicationId: saved.id,
            currentStage: ApplicationStage.RM,
            currentStatus: ApplicationStatus.DRAFT,
            assignedTo: actor.roles?.[0],
            currentOwner: actor.id,
            lastAction: WorkflowAction.SAVE_DRAFT,
            lastRemarks: dto.remarks || 'Saved as draft',
          }),
        );

        return { data: saved };
      }

      // Update existing draft
      if (dto.pan !== undefined) {
        const nextPan = dto.pan?.trim();
        existingDraft.panVerified =
          Boolean(existingDraft.panVerified) && nextPan === existingDraft.pan;
        existingDraft.pan = nextPan;
      }
      existingDraft.requestedAmount = dto.requestedAmount || '0';
      existingDraft.updatedBy = actor.id;
      existingDraft.stage = ApplicationStage.RM;
      existingDraft.status = ApplicationStatus.DRAFT;

      const saved = await manager.save(existingDraft);

      let customerProfile = await manager.findOne(CustomerProfile, { where: { applicationId: saved.id } });
      const profileData = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);

      if (customerProfile) {
        Object.assign(customerProfile, profileData);
        await manager.save(customerProfile);
      } else {
        customerProfile = manager.create(CustomerProfile, profileData as Partial<CustomerProfile>);
        await manager.save(customerProfile);
      }

      return { data: saved };
    });
  }

  async submitDraft(applicationId: number, dto: any, actor: Actor) {
    // Final submission validation is intentionally handled at the frontend.
    // Backend here focuses on: correct status transition DRAFT -> LEAD_CREATED and persisting data.
    // (We still guard the workflow transition itself.)
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, { where: { id: applicationId }, lock: { mode: 'pessimistic_write' } });
      if (!application) throw new NotFoundException('Application not found');
      if (application.status !== ApplicationStatus.DRAFT) throw new BadRequestException('Application must be in DRAFT status');

      // ==========================================
      // 1. PREPARING APPLICATION UPDATE PAYLOAD
      // ==========================================
      application.customerName = dto.customerName.trim();
      application.mobile = dto.mobile.trim();
      if (dto.pan !== undefined) {
        const nextPan = dto.pan?.trim();
        application.panVerified =
          Boolean(application.panVerified) && nextPan === application.pan;
        application.pan = nextPan;
      }
      application.requestedAmount = dto.requestedAmount || '0';
      application.status = ApplicationStatus.LEAD_CREATED;
      application.stage = ApplicationStage.RM;
      application.updatedBy = actor.id;

      console.log('--- DB INSERT/UPDATE: Application Update Payload ---', {
        id: application.id,
        customerName: application.customerName,
        mobile: application.mobile,
        pan: application.pan,
        requestedAmount: application.requestedAmount,
        status: application.status,
        stage: application.stage,
        updatedBy: application.updatedBy
      });

      const saved = await manager.save(application);

      // ==========================================
      // 2. PREPARING CUSTOMER PROFILE PAYLOAD
      // ==========================================
      let customerProfile = await manager.findOne(CustomerProfile, { where: { applicationId: saved.id } });
      const profileData = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);
      
      if (customerProfile) {
        console.log('--- DB INSERT/UPDATE: Customer Profile Update Payload ---', profileData);
        Object.assign(customerProfile, profileData);
        await manager.save(customerProfile);
      } else {
        console.log('--- DB INSERT/UPDATE: Customer Profile Creation Payload ---', profileData);
        customerProfile = manager.create(CustomerProfile, profileData as Partial<CustomerProfile>);
        await manager.save(customerProfile);
      }

      // ==========================================
      // 3. PREPARING WORKFLOW HISTORY PAYLOAD
      // ==========================================
      const workflowHistoryPayload = {
        applicationId: saved.id,
        fromRole: ApplicationStage.RM,
        toRole: ApplicationStage.RM,
        action: WorkflowAction.SUBMIT,
        remarks: dto.remarks || 'Application submitted',
        actionBy: actor.id,
      };

      console.log('--- DB INSERT/UPDATE: Workflow History Payload ---', workflowHistoryPayload);

      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, workflowHistoryPayload));

      // ==========================================
      // 4. PREPARING WORKFLOW LOG PAYLOADS
      // ==========================================
      const logLeadCreatedPayload = { 
        applicationId: saved.id, 
        action: WorkflowLogAction.LEAD_CREATED, 
        remarks: 'Lead created', 
        createdBy: actor.id 
      };
      const logLeadSubmittedPayload = { 
        applicationId: saved.id, 
        action: WorkflowLogAction.LEAD_SUBMITTED, 
        remarks: dto.remarks || 'Lead submitted', 
        createdBy: actor.id 
      };

      console.log('--- DB INSERT/UPDATE: Workflow Log (Lead Created) ---', logLeadCreatedPayload);
      await manager.save(WorkflowLog, manager.create(WorkflowLog, logLeadCreatedPayload));

      console.log('--- DB INSERT/UPDATE: Workflow Log (Lead Submitted) ---', logLeadSubmittedPayload);
      await manager.save(WorkflowLog, manager.create(WorkflowLog, logLeadSubmittedPayload));

// ==========================================
// 5. PREPARING WORKFLOW STATUS PAYLOAD
// ==========================================
const workflowPayload = {
  applicationId: saved.id,
  currentStage: ApplicationStage.RM,
  currentStatus: ApplicationStatus.LEAD_CREATED,
  assignedTo: actor.roles?.[0] ?? null,
  currentOwner: actor.id,
  lastAction: WorkflowAction.SUBMIT,
  lastRemarks: dto.remarks || 'Application submitted',
};

console.log(
  '--- DB INSERT/UPDATE: Workflow Runtime Status Payload ---',
  workflowPayload,
);

let workflow = await manager.findOne(Workflow, {
  where: {
    applicationId: saved.id,
  },
});

if (workflow) {
  console.log('Updating existing workflow:', workflow.id);

  Object.assign(workflow, workflowPayload);

  workflow = await manager.save(workflow);
} else {
  console.log('Creating new workflow');

  workflow = manager.create(Workflow, workflowPayload);

  workflow = await manager.save(workflow);
}

console.log('Workflow Saved:', workflow);

// ==========================================
// 6. PREPARING AUDIT LOG PAYLOAD
// ==========================================
const auditLogPayload = {
  action: WorkflowAction.SUBMIT,
  entityName: 'applications',
  entityId: saved.id,
  snapshot: {
    status: saved.status,
    stage: saved.stage,
  },
  createdBy: actor.id,
};

console.log(
  '--- DB INSERT/UPDATE: Audit Log Payload ---',
  auditLogPayload,
);

await manager.save(
  AuditLog,
  manager.create(AuditLog, auditLogPayload),
);

console.log('Audit Log Saved');

return {
  success: true,
  message: 'Application submitted successfully.',
  data: saved,
};
     

    });
  }

  async submit(dto: any, actor: Actor) {
    const errors: string[] = [];
    if (!dto.customerName?.trim()) errors.push('customerName is required');
    if (!dto.mobile?.trim()) errors.push('mobile is required');
    if (!dto.pan?.trim()) errors.push('pan is required');
    if (!dto.aadhaarNumber?.trim()) errors.push('aadhaarNumber is required');
    if (!dto.requestedAmount) errors.push('requestedAmount is required');
    if (!dto.occupationType) errors.push('occupationType is required');
    if (!dto.monthlyIncome && dto.monthlyIncome !== 0) errors.push('monthlyIncome is required');
    if (!dto.propertyCategory?.trim()) errors.push('propertyCategory is required');
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
        status: ApplicationStatus.LEAD_CREATED,
        stage: ApplicationStage.RM,
        createdBy: actor.id,
        updatedBy: actor.id,
      });
      const saved = await manager.save(entity);
      saved.applicationNumber = createReferenceNumber('LAP', saved.id);
      await manager.save(saved);

      let customerProfile = await manager.findOne(CustomerProfile, { where: { applicationId: saved.id } });
      const profileData = this.money(this.buildProfile(saved, dto) as unknown as Record<string, unknown>);

      if (customerProfile) {
        Object.assign(customerProfile, profileData);
        await manager.save(customerProfile);
      } else {
        customerProfile = manager.create(CustomerProfile, profileData as Partial<CustomerProfile>);
        await manager.save(customerProfile);
      }

      await manager.save(WorkflowHistory, manager.create(WorkflowHistory, { applicationId: saved.id, fromRole: ApplicationStage.RM, toRole: ApplicationStage.RM, action: WorkflowAction.SUBMIT, remarks: dto.remarks || 'Application submitted', actionBy: actor.id }));
      await manager.save(WorkflowLog, manager.create(WorkflowLog, { applicationId: saved.id, action: WorkflowLogAction.LEAD_CREATED, remarks: 'Lead created', createdBy: actor.id }));
      await manager.save(WorkflowLog, manager.create(WorkflowLog, { applicationId: saved.id, action: WorkflowLogAction.LEAD_SUBMITTED, remarks: dto.remarks || 'Lead submitted', createdBy: actor.id }));
      await manager.save(Workflow, manager.create(Workflow, {
        applicationId: saved.id,
        currentStage: ApplicationStage.RM,
        currentStatus: ApplicationStatus.LEAD_CREATED,
        assignedTo: actor.roles?.[0],
        currentOwner: actor.id,
        lastAction: WorkflowAction.SUBMIT,
        lastRemarks: dto.remarks || 'Application submitted',
      }));
      await manager.save(AuditLog, manager.create(AuditLog, { action: WorkflowAction.SUBMIT, entityName: 'applications', entityId: saved.id, snapshot: { status: saved.status, stage: saved.stage }, createdBy: actor.id }));
      return { data: saved };
    });
  }


async submitToBm(
  applicationId: number,
  actor: Actor,
) {
  const result = await this.workflowTransitions.move({
    applicationId,
    action: 'RM_SUBMIT_TO_BM',
    remarks: 'Application submitted to BM.',
    actor,
  });
  return {
    success: true,
    data: result.data.application,
    message: 'Application submitted to BM successfully.',
  };
}

async submitToCm(
  applicationId: number,
  actor: Actor,
) {
  const application =
    await this.applications.findOne({
      where: {
        id: applicationId,
      },
    });

  if (!application) {
    throw new NotFoundException(
      'Application not found',
    );
  }

  const userRoles = (actor?.roles || []).map((role) =>
    String(role).toUpperCase(),
  );

  if (!userRoles.includes('BM')) {
    throw new ForbiddenException(
      'Only BM can submit application to CM.',
    );
  }

  const currentStage = String(application.stage || '').toUpperCase();
  const currentStatus = String(application.status || '').toUpperCase();

  if (
    currentStage !== 'BM' &&
    !['BM_PENDING', 'BM_REVIEW', 'SUBMITTED_TO_BM'].includes(currentStatus)
  ) {
    throw new BadRequestException(
      'Application must be in BM stage before submitting to CM.',
    );
  }

  const movement = await this.workflowTransitions.move({
    applicationId,
    action: 'BM_APPROVE_TO_CM',
    remarks: 'Application approved by BM and submitted to CM.',
    actor,
  });
  const saved = movement.data.application;

  return {
    success: true,
    data: saved,
    message:
      'Application submitted to CM successfully.',
  };
}

// async submitToCredit(
//   applicationId: number,
//   dto: any,
//   actor: Actor,
// ) {
//   return this.dataSource.transaction(async (manager) => {
//     const application = await manager.findOne(Application, {
//       where: {
//         id: applicationId,
//       },
//       lock: {
//         mode: 'pessimistic_write',
//       },
//     });

//     if (!application) {
//       throw new NotFoundException('Application not found');
//     }

//     const roles = (actor?.roles || []).map((role) =>
//       String(role).toUpperCase(),
//     );

//     if (!roles.includes('BM')) {
//       throw new ForbiddenException(
//         'Only BM can submit application to Credit.',
//       );
//     }

//     const currentStage = String(application.stage || '').toUpperCase();
//     const currentStatus = String(application.status || '').toUpperCase();

//     if (
//       currentStage !== ApplicationStage.BM &&
//       currentStatus !== ApplicationStatus.BM_PENDING &&
//       currentStatus !== ApplicationStatus.BM_APPROVED 
//     ) {
//       throw new BadRequestException(
//         'Application must be in BM screening before submitting to Credit.',
//       );
//     }

//     const decision = String(dto?.decision || 'RECOMMENDED').toUpperCase();

//     const fromStage = application.stage;
//     const fromStatus = application.status;

//     let assignedTo = 'CM';
//     let lastAction: any = 'CM_SCREENING_UPDATED';
//     let lastRemarks =
//       dto?.remarks || 'CM screening decision updated.';

//     if (decision === 'REJECTED') {
//       assignedTo = 'BM';
//       lastAction = 'BM_REJECTED';
//       lastRemarks =
//         dto?.remarks || 'BM rejected application.';
//     } else if (decision === 'HOLD_QUERY') {
//       assignedTo = 'BM';
//       lastAction = 'BM_QUERY_RAISED';
//       lastRemarks =
//         dto?.remarks || 'BM kept application on hold/query.';
//     } else {
//       assignedTo = 'CREDIT_CHECKER';
//       lastAction = 'SUBMITTED_TO_CREDIT_CHECKER';
//       lastRemarks =
//         dto?.remarks ||
//         'Credit Maker recommended application and submitted to CM.';
//     }

//     const movement = await this.workflowTransitions.move({
//       applicationId,
//       action: decision === 'REJECTED'
//         ? 'CREDIT_MAKER_REJECT'
//         : decision === 'HOLD_QUERY'
//           ? 'CREDIT_MAKER_QUERY'
//           : 'CREDIT_MAKER_APPROVE_TO_CREDIT_CHECKER',
//       remarks: lastRemarks,
//       payload: dto,
//       actor,
//       manager,
//     });
//     const saved = movement.data.application;

//     let workflow = await manager.findOne(Workflow, {
//       where: {
//         applicationId,
//       },
//     });

//     const workflowPayload = {
//       applicationId,
//       currentStage: saved.stage,
//       currentStatus: saved.status,
//       assignedTo,
//       currentOwner: actor.id,
//       lastAction,
//       lastRemarks,
//     };

//     if (workflow) {
//       Object.assign(workflow, workflowPayload);
//       workflow = await manager.save(workflow);
//     } else {
//       workflow = manager.create(Workflow, workflowPayload);
//       workflow = await manager.save(workflow);
//     }

//     await manager.save(
//       WorkflowHistory,
//       manager.create(WorkflowHistory, {
//         applicationId,
//         fromRole: fromStage,
//         toRole: saved.stage,
//         action: lastAction,
//         remarks: lastRemarks,
//         actionBy: actor.id,
//       }),
//     );

//     await manager.save(
//       AuditLog,
//       manager.create(AuditLog, {
//         action: lastAction,
//         entityName: 'applications',
//         entityId: applicationId,
//         snapshot: {
//           decision,
//           fromStage,
//           fromStatus,
//           toStage: saved.stage,
//           toStatus: saved.status,
//           assignedTo,
//           recommendedAmount: dto?.recommendedAmount ?? null,
//           riskScore: dto?.riskScore ?? null,
//         },
//         createdBy: actor.id,
//       }),
//     );

//     return {
//       success: true,
//       message:
//         decision === 'RECOMMENDED'
//           ? 'Application recommended and submitted to CM successfully.'
//           : decision === 'HOLD_QUERY'
//             ? 'Application marked as Hold / Query.'
//             : 'Application rejected by CREDIT MAKER.',
//       data: saved,
//     };
//   });
// }


async submitToCredit(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  return this.dataSource.transaction(async (manager) => {
    const application = await manager.findOne(Application, {
      where: {
        id: applicationId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!application) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    const roles = (actor?.roles || []).map((role) =>
      String(role)
        .trim()
        .toUpperCase(),
    );

    if (
      !roles.includes('BM') &&
      !roles.includes('ADMIN')
    ) {
      throw new ForbiddenException(
        'Only BM can submit application to Credit Maker.',
      );
    }

    const currentStage = String(
      application.stage || '',
    )
      .trim()
      .toUpperCase();

    const currentStatus = String(
      application.status || '',
    )
      .trim()
      .toUpperCase();

    /*
     * Exact state required before BM decision:
     *
     * stage  = BM
     * status = BM_PENDING
     */
    if (
      currentStage !== ApplicationStage.BM ||
      currentStatus !== ApplicationStatus.BM_PENDING
    ) {
      throw new BadRequestException(
        `Application must be in BM/BM_PENDING before BM decision. ` +
          `Current state is ${currentStage}/${currentStatus}.`,
      );
    }

    const decision = String(
      dto?.decision || 'RECOMMENDED',
    )
      .trim()
      .toUpperCase();

    const fromStage = application.stage;
    const fromStatus = application.status;

    let assignedTo: string;
    let workflowAction: string;
    let lastAction: any;
    let lastRemarks: string;

    if (
      decision === 'REJECTED' ||
      decision === 'REJECT'
    ) {
      assignedTo = 'BM';

      workflowAction = 'BM_REJECT';

      lastAction = 'BM_REJECTED';

      lastRemarks =
        dto?.remarks ||
        'BM rejected application.';
    } else if (
      decision === 'HOLD_QUERY' ||
      decision === 'QUERY'
    ) {
      assignedTo = 'RM';

      workflowAction = 'BM_QUERY_TO_RM';

      lastAction = 'BM_QUERY_RAISED';

      lastRemarks =
        dto?.remarks ||
        'BM raised a query and returned the application to RM.';
    } else {
      assignedTo = 'CREDIT_MAKER';

      workflowAction =
        'BM_APPROVE_TO_CREDIT_MAKER';

      lastAction =
        'BM_APPROVED_TO_CREDIT_MAKER';

      lastRemarks =
        dto?.remarks ||
        'BM approved application and submitted it to Credit Maker.';
    }

    const movement =
      await this.workflowTransitions.move({
        applicationId,
        action: workflowAction,
        remarks: lastRemarks,
        payload: dto,
        actor,
        manager,
      });

    const saved =
      movement.data.application;

    let workflow = await manager.findOne(Workflow, {
      where: {
        applicationId,
      },
    });

    const workflowPayload = {
      applicationId,
      currentStage: saved.stage,
      currentStatus: saved.status,
      assignedTo,
      currentOwner: actor.id,
      lastAction,
      lastRemarks,
    };

    if (workflow) {
      Object.assign(
        workflow,
        workflowPayload,
      );

      workflow =
        await manager.save(workflow);
    } else {
      workflow = manager.create(
        Workflow,
        workflowPayload,
      );

      workflow =
        await manager.save(workflow);
    }

    await manager.save(
      WorkflowHistory,
      manager.create(WorkflowHistory, {
        applicationId,
        fromRole: fromStage,
        toRole: saved.stage,
        action: lastAction,
        remarks: lastRemarks,
        actionBy: actor.id,
      }),
    );

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        action: lastAction,
        entityName: 'applications',
        entityId: applicationId,

        snapshot: {
          decision,
          fromStage,
          fromStatus,
          toStage: saved.stage,
          toStatus: saved.status,
          assignedTo,
          recommendedAmount:
            dto?.recommendedAmount ?? null,
          riskScore:
            dto?.riskScore ?? null,
        },

        createdBy: actor.id,
      }),
    );

    let message: string;

    if (
      decision === 'REJECTED' ||
      decision === 'REJECT'
    ) {
      message =
        'Application rejected by BM.';
    } else if (
      decision === 'HOLD_QUERY' ||
      decision === 'QUERY'
    ) {
      message =
        'Application returned to RM with a BM query.';
    } else {
      message =
        'Application approved by BM and submitted to Credit Maker successfully.';
    }

    return {
      success: true,
      message,
      data: saved,
    };
  });
}
async findOne(id: number) {
  const application =
    await this.applications.findOne({
      where: {
        id,
      },
    });

  if (!application) {
    throw new NotFoundException(
      `Application ${id} was not found.`,
    );
  }

  const customerProfile =
    await this.profiles.findOne({
      where: {
        applicationId: id,
      },
    });

  /*
   * Return application even when profile is not yet created.
   */
  if (!customerProfile) {
    return {
      data: {
        ...application,

        applicationId:
          Number(application.id),

        customerProfileId: null,
        customerProfile: null,
      },
    };
  }

  /*
   * Remove fields that would conflict with application.id,
   * application.createdAt and application.updatedAt.
   */
  const {
    id: customerProfileId,
    applicationId: profileApplicationId,
    application: _applicationRelation,
    createdAt: profileCreatedAt,
    updatedAt: profileUpdatedAt,
    ...profileFields
  } = customerProfile;

  return {
    data: {
      /*
       * Main application fields.
       */
      ...application,

      /*
       * Customer profile fields available directly
       * for the React form.
       */
      ...profileFields,

      /*
       * Ensure application values are not overwritten
       * by profile values.
       */
      id: application.id,

      applicationId:
        Number(application.id),

      applicationNumber:
        application.applicationNumber,

        customerName:
        application.customerName,

      mobile:
        application.mobile ||
        customerProfile.mobile,

      pan:
        application.pan ||
        customerProfile.panNumber,

      panVerified:
        Boolean(application.panVerified) ||
        Boolean(customerProfile.panVerified),

      requestedAmount:
        application.requestedAmount,

      stage:
        application.stage,

      status:
        application.status,

      assignedTo:
        application.assignedTo,

      version:
        application.version,

      createdAt:
        application.createdAt,

      updatedAt:
        application.updatedAt,

      /*
       * Extra profile metadata.
       */
      customerProfileId:
        Number(customerProfileId),

      profileCreatedAt,
      profileUpdatedAt,

      /*
       * Also preserve the complete nested profile.
       */
      customerProfile: {
        ...customerProfile,

        id: Number(
          customerProfile.id,
        ),

        applicationId: Number(
          profileApplicationId,
        ),
      },
    },
  };
}

  async update(id: number, dto: any, actor: Actor) {
    console.log('========== UPDATE START ==========');

    try {
      return await this.dataSource.transaction(async (manager) => {

        console.log('Step 1');

        const applicationRepo = manager.getRepository(Application);
        const profileRepo = manager.getRepository(CustomerProfile);
        const workflowRepo = manager.getRepository(Workflow);

        // ===========================
        // APPLICATION
        // ===========================
        const application = await applicationRepo.findOne({
          where: { id },
        });

        console.log('Step 2', application);

        if (!application) {
          throw new NotFoundException('Application not found');
        }

        console.log('Step 3');

        application.customerName =
          dto.customerName ?? application.customerName;

        application.mobile =
          dto.mobile ?? application.mobile;

        if (dto.pan !== undefined) {
          const nextPan = dto.pan?.trim();
          application.panVerified =
            Boolean(application.panVerified) &&
            nextPan === application.pan;
          application.pan = nextPan;
        }

        if (dto.requestedAmount !== undefined) {
          application.requestedAmount = dto.requestedAmount;
        }

        application.updatedBy = actor.id;

        const savedApp = await applicationRepo.save(application);

        console.log('Step 4', savedApp);

        // ===========================
        // CUSTOMER PROFILE
        // ===========================
        console.log('Step 5');

        let profile = await profileRepo.findOne({
          where: {
            applicationId: id,
          },
        });

        console.log('Step 6', profile);

        const profileData = this.money(
          this.buildProfile(savedApp, dto) as Record<string, unknown>,
        );

        console.log('Step 7', profileData);

        if (profile) {
          console.log('Step 8 UPDATE PROFILE');

          Object.assign(profile, profileData);

          profile = await profileRepo.save(profile);

        } else {
          console.log('Step 8 CREATE PROFILE');

          profile = profileRepo.create(
            profileData as Partial<CustomerProfile>,
          );

          profile = await profileRepo.save(profile);
        }

        console.log('PROFILE SAVED', profile);

        // ===========================
        // WORKFLOW
        // ===========================
        console.log('Step 9');

        let workflow = await workflowRepo.findOne({
          where: {
            applicationId: id,
          },
        });

        if (!workflow) {

          console.log('CREATE WORKFLOW');

          workflow = workflowRepo.create({
            applicationId: id,
            currentStage: savedApp.stage,
            currentStatus: savedApp.status,
            assignedTo: actor.roles?.[0] ?? null,
            currentOwner: actor.id,
            lastAction: WorkflowAction.SAVE_DRAFT,
            lastRemarks: dto.remarks ?? null,
          });

        } else {

          console.log('UPDATE WORKFLOW');

          workflow.currentStage = savedApp.stage;
          workflow.currentStatus = savedApp.status;
          workflow.assignedTo = actor.roles?.[0] ?? workflow.assignedTo;
          workflow.currentOwner = actor.id;
          workflow.lastAction =
            dto.lastAction ?? workflow.lastAction;
          workflow.lastRemarks =
            dto.remarks ?? workflow.lastRemarks;
        }

        workflow = await workflowRepo.save(workflow);

        console.log('WORKFLOW SAVED', workflow);

        console.log('Step 10');

        return {
          success: true,
          message: 'Application updated successfully.',
          data: {
            application: savedApp,
            customerProfile: profile,
            workflow,
          },
        };
      });
    } catch (e) {
      console.error('========== UPDATE FAILED ==========');
      console.error(e);
      throw e;
    }
  }

  async remove(id: number) {
    const result = await this.applications.delete(id);
    if (!result.affected) throw new NotFoundException('Application not found');
    return { data: null, message: 'Application deleted' };
  }

async addVisit(
  applicationId: number,
  body: Record<string, any>,
  actor: Actor,
) {
  await this.findOne(applicationId);

  const visit = await this.visits.save(
    this.visits.create({
      ...body,
      applicationId,
      createdBy: actor.id,
      updatedBy: actor.id,
    }),
  );


  return {
    data: visit,
  };
}

  async listVisits(applicationId: number) {
    return { data: await this.visits.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async addDocument(applicationId: number, documentType: string, file: Express.Multer.File, actor: Actor) {
    await this.findOne(applicationId);
    const document = await this.documents.save(this.documents.create({ applicationId, documentType: documentType as DocumentType, documentName: documentType, fileName: file.filename, filePath: `uploads/documents/${file.filename}`, fileSize: file.size, mimeType: file.mimetype, uploadedBy: actor.id, createdBy: actor.id, updatedBy: actor.id }));
    
    return { data: document };
  }

  // async listDocuments(applicationId: number) {
  //   return { data: await this.documents.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  // }

  async listDocuments(applicationId: number) {
  return this.documentsService.findAllByApplication(
    applicationId,
  );
}

  async transition(applicationId: number, dto: any, actor: Actor) {
    if (!actor.permissions?.includes(PERMISSIONS.APPLICATION_TRANSITION)) throw new ForbiddenException('Missing workflow permission');
    const actionAliases: Record<string, string> = {
      SUBMIT_TO_BM: 'RM_SUBMIT_TO_BM',
      BM_APPROVE: 'BM_APPROVE_TO_CM',
    };
    const action = actionAliases[String(dto?.action || '').toUpperCase()] || dto?.action;
    return this.workflowTransitions.move({
      applicationId,
      action,
      remarks: dto?.remarks,
      payload: dto?.payload,
      assignedToUserId: dto?.assignedToUserId,
      actor,
    });
  }

  async workflowHistory(applicationId: number) {
    return { data: await this.history.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

async workflowStatus(
  applicationId: number,
) {
  const logs =
    await this.workflowLogs.find({
      where: {
        applicationId,
      },
      order: {
        id: 'ASC',
      },
    });

  const actions =
    new Set<WorkflowLogAction>(
      logs.map(
        (log) => log.action,
      ),
    );

  const leadSubmitted =
    actions.has(
      WorkflowLogAction.LEAD_SUBMITTED,
    );

  return {
    data: {
      leadCreated:
        actions.has(
          WorkflowLogAction.LEAD_CREATED,
        ) ||
        leadSubmitted,

      leadSubmitted,

      customerVisit:
        actions.has(
          WorkflowLogAction.CUSTOMER_VISIT_DONE,
        ),

      // Business visit step is tracked independently from the property visit.
      businessVisit: actions.has(WorkflowLogAction.BUSINESS_VISIT_DONE),

  propertyVisit:
        actions.has(
          WorkflowLogAction.PROPERTY_VISIT_DONE,
        ),
        
      geoVerification:
        actions.has(
          WorkflowLogAction.GEO_VERIFICATION_DONE,
        ),

      documentsUploaded:
        actions.has(
          WorkflowLogAction.DOCUMENTS_UPLOADED,
        ),

      submittedToBm:
        actions.has(
          WorkflowLogAction.SUBMITTED_TO_BM,
        ),
    },
  };
}

async recordWorkflowStep(
  applicationId: number,
  dto: {
    action: string;
    remarks?: string;
  },
  actor: Actor,
) {
  const application =
    await this.applications.findOneBy({
      id: applicationId,
    });

  if (!application) {
    throw new NotFoundException(
      'Application not found',
    );
  }

  if (
    !this.isWorkflowLogAction(
      dto.action,
    )
  ) {
    throw new BadRequestException(
      `Invalid workflow log action: ${dto.action}`,
    );
  }

  const workflowLog =
    this.workflowLogs.create({
      applicationId,
      action: dto.action,
      remarks: dto.remarks,
      createdBy: actor.id,
      updatedBy: actor.id,
    });

  const saved =
    await this.workflowLogs.save(
      workflowLog,
    );

  return {
    data: saved,
  };
}

  private money(dto: Record<string, unknown>) {
    const copy = { ...dto };
    for (const key of ['monthlyIncome', 'annualIncome', 'marketValue', 'distressValue', 'averageBalance', 'foir', 'eligibleAmount', 'roi', 'emi', 'recommendedAmount', 'recommendedRoi']) {
      if (copy[key] !== undefined) copy[key] = String(copy[key]);
    }
    return copy;
  }


  private buildProfile(application: Application, dto: any): Record<string, unknown> {
    const name = dto?.customerName?.trim() || '';
    const parts = name ? name.split(/\s+/) : [];
    return {
      applicationId: application.id,
      customerType: dto.customerType || CustomerType.INDIVIDUAL,
      firstName: dto.firstName || parts[0] || name,
      lastName: dto.lastName || parts[parts.length - 1] || name,
      middleName: dto.middleName || (parts.length > 2 ? parts.slice(1, -1).join(' ') : undefined),
      mobile: dto?.mobile?.trim() || '',
      email: dto.email || undefined,
      occupationType: dto.occupationType,
      businessName: dto.businessName || undefined,
      monthlyIncome: dto.monthlyIncome ?? undefined,
      panNumber: dto.pan || undefined,
      panVerified: dto.panVerified ?? application.panVerified ?? undefined,
      aadhaarNumber: dto.aadhaarNumber || undefined,
      propertyCategory: dto.propertyCategory || undefined,
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