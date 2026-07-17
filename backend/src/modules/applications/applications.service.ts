import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Like, Repository } from 'typeorm';
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

import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { Application } from './entities/application.entity';

export type Actor = { id: number; roles: string[]; permissions: string[] };

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
    private readonly dataSource: DataSource
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
  async findAll(query: any) {
    const [data, total] = await this.applications.findAndCount({ order: { id: 'DESC' }, skip: (query.page - 1) * query.limit, take: query.limit });
    return { data, meta: { total, page: query.page, limit: query.limit } };
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

  application.stage = 'BM' as any;
  application.status =
    'BM_PENDING' as any;

  application.updatedBy =
  actor?.id ?? undefined;

  const saved =
    await this.applications.save(
      application,
    );

  return {
    data: saved,
    message:
      'Application submitted to BM successfully.',
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

  application.stage = 'CM' as any;
  application.status = 'CM_PENDING' as any;

  application.updatedBy =
    actor?.id ?? undefined;

  const saved =
    await this.applications.save(
      application,
    );

  return {
    success: true,
    data: saved,
    message:
      'Application submitted to CM successfully.',
  };
}

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
      throw new NotFoundException('Application not found');
    }

    const roles = (actor?.roles || []).map((role) =>
      String(role).toUpperCase(),
    );

    if (!roles.includes('CM')) {
      throw new ForbiddenException(
        'Only CM can submit application to Credit.',
      );
    }

    const currentStage = String(application.stage || '').toUpperCase();
    const currentStatus = String(application.status || '').toUpperCase();

    if (
      currentStage !== ApplicationStage.CM &&
      currentStatus !== ApplicationStatus.CM_PENDING &&
      currentStatus !== ApplicationStatus.CM_APPROVED &&
      currentStatus !== ApplicationStatus.BM_APPROVED
    ) {
      throw new BadRequestException(
        'Application must be in CM screening before submitting to Credit.',
      );
    }

    const decision = String(dto?.decision || 'RECOMMENDED').toUpperCase();

    const fromStage = application.stage;
    const fromStatus = application.status;

    let assignedTo = 'CM';
    let lastAction: any = 'CM_SCREENING_UPDATED';
    let lastRemarks =
      dto?.remarks || 'CM screening decision updated.';

    if (decision === 'REJECTED') {
      application.stage = ApplicationStage.CM;
      application.status = ApplicationStatus.CM_REJECTED;

      assignedTo = 'CM';
      lastAction = 'CM_REJECTED';
      lastRemarks =
        dto?.remarks || 'CM rejected application.';
    } else if (decision === 'HOLD_QUERY') {
      application.stage = ApplicationStage.CM;
      application.status = ApplicationStatus.CM_QUERY;

      assignedTo = 'CM';
      lastAction = 'CM_QUERY_RAISED';
      lastRemarks =
        dto?.remarks || 'CM kept application on hold/query.';
    } else {
      application.stage = ApplicationStage.CREDIT;
      application.status = ApplicationStatus.CREDIT_MAKER_PENDING;

      assignedTo = 'CREDIT_MAKER';
      lastAction = 'SUBMITTED_TO_CREDIT_MAKER';
      lastRemarks =
        dto?.remarks ||
        'CM recommended application and submitted to Credit Maker.';
    }

    application.updatedBy = actor?.id ?? undefined;

    const saved = await manager.save(application);

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
      Object.assign(workflow, workflowPayload);
      workflow = await manager.save(workflow);
    } else {
      workflow = manager.create(Workflow, workflowPayload);
      workflow = await manager.save(workflow);
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
          recommendedAmount: dto?.recommendedAmount ?? null,
          riskScore: dto?.riskScore ?? null,
        },
        createdBy: actor.id,
      }),
    );

    return {
      success: true,
      message:
        decision === 'RECOMMENDED'
          ? 'Application recommended and submitted to Credit Maker successfully.'
          : decision === 'HOLD_QUERY'
            ? 'Application marked as Hold / Query.'
            : 'Application rejected by CM.',
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
    const document = await this.documents.save(this.documents.create({ applicationId, documentType: documentType as DocumentType, documentName: documentType, fileName: file.originalname, filePath: file.path ?? file.originalname, fileSize: file.size, mimeType: file.mimetype, uploadedBy: actor.id, createdBy: actor.id, updatedBy: actor.id }));
    
    return { data: document };
  }

  async listDocuments(applicationId: number) {
    return { data: await this.documents.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async transition(applicationId: number, dto: any, actor: Actor) {
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
      await this.workflows.save(manager.create(Workflow, {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: actor.roles?.[0],
        currentOwner: actor.id,
        lastAction: dto.action as WorkflowAction,
        lastRemarks: dto.remarks,
      }));
      await manager.save(AuditLog, manager.create(AuditLog, { action: dto.action, entityName: 'applications', entityId: applicationId, snapshot: { fromStage, toStage: saved.stage }, createdBy: actor.id }));
      return { data: saved };
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
