import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource } from 'typeorm';

import type { Actor } from '../applications/applications.service';
import { Application } from '../applications/entities/application.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';

@Injectable()
export class ValuationService {
  constructor(private readonly dataSource: DataSource) {}

  private getActorRoles(actor: Actor) {
    return (actor?.roles || []).map((role) =>
      String(role).toUpperCase(),
    );
  }

  private ensureValuationUser(actor: Actor) {
    const roles = this.getActorRoles(actor);

    if (!roles.includes('VALUATION')) {
      throw new ForbiddenException(
        'Only Valuation team can perform this action.',
      );
    }
  }

  private ensureValuationCase(application: Application) {
    const stage = String(application.stage || '').toUpperCase();
    const status = String(application.status || '').toUpperCase();

    if (
      stage !== ApplicationStage.VALUATION ||
      ![
        ApplicationStatus.VALUATION_PENDING,
        ApplicationStatus.VALUATION_QUERY,
      ].includes(status as ApplicationStatus)
    ) {
      throw new BadRequestException(
        'Application must be in Valuation stage.',
      );
    }
  }

  async getValuationCases() {
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .where('a.stage = :stage', {
        stage: ApplicationStage.VALUATION,
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.VALUATION_PENDING,
          ApplicationStatus.VALUATION_QUERY,
        ],
      })
      .orderBy('a.updatedAt', 'DESC')
      .getMany();

    return {
      success: true,
      data: rows,
    };
  }

  async getValuationApplication(applicationId: number) {
    const application = await this.dataSource
      .getRepository(Application)
      .findOne({
        where: {
          id: applicationId,
        },
      });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return {
      success: true,
      data: application,
    };
  }

  async raiseTechnicalQuery(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureValuationUser(actor);

    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      this.ensureValuationCase(application);

      application.stage = ApplicationStage.VALUATION;
      application.status = ApplicationStatus.VALUATION_QUERY;
      application.updatedBy = actor?.id ?? undefined;

      const saved = await manager.save(application);

      const remarks =
        dto?.remarks ||
        'Technical valuation query raised.';

      const workflowPayload = {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: 'VALUATION',
        currentOwner: actor.id,
        lastAction: 'VALUATION_QUERY_RAISED' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: { applicationId },
      });

      if (workflow) {
        Object.assign(workflow, workflowPayload);
        await manager.save(workflow);
      } else {
        workflow = manager.create(Workflow, workflowPayload);
        await manager.save(workflow);
      }

      await manager.save(
        WorkflowHistory,
        manager.create(WorkflowHistory, {
          applicationId,
          fromRole: ApplicationStage.VALUATION,
          toRole: ApplicationStage.VALUATION,
          action: 'VALUATION_QUERY_RAISED' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'VALUATION_QUERY_RAISED',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            stage: saved.stage,
            status: saved.status,
            valuation: dto,
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message: 'Technical valuation query raised successfully.',
        data: saved,
      };
    });
  }

  async markNegative(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureValuationUser(actor);

    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      this.ensureValuationCase(application);

      application.stage = ApplicationStage.VALUATION;
      application.status = ApplicationStatus.VALUATION_REJECTED;
      application.updatedBy = actor?.id ?? undefined;

      const saved = await manager.save(application);

      const remarks =
        dto?.remarks ||
        'Valuation marked negative.';

      const workflowPayload = {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: 'VALUATION',
        currentOwner: actor.id,
        lastAction: 'VALUATION_NEGATIVE' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: { applicationId },
      });

      if (workflow) {
        Object.assign(workflow, workflowPayload);
        await manager.save(workflow);
      } else {
        workflow = manager.create(Workflow, workflowPayload);
        await manager.save(workflow);
      }

      await manager.save(
        WorkflowHistory,
        manager.create(WorkflowHistory, {
          applicationId,
          fromRole: ApplicationStage.VALUATION,
          toRole: ApplicationStage.VALUATION,
          action: 'VALUATION_NEGATIVE' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'VALUATION_NEGATIVE',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            stage: saved.stage,
            status: saved.status,
            valuation: dto,
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message: 'Application marked negative by Valuation.',
        data: saved,
      };
    });
  }

  async approveAndSendToLegal(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureValuationUser(actor);

    return this.dataSource.transaction(async (manager) => {
      const application = await manager.findOne(Application, {
        where: { id: applicationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      this.ensureValuationCase(application);

      const fromStage = application.stage;
      const fromStatus = application.status;

      application.stage = ApplicationStage.LEGAL;
      application.status = ApplicationStatus.LEGAL_PENDING;
      application.updatedBy = actor?.id ?? undefined;

      const saved = await manager.save(application);

      const remarks =
        dto?.remarks ||
        'Valuation accepted and sent to Legal.';

      const workflowPayload = {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: 'LEGAL',
        currentOwner: actor.id,
        lastAction: 'VALUATION_APPROVED_SENT_TO_LEGAL' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: { applicationId },
      });

      if (workflow) {
        Object.assign(workflow, workflowPayload);
        await manager.save(workflow);
      } else {
        workflow = manager.create(Workflow, workflowPayload);
        await manager.save(workflow);
      }

      await manager.save(
        WorkflowHistory,
        manager.create(WorkflowHistory, {
          applicationId,
          fromRole: fromStage,
          toRole: saved.stage,
          action: 'VALUATION_APPROVED_SENT_TO_LEGAL' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'VALUATION_APPROVED_SENT_TO_LEGAL',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            fromStage,
            fromStatus,
            toStage: saved.stage,
            toStatus: saved.status,
            assignedTo: 'LEGAL',
            valuation: dto,
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message:
          'Valuation accepted and application sent to Legal successfully.',
        data: saved,
      };
    });
  }
}