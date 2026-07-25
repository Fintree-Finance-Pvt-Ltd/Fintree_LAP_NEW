import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';



import {
  CreditAssessment,
  CreditAssessmentStatus,
  CreditDecision,
} from './entities/credit-assessment.entity';
import { DataSource, EntityManager } from 'typeorm';

import type { Actor } from '../applications/applications.service';
import { Application } from '../applications/entities/application.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';

import { ApplicationStage } from '../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

@Injectable()
export class CreditService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowTransitions: WorkflowTransitionService,
  ) {}


private toDecimalString(value: any): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return numericValue.toFixed(2);
}

private toInteger(value: any): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return undefined;
  }

  return Math.trunc(numericValue);
}

private toJson(value: any): string {
  try {
    return JSON.stringify(value || {});
  } catch {
    return '{}';
  }
}

private normalizeDecision(value: any): CreditDecision | undefined {
  const decision = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/\//g, '_');

  if (
    decision === 'RECOMMEND' ||
    decision === 'RECOMMENDED'
  ) {
    return CreditDecision.RECOMMEND;
  }

  if (
    decision === 'HOLD_QUERY' ||
    decision === 'HOLD' ||
    decision === 'QUERY'
  ) {
    return CreditDecision.HOLD_QUERY;
  }

  if (decision === 'REJECT' || decision === 'REJECTED') {
    return CreditDecision.REJECT;
  }

  if (decision === 'APPROVE' || decision === 'APPROVED') {
    return CreditDecision.APPROVE;
  }

  if (
    decision === 'RETURN_TO_MAKER' ||
    decision === 'RETURN'
  ) {
    return CreditDecision.RETURN_TO_MAKER;
  }

  return undefined;
}

private async getOrCreateCreditAssessment(
  applicationId: number,
  manager?: EntityManager,
) {
  const repo = manager
    ? manager.getRepository(CreditAssessment)
    : this.dataSource.getRepository(CreditAssessment);

  let assessment = await repo.findOne({
    where: { applicationId },
  });

  if (!assessment) {
    assessment = repo.create({
      applicationId,
      assessmentStatus: CreditAssessmentStatus.CM_DRAFT,
    });

    assessment = await repo.save(assessment);
  }

  return assessment;
}

private async saveCmAssessment(
  application: Application,
  dto: any,
  actor: Actor,
  manager: EntityManager,
  assessmentStatus: CreditAssessmentStatus,
) {
  const assessment = await this.getOrCreateCreditAssessment(
    Number(application.id),
    manager,
  );

  const decision = this.normalizeDecision(
    dto?.decision || dto?.cmDecision,
  );

  assessment.assessmentStatus = assessmentStatus;

  if (decision) {
    assessment.cmDecision = decision;
  }

  assessment.cmRecommendedAmount =
    this.toDecimalString(
      dto?.recommendedAmount ||
        dto?.cmRecommendedAmount,
    ) ?? assessment.cmRecommendedAmount;

  assessment.cmRiskScore =
    this.toInteger(
      dto?.riskScore ||
        dto?.cmRiskScore ||
        dto?.preliminaryRiskScore,
    ) ?? assessment.cmRiskScore;

  assessment.cmRemarks =
    dto?.remarks ||
    dto?.cmRemarks ||
    assessment.cmRemarks;

  assessment.verifiedIncome =
    this.toDecimalString(dto?.verifiedIncome) ??
    assessment.verifiedIncome;

  assessment.existingObligations =
    this.toDecimalString(dto?.existingObligations) ??
    assessment.existingObligations;

  assessment.foir =
    this.toDecimalString(dto?.foir) ??
    assessment.foir;

  assessment.propertyValue =
    this.toDecimalString(dto?.propertyValue) ??
    assessment.propertyValue;

  assessment.requestedLoan =
    this.toDecimalString(
      dto?.requestedLoan || dto?.requestedAmount,
    ) ?? assessment.requestedLoan;

  assessment.indicativeLtv =
    this.toDecimalString(dto?.indicativeLtv || dto?.ltv) ??
    assessment.indicativeLtv;

  assessment.bureauScore =
    this.toInteger(dto?.bureauScore) ??
    assessment.bureauScore;

  assessment.currentDpd =
    this.toInteger(dto?.currentDpd) ??
    assessment.currentDpd;

  assessment.dpd30In12m =
    this.toInteger(dto?.dpd30In12m || dto?.thirtyPlusDpdIn12M) ??
    assessment.dpd30In12m;

  assessment.writtenOffSettled =
    dto?.writtenOffSettled ||
    dto?.writtenOffOrSettled ||
    assessment.writtenOffSettled;

  assessment.recentEnquiries =
    this.toInteger(dto?.recentEnquiries) ??
    assessment.recentEnquiries;

  assessment.commercialBureau =
    dto?.commercialBureau ||
    assessment.commercialBureau;

  assessment.cmPayload = this.toJson(dto);
  assessment.cmSubmittedBy = actor?.id ?? undefined;
  assessment.cmSubmittedAt = new Date();

  return manager.save(CreditAssessment, assessment);
}

private async saveCreditMakerAssessment(
  application: Application,
  dto: any,
  actor: Actor,
  manager: EntityManager,
  assessmentStatus: CreditAssessmentStatus,
) {
  const assessment = await this.getOrCreateCreditAssessment(
    Number(application.id),
    manager,
  );

  const decision = this.normalizeDecision(
    dto?.decision || dto?.makerDecision,
  );

  assessment.assessmentStatus = assessmentStatus;

  if (decision) {
    assessment.makerDecision = decision;
  }

  assessment.makerRecommendedAmount =
    this.toDecimalString(
      dto?.recommendedAmount ||
        dto?.makerRecommendedAmount,
    ) ?? assessment.makerRecommendedAmount;

  assessment.makerRecommendedRoi =
    this.toDecimalString(
      dto?.recommendedRoi ||
        dto?.makerRecommendedRoi ||
        dto?.roi,
    ) ?? assessment.makerRecommendedRoi;

  assessment.makerRecommendedTenure =
    this.toInteger(
      dto?.recommendedTenure ||
        dto?.makerRecommendedTenure ||
        dto?.tenure,
    ) ?? assessment.makerRecommendedTenure;

  assessment.makerRiskGrade =
    dto?.riskGrade ||
    dto?.makerRiskGrade ||
    assessment.makerRiskGrade;

  assessment.makerRemarks =
    dto?.remarks ||
    dto?.makerRemarks ||
    dto?.makerRecommendation ||
    assessment.makerRemarks;

  assessment.makerPayload = this.toJson(dto);
  assessment.makerSubmittedBy = actor?.id ?? undefined;
  assessment.makerSubmittedAt = new Date();

  return manager.save(CreditAssessment, assessment);
}

private async saveCreditCheckerAssessment(
  application: Application,
  dto: any,
  actor: Actor,
  manager: EntityManager,
  assessmentStatus: CreditAssessmentStatus,
) {
  const assessment = await this.getOrCreateCreditAssessment(
    Number(application.id),
    manager,
  );

  const decision = this.normalizeDecision(
    dto?.decision || dto?.checkerDecision,
  );

  assessment.assessmentStatus = assessmentStatus;

  if (decision) {
    assessment.checkerDecision = decision;
  }

  assessment.checkerApprovedAmount =
    this.toDecimalString(
      dto?.approvedAmount ||
        dto?.checkerApprovedAmount ||
        dto?.recommendedAmount,
    ) ?? assessment.checkerApprovedAmount;

  assessment.checkerApprovedRoi =
    this.toDecimalString(
      dto?.approvedRoi ||
        dto?.checkerApprovedRoi ||
        dto?.roi,
    ) ?? assessment.checkerApprovedRoi;

  assessment.checkerApprovedTenure =
    this.toInteger(
      dto?.approvedTenure ||
        dto?.checkerApprovedTenure ||
        dto?.tenure,
    ) ?? assessment.checkerApprovedTenure;

  assessment.checkerRemarks =
    dto?.remarks ||
    dto?.checkerRemarks ||
    assessment.checkerRemarks;

  assessment.checkerPayload = this.toJson(dto);
  assessment.checkerSubmittedBy = actor?.id ?? undefined;
  assessment.checkerSubmittedAt = new Date();

  return manager.save(CreditAssessment, assessment);
}

private ensureCm(actor: Actor) {
  const roles = this.getActorRoles(actor);

  if (!roles.includes('CM')) {
    throw new ForbiddenException(
      'Only CM can perform this action.',
    );
  }
}

private ensureCmCase(application: Application) {
  const stage = String(application.stage || '').toUpperCase();
  const status = String(application.status || '').toUpperCase();

  if (
    stage !== ApplicationStage.CM &&
    ![
      ApplicationStatus.BM_APPROVED,
      ApplicationStatus.CM_PENDING,
      ApplicationStatus.CM_QUERY,
      ApplicationStatus.CM_APPROVED,
    ].includes(status as ApplicationStatus)
  ) {
    throw new BadRequestException(
      'Application must be in CM stage before credit recommendation.',
    );
  }
}

async getCreditAssessment(
  applicationId: number,
) {
  const application = await this.dataSource
    .getRepository(Application)
    .findOne({
      where: {
        id: applicationId,
      },
    });

  if (!application) {
    throw new NotFoundException(
      'Application not found',
    );
  }

  const creditAssessment =
    await this.dataSource
      .getRepository(CreditAssessment)
      .findOne({
        where: {
          applicationId,
        },
      });

  return {
    success: true,
    data: {
      application,
      creditAssessment,
    },
  };
}

async getFinalCreditManagerCases() {
  const applications = await this.dataSource
    .getRepository(Application)
    .createQueryBuilder('application')
    .where('application.stage = :stage', {
      stage: ApplicationStage.CM,
    })
    .andWhere('application.status = :status', {
      status: ApplicationStatus.CM_PENDING,
    })
    .orderBy('application.updatedAt', 'DESC')
    .getMany();

  return {
    success: true,
    message:
      'Final Credit Manager cases fetched successfully.',
    data: applications,
  };
}

async creditManagerApproveToOpsMaker(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  return this.dataSource.transaction(
    async (manager) => {
      const application =
        await manager.findOne(Application, {
          where: {
            id: applicationId,
          },
          lock: {
            mode: 'pessimistic_write',
          },
        });

      if (!application) {
        throw new NotFoundException(
          'Application not found.',
        );
      }

      const stage = String(
        application.stage || '',
      )
        .trim()
        .toUpperCase();

      const status = String(
        application.status || '',
      )
        .trim()
        .toUpperCase();

      if (
        stage !== ApplicationStage.CM ||
        status !==
          ApplicationStatus.CM_PENDING
      ) {
        throw new BadRequestException(
          `Application must be in CM/CM_FINAL_PENDING. Current state is ${stage}/${status}.`,
        );
      }

      const movement =
        await this.workflowTransitions.move({
          applicationId,
          action:
            'CREDIT_MANAGER_APPROVE_TO_OPS_MAKER',
          remarks:
            dto?.remarks ||
            dto?.cmRemarks ||
            'Approved by Credit Manager.',
          payload: dto,
          actor,
          manager,
        });

      return {
        success: true,
        message:
          'Credit Manager approved the case and sent it to Ops Maker.',
        data: {
          application:
            movement.data.application,
        },
      };
    },
  );
}

async cmSaveDraft(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCm(actor);

  return this.dataSource.transaction(async (manager) => {
    const application = await manager.findOne(Application, {
      where: { id: applicationId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    this.ensureCmCase(application);

    const creditAssessment = await this.saveCmAssessment(
      application,
      dto,
      actor,
      manager,
      CreditAssessmentStatus.CM_DRAFT,
    );

    return {
      success: true,
      message: 'CM screening draft saved successfully.',
      data: {
        application,
        creditAssessment,
      },
    };
  });
}

async cmRecommendToCreditMaker(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCm(actor);

  return this.dataSource.transaction(async (manager) => {
    const application = await manager.findOne(Application, {
      where: { id: applicationId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    this.ensureCmCase(application);

    const fromStage = application.stage;
    const fromStatus = application.status;

    const decision = this.normalizeDecision(
      dto?.decision || dto?.cmDecision,
    );

    const movement = await this.workflowTransitions.move({
      applicationId,
      action: decision === CreditDecision.REJECT
        ? 'CM_REJECT'
        : decision === CreditDecision.HOLD_QUERY
          ? 'CM_QUERY'
          : 'CM_APPROVE_TO_CREDIT_MAKER',
      remarks: dto?.remarks || dto?.cmRemarks,
      payload: dto,
      actor,
      manager,
    });
    const saved = movement.data.application;

    const assessmentStatus =
      decision === CreditDecision.REJECT
        ? CreditAssessmentStatus.CM_REJECTED
        : decision === CreditDecision.HOLD_QUERY
          ? CreditAssessmentStatus.CM_HOLD_QUERY
          : CreditAssessmentStatus.CM_RECOMMENDED;

    const creditAssessment = await this.saveCmAssessment(
      saved,
      dto,
      actor,
      manager,
      assessmentStatus,
    );

    const remarks =
      dto?.remarks ||
      dto?.cmRemarks ||
      'CM recommended case to Credit Maker.';

    const assignedTo =
      saved.status === ApplicationStatus.CREDIT_MAKER_PENDING
        ? 'CREDIT_MAKER'
        : 'CM';

    const workflowPayload = {
      applicationId,
      currentStage: saved.stage,
      currentStatus: saved.status,
      assignedTo,
      currentOwner: actor.id,
      lastAction:
        saved.status === ApplicationStatus.CREDIT_MAKER_PENDING
          ? ('CM_RECOMMENDED_TO_CREDIT_MAKER' as any)
          : ('CM_SCREENING_DECISION_SAVED' as any),
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
        action:
          saved.status === ApplicationStatus.CREDIT_MAKER_PENDING
            ? ('CM_RECOMMENDED_TO_CREDIT_MAKER' as any)
            : ('CM_SCREENING_DECISION_SAVED' as any),
        remarks,
        actionBy: actor.id,
      }),
    );

    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        action:
          saved.status === ApplicationStatus.CREDIT_MAKER_PENDING
            ? 'CM_RECOMMENDED_TO_CREDIT_MAKER'
            : 'CM_SCREENING_DECISION_SAVED',
        entityName: 'applications',
        entityId: applicationId,
        snapshot: {
          fromStage,
          fromStatus,
          toStage: saved.stage,
          toStatus: saved.status,
          cmScreening: dto,
          creditAssessmentId: creditAssessment.id,
        },
        createdBy: actor.id,
      }),
    );

    return {
      success: true,
      message:
        saved.status === ApplicationStatus.CREDIT_MAKER_PENDING
          ? 'CM screening saved and case sent to Credit Maker.'
          : 'CM screening decision saved successfully.',
      data: {
        application: saved,
        creditAssessment,
      },
    };
  });
}
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

  // private ensureCreditMakerCase(application: Application) {
  //   const stage = String(application.stage || '').toUpperCase();
  //   const status = String(application.status || '').toUpperCase();

  //   if (
  //     ![ApplicationStage.CREDIT, ApplicationStage.CREDIT_MAKER].includes(stage as ApplicationStage) ||
  //     ![
  //       ApplicationStatus.CREDIT_MAKER_PENDING,
  //       ApplicationStatus.CREDIT_MAKER_QUERY,
  //     ].includes(status as ApplicationStatus)
  //   ) {
  //     throw new BadRequestException(
  //       'Application must be in Credit Maker stage.',
  //     );
  //   }
  // }

  private ensureInitialCreditMakerCase(
  application: Application,
) {
  const stage = String(
    application.stage || '',
  ).toUpperCase();

  const status = String(
    application.status || '',
  ).toUpperCase();

  const validStage =
    stage === ApplicationStage.CREDIT_MAKER;

  const validStatus = [
    ApplicationStatus.CREDIT_MAKER_PENDING,
    ApplicationStatus.CREDIT_MAKER_QUERY,
  ].includes(status as ApplicationStatus);

  if (!validStage || !validStatus) {
    throw new BadRequestException(
      `Application must be in ` +
        `CREDIT_MAKER/CREDIT_MAKER_PENDING. ` +
        `Current state is ${stage}/${status}.`,
    );
  }
}

private ensureFinalCreditMakerCase(
  application: Application,
) {
  const stage = String(
    application.stage || '',
  ).toUpperCase();

  const status = String(
    application.status || '',
  ).toUpperCase();

  if (
    stage !==
      ApplicationStage.CREDIT_MAKER_FINAL ||
    status !==
      ApplicationStatus.CREDIT_MAKER_FINAL_PENDING
  ) {
    throw new BadRequestException(
      `Application must be in ` +
        `CREDIT_MAKER_FINAL/` +
        `CREDIT_MAKER_FINAL_PENDING. ` +
        `Current state is ${stage}/${status}.`,
    );
  }
}

private ensureAnyCreditMakerCase(
  application: Application,
) {
  const stage = String(
    application.stage || '',
  ).toUpperCase();

  const status = String(
    application.status || '',
  ).toUpperCase();

  const initialCase =
    stage === ApplicationStage.CREDIT_MAKER &&
    [
      ApplicationStatus.CREDIT_MAKER_PENDING,
      ApplicationStatus.CREDIT_MAKER_QUERY,
    ].includes(status as ApplicationStatus);

  const finalCase =
    stage ===
      ApplicationStage.CREDIT_MAKER_FINAL &&
    status ===
      ApplicationStatus.CREDIT_MAKER_FINAL_PENDING;

  if (!initialCase && !finalCase) {
    throw new BadRequestException(
      `Application is not available for Credit Maker. ` +
        `Current state is ${stage}/${status}.`,
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

// private ensureCreditCheckerCase(application: Application) {
//   const stage = String(application.stage || '').toUpperCase();
//   const status = String(application.status || '').toUpperCase();

//   if (
//     ![ApplicationStage.CREDIT, ApplicationStage.CREDIT_MAKER_FINAL].includes(stage as ApplicationStage) ||
//     ![
//       ApplicationStatus.CREDIT_MAKER_FINAL_QUERY,
//       ApplicationStatus.CREDIT_MAKER_FINAL_QUERY,
//     ].includes(status as ApplicationStatus)
//   ) {
//     throw new BadRequestException(
//       'Application must be in Credit Checker stage.',
//     );
//   }
// }

private ensureCreditCheckerCase(
  application: Application,
) {
  const stage = String(
    application.stage || '',
  ).toUpperCase();

  const status = String(
    application.status || '',
  ).toUpperCase();

  if (
    stage !==
      ApplicationStage.CREDIT_MAKER_FINAL ||
    status !==
      ApplicationStatus
        .CREDIT_MAKER_FINAL_PENDING
  ) {
    throw new BadRequestException(
      `Application must be in ` +
        `CREDIT_MAKER_FINAL/` +
        `CREDIT_MAKER_FINAL_PENDING. ` +
        `Current state is ${stage}/${status}.`,
    );
  }
}

async getFinalCreditMakerCases() {
  const applications = await this.dataSource
    .getRepository(Application)
    .createQueryBuilder('application')
    .where('application.stage = :stage', {
      stage: ApplicationStage.CREDIT_MAKER_FINAL,
    })
    .andWhere('application.status = :status', {
      status:
        ApplicationStatus.CREDIT_MAKER_FINAL_PENDING,
    })
    .orderBy('application.updatedAt', 'DESC')
    .getMany();

  return {
    success: true,
    message:
      'Final Credit Maker cases fetched successfully.',
    data: applications,
  };
}
  async getCreditMakerCases() {
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .where('a.stage IN (:...stages)', {
        stages: [ ApplicationStage.CREDIT_MAKER],
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.CREDIT_MAKER_PENDING,
          
        ],
      })
      .orderBy('a.updatedAt', 'DESC')
      .getMany();

    return {
      success: true,
      data: rows,
    };
  }

  async  getCreditCheckerCases() {
    const rows = await this.dataSource
      .getRepository(Application)
      .createQueryBuilder('a')
      .where('a.stage IN (:...stages)', {
        stages: [ApplicationStage.CREDIT_MAKER_FINAL, ApplicationStage.CREDIT_MAKER_FINAL],
      })
      .andWhere('a.status IN (:...statuses)', {
        statuses: [
          ApplicationStatus.CREDIT_MAKER_FINAL_PENDING,
          ApplicationStatus.CREDIT_MAKER_FINAL_QUERY,
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

  const creditAssessment = await this.dataSource
    .getRepository(CreditAssessment)
    .findOne({
      where: {
        applicationId,
      },
    });

  return {
    success: true,
    data: {
      ...application,
      creditAssessment,
    },
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

      this.ensureAnyCreditMakerCase(application);

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

      const creditAssessment = await this.saveCreditMakerAssessment(
  application,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.MAKER_DRAFT,
);

     return {
  success: true,
  message: 'Credit Maker draft saved successfully.',
  data: {
    application,
    creditAssessment,
  },
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

      this.ensureInitialCreditMakerCase(application);

      const movement = await this.workflowTransitions.move({
        applicationId, action: 'CREDIT_MAKER_QUERY',
        remarks: dto?.remarks || dto?.queryRemarks, payload: dto, actor, manager,
      });
      const saved = movement.data.application;

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

      const creditAssessment = await this.saveCreditMakerAssessment(
  saved,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.MAKER_QUERY,
);
   return {
  success: true,
  message: 'Credit Maker query raised successfully.',
  data: {
    application: saved,
    creditAssessment,
  },
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

      this.ensureFinalCreditMakerCase(application);

      const fromStage = application.stage;
      const fromStatus = application.status;

    const movement =
  await this.workflowTransitions.move({
    applicationId,

    action:
      'CREDIT_MAKER_FINAL_APPROVE_TO_CHECKER',

    remarks:
      dto?.remarks ||
      dto?.makerRecommendation ||
      'Final Credit Maker approval completed and application submitted to Credit Checker.',

    payload: dto,
    actor,
    manager,
  });


      const saved = movement.data.application;

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

      const creditAssessment = await this.saveCreditMakerAssessment(
  saved,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.MAKER_SUBMITTED,
);

      return {
  success: true,
  message: 'Application submitted to Credit Checker successfully.',
  data: {
    application: saved,
    creditAssessment,
  },
};
    });
  }

  async creditMakerSubmitToValuation(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCreditMaker(actor);

  return this.dataSource.transaction(
    async (manager) => {
      const application =
        await manager.findOne(Application, {
          where: {
            id: applicationId,
          },
          lock: {
            mode:
              'pessimistic_write',
          },
        });

      if (!application) {
        throw new NotFoundException(
          'Application not found',
        );
      }

      this.ensureInitialCreditMakerCase(
        application,
      );

      const fromStage =
        application.stage;

      const fromStatus =
        application.status;

      const remarks =
        dto?.remarks ||
        dto?.makerRecommendation ||
        'Credit Maker approved and submitted the application to Valuation.';

      const movement =
        await this.workflowTransitions.move({
          applicationId,

          action:
            'CREDIT_MAKER_APPROVE_TO_VALUATION',

          remarks,
          payload:
            dto,

          actor,
          manager,
        });

      const saved =
        movement.data.application;

      const workflowPayload = {
        applicationId,

        currentStage:
          saved.stage,

        currentStatus:
          saved.status,

        assignedTo:
          'VALUATION',

        currentOwner:
          actor.id,

        lastAction:
          'CREDIT_MAKER_APPROVED_TO_VALUATION' as any,

        lastRemarks:
          remarks,
      };

      let workflow =
        await manager.findOne(
          Workflow,
          {
            where: {
              applicationId,
            },
          },
        );

      if (workflow) {
        Object.assign(
          workflow,
          workflowPayload,
        );

        await manager.save(
          workflow,
        );
      } else {
        workflow =
          manager.create(
            Workflow,
            workflowPayload,
          );

        await manager.save(
          workflow,
        );
      }

      await manager.save(
        WorkflowHistory,
        manager.create(
          WorkflowHistory,
          {
            applicationId,

            fromRole:
              fromStage,

            toRole:
              saved.stage,

            action:
              'CREDIT_MAKER_APPROVED_TO_VALUATION' as any,

            remarks,

            actionBy:
              actor.id,
          },
        ),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action:
            'CREDIT_MAKER_APPROVED_TO_VALUATION',

          entityName:
            'applications',

          entityId:
            applicationId,

          snapshot: {
            fromStage,
            fromStatus,

            toStage:
              saved.stage,

            toStatus:
              saved.status,

            assignedTo:
              'VALUATION',

            makerAssessment:
              dto,
          },

          createdBy:
            actor.id,
        }),
      );

      const creditAssessment =
        await this.saveCreditMakerAssessment(
          saved,
          dto,
          actor,
          manager,
          CreditAssessmentStatus
            .MAKER_SUBMITTED,
        );

      return {
        success: true,

        message:
          'Application approved by Credit Maker and submitted to Valuation successfully.',

        data: {
          application:
            saved,

          creditAssessment,
        },
      };
    },
  );
}

// async creditCheckerApprove(
//   applicationId: number,
//   dto: any,
//   actor: Actor,
// ) {
//   this.ensureCreditChecker(actor);

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

//     this.ensureCreditCheckerCase(application);

//     const fromStage = application.stage;
//     const fromStatus = application.status;

   
// const movement =
//   await this.workflowTransitions.move({
//     applicationId,

//     action:
//       'CREDIT_CHECKER_APPROVE_TO_CREDIT_MANAGER',

 
//     payload: dto,
//     actor,
//     manager,
//   });

//     // const movement = await this.workflowTransitions.move({
//     //   applicationId, action: 'CREDIT_CHECKER_APPROVE_TO_CREDIT_MANAGER',
//     //   remarks: dto?.remarks || dto?.checkerRemarks, payload: dto, actor, manager,
//     // });
//     const saved = movement.data.application;

//     const remarks =
//       dto?.remarks ||
//       dto?.checkerRemarks ||
//       'Credit Checker approved and sent case to Credit Manager.';

//     const workflowPayload = {
//       applicationId,
//       currentStage: saved.stage,
//       currentStatus: saved.status,
//       assignedTo: 'CM',
//       currentOwner: actor.id,
//       lastAction: 'CREDIT_CHECKER_APPROVED_SENT_TO_CREDIT_MANAGER' as any,
//       lastRemarks: remarks,
//     };

//     let workflow = await manager.findOne(Workflow, {
//       where: {
//         applicationId,
//       },
//     });

//     if (workflow) {
//       Object.assign(workflow, workflowPayload);
//       await manager.save(workflow);
//     } else {
//       workflow = manager.create(Workflow, workflowPayload);
//       await manager.save(workflow);
//     }

//     await manager.save(
//   AuditLog,
//   manager.create(AuditLog, {
//     action:
//       'CREDIT_CHECKER_APPROVED_TO_CREDIT_MANAGER',

//     entityName:
//       'applications',

//     entityId:
//       applicationId,

//     snapshot: {
//       fromStage,
//       fromStatus,

//       toStage:
//         saved.stage,

//       toStatus:
//         saved.status,

//       assignedTo:
//         'CM',

//       checkerReview:
//         dto,
//     },

//     createdBy:
//       actor.id,
//   }),
// );
//     // await manager.save(
//     //   WorkflowHistory,
//     //   manager.create(WorkflowHistory, {
//     //     applicationId,
//     //     fromRole: fromStage,
//     //     toRole: saved.stage,
//     //     action: 'CREDIT_CHECKER_APPROVED_SENT_TO_CREDIT_MANAGER' as any,
//     //     remarks,
//     //     actionBy: actor.id,
//     //   }),
//     // );

//     await manager.save(
//       AuditLog,
//       manager.create(AuditLog, {
//         action: 'CREDIT_CHECKER_APPROVED_SENT_TO_CREDIT_MANAGER',
//         entityName: 'applications',
//         entityId: applicationId,
//         snapshot: {
//           fromStage,
//           fromStatus,
//           toStage: saved.stage,
//           toStatus: saved.status,
//           assignedTo: 'CREDIT_MANAGER',
//           checkerReview: dto,
//         },
//         createdBy: actor.id,
//       }),
//     );
// const creditAssessment = await this.saveCreditCheckerAssessment(
//   saved,
//   dto,
//   actor,
//   manager,
//   CreditAssessmentStatus.CHECKER_APPROVED,
// );
//  return {
//   success: true,
//   message:
//     'Application approved by Credit Checker and sent to Valuation successfully.',
//   data: {
//     application: saved,
//     creditAssessment,
//   },
// };
//   });
// }

async creditCheckerApprove(
  applicationId: number,
  dto: any,
  actor: Actor,
) {
  this.ensureCreditChecker(actor);

  return this.dataSource.transaction(
    async (manager) => {
      const application =
        await manager.findOne(Application, {
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

      this.ensureCreditCheckerCase(
        application,
      );

      const fromStage =
        application.stage;

      const fromStatus =
        application.status;

      const remarks =
        dto?.remarks ||
        dto?.checkerRemarks ||
        'Credit Checker approved and submitted the application to Credit Manager.';

      const movement =
        await this.workflowTransitions.move({
          applicationId,

          action:
            'CREDIT_CHECKER_APPROVE_TO_CREDIT_MANAGER',

          remarks,
          payload: dto,
          actor,
          manager,
        });

      const saved =
        movement.data.application;

      const workflowPayload = {
        applicationId,

        currentStage:
          saved.stage,

        currentStatus:
          saved.status,

        assignedTo:
          'CM',

        currentOwner:
          actor.id,

        lastAction:
          'CREDIT_CHECKER_APPROVED_TO_CREDIT_MANAGER' as any,

        lastRemarks:
          remarks,
      };

      let workflow =
        await manager.findOne(Workflow, {
          where: {
            applicationId,
          },
        });

      if (workflow) {
        Object.assign(
          workflow,
          workflowPayload,
        );

        await manager.save(
          workflow,
        );
      } else {
        workflow =
          manager.create(
            Workflow,
            workflowPayload,
          );

        await manager.save(
          workflow,
        );
      }

      await manager.save(
        WorkflowHistory,
        manager.create(
          WorkflowHistory,
          {
            applicationId,

            fromRole:
              fromStage,

            toRole:
              saved.stage,

            action:
              'CREDIT_CHECKER_APPROVED_TO_CREDIT_MANAGER' as any,

            remarks,

            actionBy:
              actor.id,
          },
        ),
      );

      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          action:
            'CREDIT_CHECKER_APPROVED_TO_CREDIT_MANAGER',

          entityName:
            'applications',

          entityId:
            applicationId,

          snapshot: {
            fromStage,
            fromStatus,

            toStage:
              saved.stage,

            toStatus:
              saved.status,

            assignedTo:
              'CM',

            checkerReview:
              dto,
          },

          createdBy:
            actor.id,
        }),
      );

      const creditAssessment =
        await this.saveCreditCheckerAssessment(
          saved,
          dto,
          actor,
          manager,
          CreditAssessmentStatus
            .CHECKER_APPROVED,
        );

      return {
        success: true,

        message:
          'Application approved and sent to Credit Manager successfully.',

        data: {
          application:
            saved,

          creditAssessment,
        },
      };
    },
  );
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

    const movement = await this.workflowTransitions.move({
      applicationId, action: 'CREDIT_CHECKER_RETURN_TO_MAKER',
      remarks: dto?.remarks || dto?.checkerRemarks, payload: dto, actor, manager,
    });
    const saved = movement.data.application;

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

    const creditAssessment = await this.saveCreditCheckerAssessment(
  saved,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.CHECKER_RETURNED,
);

return {
  success: true,
  message: 'Application returned to Credit Maker successfully.',
  data: {
    application: saved,
    creditAssessment,
  },
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

    const movement = await this.workflowTransitions.move({
      applicationId, action: 'CREDIT_CHECKER_REJECT',
      remarks: dto?.remarks || dto?.checkerRemarks, payload: dto, actor, manager,
    });
    const saved = movement.data.application;

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
const creditAssessment = await this.saveCreditCheckerAssessment(
  saved,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.CHECKER_REJECTED,
);
 return {
  success: true,
  message: 'Application rejected by Credit Checker.',
  data: {
    application: saved,
    creditAssessment,
  },
};
  });
}
  
}
