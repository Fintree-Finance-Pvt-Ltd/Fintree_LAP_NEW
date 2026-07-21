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

@Injectable()
export class CreditService {
  constructor(private readonly dataSource: DataSource) {}


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

async getCreditAssessment(applicationId: number) {
  const application = await this.dataSource
    .getRepository(Application)
    .findOne({
      where: { id: applicationId },
    });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  const assessment = await this.dataSource
    .getRepository(CreditAssessment)
    .findOne({
      where: { applicationId },
    });

  return {
    success: true,
    data: {
      application,
      creditAssessment: assessment,
    },
  };
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

    if (decision === CreditDecision.REJECT) {
      application.stage = ApplicationStage.CM;
      application.status = ApplicationStatus.CM_REJECTED;
    } else if (decision === CreditDecision.HOLD_QUERY) {
      application.stage = ApplicationStage.CM;
      application.status = ApplicationStatus.CM_QUERY;
    } else {
      application.stage = ApplicationStage.CREDIT;
      application.status = ApplicationStatus.CREDIT_MAKER_PENDING;
    }

    application.updatedBy = actor?.id ?? undefined;

    const saved = await manager.save(application);

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
const creditAssessment = await this.saveCreditCheckerAssessment(
  saved,
  dto,
  actor,
  manager,
  CreditAssessmentStatus.CHECKER_APPROVED,
);
 return {
  success: true,
  message:
    'Application approved by Credit Checker and sent to Valuation successfully.',
  data: {
    application: saved,
    creditAssessment,
  },
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