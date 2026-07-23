import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { WorkflowApprovalLog } from './entities/workflow-approval-log.entity';
import { Workflow } from './entities/workflow.entity';
import { WORKFLOW_TRANSITIONS } from './workflow-transitions.constant';

export type WorkflowActor = {
  id?: number | string;
  userId?: number | string;
  sub?: number | string;
  name?: string;
  fullName?: string;
  username?: string;
  email?: string;
  roles?: string[];
  role?: string;
};

export type MoveWorkflowParams = {
  applicationId: number;
  action: string;
  decision?: string;
  toStage?: string;
  toStatus?: string;
  assignedToRole?: string;
  assignedToUserId?: number;
  remarks?: string;
  payload?: any;
  actor: WorkflowActor;
  manager?: EntityManager;
};

@Injectable()
export class WorkflowTransitionService {
  constructor(private readonly dataSource: DataSource) {}

  async move(params: MoveWorkflowParams) {
    if (params.manager) return this.moveWithinTransaction(params, params.manager);
    return this.dataSource.transaction((manager) => this.moveWithinTransaction(params, manager));
  }

  async updateVerification(
    applicationId: number,
    flags: Partial<Pick<Workflow,
      'rmFieldVisitRequired' | 'rmFieldVisitCompleted' |
      'rmGeoRequired' | 'rmGeoCompleted' |
      'valuationFieldVisitRequired' | 'valuationFieldVisitCompleted' |
      'valuationGeoRequired' | 'valuationGeoCompleted'>>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!application) throw new NotFoundException('Application not found');
      let workflow = await manager.findOne(Workflow, {
        where: { applicationId },
        lock: { mode: 'pessimistic_write' },
      });
      workflow ??= manager.create(Workflow, {
        applicationId,
        currentStage: application.stage,
        currentStatus: application.status,
        valuationFieldVisitRequired: process.env.VALUATION_FIELD_VISIT_REQUIRED === 'true',
        valuationGeoRequired: process.env.VALUATION_GEO_REQUIRED === 'true',
      });
      for (const [key, value] of Object.entries(flags)) {
        if (typeof value === 'boolean') (workflow as any)[key] = value;
      }
      return {
        success: true,
        message: 'Workflow verification flags updated successfully.',
        data: await manager.save(workflow),
      };
    });
  }

  private async moveWithinTransaction(params: MoveWorkflowParams, manager: EntityManager) {
    const action = String(params.action || '').trim().toUpperCase();
    const rule = WORKFLOW_TRANSITIONS[action];
    if (!rule) throw new BadRequestException(`Unsupported workflow action: ${action || '(empty)'}`);

    const actorRoles = [
      ...(Array.isArray(params.actor?.roles) ? params.actor.roles : []),
      params.actor?.role,
    ].filter(Boolean).map((role: any) =>
      String(role?.code || role?.name || role).trim().toUpperCase().replaceAll(' ', '_'),
    );
    if (!actorRoles.some((role) => rule.allowedRoles.includes(role))) {
      throw new ForbiddenException(`Role is not allowed to perform ${action}`);
    }

    const application = await manager.findOne(Application, {
      where: { id: params.applicationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!application) throw new NotFoundException('Application not found');

    const fromStage = String(application.stage || '');
    const fromStatus = String(application.status || '');
    if (!rule.fromStages.includes(fromStage)) {
      throw new BadRequestException(
        `Invalid workflow transition ${action}: application is at ${fromStage}/${fromStatus}`,
      );
    }

    let workflow = await manager.findOne(Workflow, {
      where: { applicationId: params.applicationId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!workflow) {
      workflow = manager.create(Workflow, {
        applicationId: params.applicationId,
        currentStage: fromStage,
        currentStatus: fromStatus,
        rmFieldVisitRequired: false,
        rmFieldVisitCompleted: false,
        rmGeoRequired: false,
        rmGeoCompleted: false,
        valuationFieldVisitRequired: process.env.VALUATION_FIELD_VISIT_REQUIRED === 'true',
        valuationFieldVisitCompleted: false,
        valuationGeoRequired: process.env.VALUATION_GEO_REQUIRED === 'true',
        valuationGeoCompleted: false,
        isTerminal: false,
      });
    }

    this.validateRequiredChecks(action, workflow);

    const actorIdRaw = params.actor?.id || params.actor?.userId || params.actor?.sub;
    const actorUserId = Number(actorIdRaw) || undefined;
    const actorName = params.actor?.name || params.actor?.fullName ||
      params.actor?.username || params.actor?.email || undefined;
    const actorRole = actorRoles[0];
    const assignedToRole = rule.assignedToRole || params.assignedToRole;
    const now = new Date();

    application.stage = rule.toStage as any;
    application.status = rule.toStatus as any;
    if (params.assignedToUserId !== undefined) application.assignedTo = params.assignedToUserId;
    if (actorUserId) application.updatedBy = actorUserId;
    const savedApplication = await manager.save(application);

    Object.assign(workflow, {
      previousStage: fromStage,
      previousStatus: fromStatus,
      currentStage: rule.toStage,
      currentStatus: rule.toStatus,
      currentAssignedRole: assignedToRole,
      currentAssignedUserId: params.assignedToUserId,
      lastAction: action,
      lastDecision: rule.decision || params.decision,
      lastRemarks: params.remarks,
      lastActionBy: actorUserId,
      lastActionByName: actorName,
      lastActionByRole: actorRole,
      lastActionAt: now,
      isTerminal: Boolean(rule.terminal),
    });
    const savedWorkflow = await manager.save(workflow);

    const approvalLog = await manager.save(WorkflowApprovalLog, manager.create(WorkflowApprovalLog, {
      applicationId: params.applicationId,
      workflowId: savedWorkflow.id,
      action,
      decision: rule.decision || params.decision,
      fromStage,
      fromStatus,
      toStage: rule.toStage,
      toStatus: rule.toStatus,
      actorUserId,
      actorName,
      actorEmail: params.actor?.email,
      actorRole,
      assignedToRole,
      assignedToUserId: params.assignedToUserId,
      remarks: params.remarks,
      payload: this.safePayload(params.payload),
    }));

    await manager.update(CustomerProfile, { applicationId: params.applicationId }, {
      currentWorkflowStage: rule.toStage,
      currentWorkflowStatus: rule.toStatus,
      lastWorkflowAction: action,
      lastWorkflowUpdatedAt: now,
    });

    return {
      success: true,
      message: 'Workflow moved successfully.',
      data: { application: savedApplication, workflow: savedWorkflow, approvalLog },
    };
  }

  private validateRequiredChecks(action: string, workflow: Workflow) {
    if (action === 'RM_SUBMIT_TO_BM') {
      if (workflow.rmFieldVisitRequired && !workflow.rmFieldVisitCompleted) {
        throw new BadRequestException('RM field visit is required before submission');
      }
      if (workflow.rmGeoRequired && !workflow.rmGeoCompleted) {
        throw new BadRequestException('RM geo verification is required before submission');
      }
    }
    if (action === 'VALUATION_APPROVE_TO_LEGAL') {
      if (workflow.valuationFieldVisitRequired && !workflow.valuationFieldVisitCompleted) {
        throw new BadRequestException('Valuation field visit is required before approval');
      }
      if (workflow.valuationGeoRequired && !workflow.valuationGeoCompleted) {
        throw new BadRequestException('Valuation geo verification is required before approval');
      }
    }
  }

  private safePayload(payload: any) {
    if (payload === undefined || payload === null) return undefined;
    const blocked = /password|token|authorization|cookie|aadhaar|pan|otp|account|bank/i;
    const sanitize = (value: any): any => {
      if (Array.isArray(value)) return value.map(sanitize);
      if (!value || typeof value !== 'object') return value;
      return Object.fromEntries(Object.entries(value)
        .filter(([key]) => !blocked.test(key))
        .map(([key, item]) => [key, sanitize(item)]));
    };
    return JSON.stringify(sanitize(payload));
  }
}
