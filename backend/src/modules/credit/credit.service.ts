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
export class CreditService {
  constructor(private readonly dataSource: DataSource) {}

  private getActorRoles(actor: Actor) {
    return (actor?.roles || []).map((role) =>
      String(role).toUpperCase(),
    );
  }

  private ensureCreditMaker(actor: Actor) {
    const roles = this.getActorRoles(actor);

    if (!roles.includes('CREDIT_MAKER')) {
      throw new ForbiddenException(
        'Only Credit Maker can perform this action.',
      );
    }
  }

  private ensureCreditMakerCase(application: Application) {
    const stage = String(application.stage || '').toUpperCase();
    const status = String(application.status || '').toUpperCase();

    if (
      stage !== ApplicationStage.CREDIT ||
      ![
        ApplicationStatus.CREDIT_MAKER_PENDING,
        ApplicationStatus.CREDIT_MAKER_QUERY,
      ].includes(status as ApplicationStatus)
    ) {
      throw new BadRequestException(
        'Application must be in Credit Maker stage.',
      );
    }
  }

  private ensureCreditChecker(actor: Actor) {
  const roles = this.getActorRoles(actor);

  if (!roles.includes('CREDIT_CHECKER')) {
    throw new ForbiddenException(
      'Only Credit Checker can perform this action.',
    );
  }
}

private ensureCreditCheckerCase(application: Application) {
  const stage = String(application.stage || '').toUpperCase();
  const status = String(application.status || '').toUpperCase();

  if (
    stage !== ApplicationStage.CREDIT ||
    ![
      ApplicationStatus.CREDIT_CHECKER_PENDING,
      ApplicationStatus.CREDIT_CHECKER_QUERY,
    ].includes(status as ApplicationStatus)
  ) {
    throw new BadRequestException(
      'Application must be in Credit Checker stage.',
    );
  }
}



  async getCreditMakerCases() {
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .where('a.stage = :stage', {
        stage: ApplicationStage.CREDIT,
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.CREDIT_MAKER_PENDING,
          ApplicationStatus.CREDIT_MAKER_QUERY,
        ],
      })
      .orderBy('a.updatedAt', 'DESC')
      .getMany();

    return {
      success: true,
      data: rows,
    };
  }

  async getCreditCheckerCases() {
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .where('a.stage = :stage', {
        stage: ApplicationStage.CREDIT,
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.CREDIT_CHECKER_PENDING,
          ApplicationStatus.CREDIT_CHECKER_QUERY,
        ],
      })
      .orderBy('a.updatedAt', 'DESC')
      .getMany();

    return {
      success: true,
      data: rows,
    };
  }

  async getCreditApplication(applicationId: number) {
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

  async creditMakerSaveDraft(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureCreditMaker(actor);

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

      this.ensureCreditMakerCase(application);

      const remarks =
        dto?.remarks ||
        dto?.makerRecommendation ||
        'Credit Maker draft saved.';

      const workflowPayload = {
        applicationId,
        currentStage: application.stage,
        currentStatus: application.status,
        assignedTo: 'CREDIT_MAKER',
        currentOwner: actor.id,
        lastAction: 'CREDIT_MAKER_DRAFT_SAVED' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: {
          applicationId,
        },
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
          fromRole: ApplicationStage.CREDIT,
          toRole: ApplicationStage.CREDIT,
          action: 'CREDIT_MAKER_DRAFT_SAVED' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'CREDIT_MAKER_DRAFT_SAVED',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            memo: dto,
            stage: application.stage,
            status: application.status,
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message: 'Credit Maker draft saved successfully.',
        data: application,
      };
    });
  }

  async creditMakerRaiseQuery(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureCreditMaker(actor);

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

      this.ensureCreditMakerCase(application);

      application.stage = ApplicationStage.CREDIT;
      application.status = ApplicationStatus.CREDIT_MAKER_QUERY;
      application.updatedBy = actor?.id ?? undefined;

      const saved = await manager.save(application);

      const remarks =
        dto?.remarks ||
        dto?.queryRemarks ||
        'Credit Maker raised query.';

      const workflowPayload = {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: 'CM',
        currentOwner: actor.id,
        lastAction: 'CREDIT_MAKER_QUERY_RAISED' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: {
          applicationId,
        },
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
          fromRole: ApplicationStage.CREDIT,
          toRole: ApplicationStage.CM,
          action: 'CREDIT_MAKER_QUERY_RAISED' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'CREDIT_MAKER_QUERY_RAISED',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            query: dto,
            stage: saved.stage,
            status: saved.status,
            assignedTo: 'CM',
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message: 'Credit Maker query raised successfully.',
        data: saved,
      };
    });
  }

  async creditMakerSubmitToChecker(
    applicationId: number,
    dto: any,
    actor: Actor,
  ) {
    this.ensureCreditMaker(actor);

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

      this.ensureCreditMakerCase(application);

      const fromStage = application.stage;
      const fromStatus = application.status;

      application.stage = ApplicationStage.CREDIT;
      application.status = ApplicationStatus.CREDIT_CHECKER_PENDING;
      application.updatedBy = actor?.id ?? undefined;

      const saved = await manager.save(application);

      const remarks =
        dto?.remarks ||
        dto?.makerRecommendation ||
        'Credit Maker submitted proposal to Credit Checker.';

      const workflowPayload = {
        applicationId,
        currentStage: saved.stage,
        currentStatus: saved.status,
        assignedTo: 'CREDIT_CHECKER',
        currentOwner: actor.id,
        lastAction: 'SUBMITTED_TO_CREDIT_CHECKER' as any,
        lastRemarks: remarks,
      };

      let workflow = await manager.findOne(Workflow, {
        where: {
          applicationId,
        },
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
          action: 'SUBMITTED_TO_CREDIT_CHECKER' as any,
          remarks,
          actionBy: actor.id,
        }),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action: 'SUBMITTED_TO_CREDIT_CHECKER',
          entityName: 'applications',
          entityId: applicationId,
          snapshot: {
            fromStage,
            fromStatus,
            toStage: saved.stage,
            toStatus: saved.status,
            assignedTo: 'CREDIT_CHECKER',
            memo: dto,
          },
          createdBy: actor.id,
        }),
      );

      return {
        success: true,
        message:
          'Application submitted to Credit Checker successfully.',
        data: saved,
      };
    });
  }
async creditCheckerApprove(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCreditChecker(actor);

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

    this.ensureCreditCheckerCase(application);

    const fromStage = application.stage;
    const fromStatus = application.status;

    application.stage = ApplicationStage.VALUATION;
    application.status = ApplicationStatus.VALUATION_PENDING;
    application.updatedBy = actor?.id ?? undefined;

    const saved = await manager.save(application);

    const remarks =
      dto?.remarks ||
      dto?.checkerRemarks ||
      'Credit Checker approved and sent case to Valuation.';

    const workflowPayload = {
      applicationId,
      currentStage: saved.stage,
      currentStatus: saved.status,
      assignedTo: 'VALUATION',
      currentOwner: actor.id,
      lastAction: 'CREDIT_CHECKER_APPROVED_SENT_TO_VALUATION' as any,
      lastRemarks: remarks,
    };

    let workflow = await manager.findOne(Workflow, {
      where: {
        applicationId,
      },
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
        action: 'CREDIT_CHECKER_APPROVED_SENT_TO_VALUATION' as any,
        remarks,
        actionBy: actor.id,
      }),
    );

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        action: 'CREDIT_CHECKER_APPROVED_SENT_TO_VALUATION',
        entityName: 'applications',
        entityId: applicationId,
        snapshot: {
          fromStage,
          fromStatus,
          toStage: saved.stage,
          toStatus: saved.status,
          assignedTo: 'VALUATION',
          checkerReview: dto,
        },
        createdBy: actor.id,
      }),
    );

    return {
      success: true,
      message:
        'Application approved by Credit Checker and sent to Valuation successfully.',
      data: saved,
    };
  });
}


async creditCheckerReturnToMaker(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCreditChecker(actor);

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

    this.ensureCreditCheckerCase(application);

    const fromStage = application.stage;
    const fromStatus = application.status;

    application.stage = ApplicationStage.CREDIT;
    application.status = ApplicationStatus.CREDIT_MAKER_QUERY;
    application.updatedBy = actor?.id ?? undefined;

    const saved = await manager.save(application);

    const remarks =
      dto?.remarks ||
      dto?.checkerRemarks ||
      'Credit Checker returned case to Credit Maker.';

    const workflowPayload = {
      applicationId,
      currentStage: saved.stage,
      currentStatus: saved.status,
      assignedTo: 'CREDIT_MAKER',
      currentOwner: actor.id,
      lastAction: 'CREDIT_CHECKER_RETURNED_TO_MAKER' as any,
      lastRemarks: remarks,
    };

    let workflow = await manager.findOne(Workflow, {
      where: {
        applicationId,
      },
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
        action: 'CREDIT_CHECKER_RETURNED_TO_MAKER' as any,
        remarks,
        actionBy: actor.id,
      }),
    );

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        action: 'CREDIT_CHECKER_RETURNED_TO_MAKER',
        entityName: 'applications',
        entityId: applicationId,
        snapshot: {
          fromStage,
          fromStatus,
          toStage: saved.stage,
          toStatus: saved.status,
          assignedTo: 'CREDIT_MAKER',
          checkerReview: dto,
        },
        createdBy: actor.id,
      }),
    );

    return {
      success: true,
      message: 'Application returned to Credit Maker successfully.',
      data: saved,
    };
  });
}

async creditCheckerReject(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCreditChecker(actor);

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

    this.ensureCreditCheckerCase(application);

    const fromStage = application.stage;
    const fromStatus = application.status;

    application.stage = ApplicationStage.CREDIT;
    application.status = ApplicationStatus.CREDIT_CHECKER_REJECTED;
    application.updatedBy = actor?.id ?? undefined;

    const saved = await manager.save(application);

    const remarks =
      dto?.remarks ||
      dto?.checkerRemarks ||
      'Credit Checker rejected application.';

    const workflowPayload = {
      applicationId,
      currentStage: saved.stage,
      currentStatus: saved.status,
      assignedTo: 'CREDIT_CHECKER',
      currentOwner: actor.id,
      lastAction: 'CREDIT_CHECKER_REJECTED' as any,
      lastRemarks: remarks,
    };

    let workflow = await manager.findOne(Workflow, {
      where: {
        applicationId,
      },
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
        action: 'CREDIT_CHECKER_REJECTED' as any,
        remarks,
        actionBy: actor.id,
      }),
    );

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        action: 'CREDIT_CHECKER_REJECTED',
        entityName: 'applications',
        entityId: applicationId,
        snapshot: {
          fromStage,
          fromStatus,
          toStage: saved.stage,
          toStatus: saved.status,
          checkerReview: dto,
        },
        createdBy: actor.id,
      }),
    );

    return {
      success: true,
      message: 'Application rejected by Credit Checker.',
      data: saved,
    };
  });
}
  
}