import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  Repository,
} from 'typeorm';

import { Application } from '../applications/entities/application.entity';
import { CreditAssessment } from '../credit/entities/credit-assessment.entity';
import { LoanAccount } from '../loan-accounts/entities/loan-account.entity';
import {
  Partner,
  PartnerStatus,
} from '../partners/entities/partner.entity';
import { ValuationAssessment } from '../valuation/entities/valuation-assessment.entity';
import {
  LegalAssessment,
  LegalAssessmentStatus,
} from './entities/legal-assessment.entity';
import { ApplicationStage } from 'src/common/enums/application-stage.enum';
import { ApplicationStatus } from 'src/common/enums/application-status.enum';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

type ActorLike = {
  id?: number | string;
  roles?: string[];
};

const DEFAULT_PARTNER_CODE = 'RAMSETU';

@Injectable()
export class LegalService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Application)
    private readonly applicationsRepo: Repository<Application>,

    @InjectRepository(LegalAssessment)
    private readonly legalRepo: Repository<LegalAssessment>,

    @InjectRepository(ValuationAssessment)
    private readonly valuationRepo: Repository<ValuationAssessment>,
    private readonly workflowTransitions: WorkflowTransitionService,
  ) {}

  async getCases() {
  const data = await this.applicationsRepo.find({
    where: {
      stage: 'LEGAL' as any,
      status: In([
        'LEGAL_PENDING',
        'LEGAL_QUERY',
        'LEGAL_REJECTED',
        'VALUATION_APPROVED',
        'VALUATION_PENDING',
      ] as any),
    },
    order: {
      updatedAt: 'DESC',
    },
  });

  return data;
}

async getCasesRequiringAttention() {
  const applications =
    await this.applicationsRepo.find({
       where: {
        stage: 'LEGAL' as Application['stage'],
        status:
          'LEGAL_PENDING' as Application['status'],
      },
      select: {
        id: true,
        applicationNumber: true,
        customerName: true,
        requestedAmount: true,
        stage: true,
        status: true,
      },
      order: {
        updatedAt: 'DESC',
      },
    });

  return applications.map((application) => ({
    id: Number(application.id),
    application_number:
      application.applicationNumber,
    customer_name:
      application.customerName,
    requested_amount:
      application.requestedAmount,
    stage: application.stage,
    status: application.status,
  }));
}

async getStatus(id: number) {
  const application = await this.applicationsRepo.findOne({
    where: {
      id,
    },
    select: {
      id: true,
      applicationNumber: true,
      stage: true,
      status: true,
    },
  });

  if (!application) {
    throw new NotFoundException(
      `Application ${id} was not found.`,
    );
  }

  return {
    applicationId: Number(application.id),
    applicationNumber: application.applicationNumber,
    stage: application.stage,
    status: application.status,
  };
}

  async getApplication(applicationId: number) {
    const application = await this.getApplicationOrFail(applicationId);

    const [legalAssessment, valuationAssessment, creditAssessment, loanAccount] =
      await Promise.all([
        this.legalRepo.findOne({
          where: {
            applicationId,
          },
        }),

        this.valuationRepo.findOne({
          where: {
            applicationId,
          },
        }),

        this.dataSource.getRepository(CreditAssessment).findOne({
          where: {
            applicationId,
          },
        }),

        this.dataSource.getRepository(LoanAccount).findOne({
          where: {
            applicationId,
          },
        }),
      ]);

    return {
      success: true,
      data: {
        application,
        legalAssessment,
        valuationAssessment,
        creditAssessment,
        loanAccount,
      },
    };
  }

  async getAssessment(applicationId: number) {
    return this.getApplication(applicationId);
  }

  async saveDraft(applicationId: number, body: any, actor: ActorLike) {
    const application = await this.getApplicationOrFail(applicationId);

    const legalAssessment = await this.saveAssessment(
      application,
      body,
      actor,
      LegalAssessmentStatus.DRAFT,
    );

    return {
      success: true,
      message: 'Legal draft saved successfully.',
      data: {
        application,
        legalAssessment,
      },
    };
  }

  async raiseQuery(applicationId: number, body: any, actor: ActorLike) {
    return this.dataSource.transaction(async (manager) => {
      const application = await this.getApplicationOrFail(
        applicationId,
        manager,
        true,
      );

      const movement = await this.workflowTransitions.move({
        applicationId, action: 'LEGAL_QUERY', remarks: body?.remarks,
        payload: body, actor, manager,
      });
      const savedApplication = movement.data.application;

      const legalAssessment = await this.saveAssessment(
        savedApplication,
        body,
        actor,
        LegalAssessmentStatus.QUERY,
        manager,
      );

      return {
        success: true,
        message: 'Legal query raised successfully.',
        data: {
          application: savedApplication,
          legalAssessment,
        },
      };
    });
  }

  async markNegative(applicationId: number, body: any, actor: ActorLike) {
    return this.dataSource.transaction(async (manager) => {
      const application = await this.getApplicationOrFail(
        applicationId,
        manager,
        true,
      );

      const movement = await this.workflowTransitions.move({
        applicationId, action: 'LEGAL_REJECT', remarks: body?.remarks,
        payload: body, actor, manager,
      });
      const savedApplication = movement.data.application;

      const legalAssessment = await this.saveAssessment(
        savedApplication,
        {
          ...body,
          finalLegalStatus: 'Negative',
        },
        actor,
        LegalAssessmentStatus.NEGATIVE,
        manager,
      );

      return {
        success: true,
        message: 'Application marked negative by Legal.',
        data: {
          application: savedApplication,
          legalAssessment,
        },
      };
    });
  }

// async approveToOpsMaker(applicationId: number, body: any, actor: ActorLike) {
//   return this.dataSource.transaction(async (manager) => {
//     const application = await this.getApplicationOrFail(
//       applicationId,
//       manager,
//       true,
//     );

//     const movement = await this.workflowTransitions.move({
//       applicationId, action: 'LEGAL_APPROVE_TO_OPS_MAKER', remarks: body?.remarks,
//       payload: body, actor, manager,
//     });
//     const savedApplication = movement.data.application;

//     const legalAssessment = await this.saveAssessment(
//       savedApplication,
//       {
//         ...body,
//         finalLegalStatus: body?.finalLegalStatus || 'Positive',
//       },
//       actor,
//       LegalAssessmentStatus.APPROVED_TO_OPS_MAKER,
//       manager,
//     );

//     const loanAccount = await this.createLoanAccountAfterLegalApproval(
//       savedApplication,
//       legalAssessment,
//       actor,
//       manager,
//       body?.partnerCode || DEFAULT_PARTNER_CODE,
//     );

//     return {
//       success: true,
//       message:
//         'Legal approved, LAN generated and case moved to Ops Maker successfully.',
//       data: {
//         application: savedApplication,
//         legalAssessment,
//         loanAccount,
//       },
//     };
//   });
// }

async approveToCreditMaker(
  applicationId: number,
  body: any,
  actor: ActorLike,
) {
  return this.dataSource.transaction(
    async (manager) => {
      const application =
        await this.getApplicationOrFail(
          applicationId,
          manager,
          true,
        );

      const movement =
        await this.workflowTransitions.move({
          applicationId,
          action:
            'LEGAL_APPROVE_TO_CREDIT_MAKER',
          remarks: body?.remarks,
          payload: body,
          actor,
          manager,
        });

      const savedApplication =
        movement.data.application;

      const legalAssessment =
        await this.saveAssessment(
          savedApplication,
          {
            ...body,
            finalLegalStatus:
              body?.finalLegalStatus ||
              'Positive',
          },
          actor,
          LegalAssessmentStatus
            .APPROVED_TO_CREDIT_MAKER,
          manager,
        );

      return {
        success: true,
        message:
          'Legal approved and case moved to Credit Maker successfully.',
        data: {
          application: savedApplication,
          legalAssessment,
        },
      };
    },
  );
}

  private async getApplicationOrFail(
    applicationId: number,
    manager?: EntityManager,
    withLock = false,
  ) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required.');
    }

    const repo = manager
      ? manager.getRepository(Application)
      : this.applicationsRepo;

    const application = await repo.findOne({
      where: {
        id: applicationId,
      },
      ...(withLock
        ? {
            lock: {
              mode: 'pessimistic_write' as const,
            },
          }
        : {}),
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    return application;
  }

  private async getOrCreateAssessment(
    applicationId: number,
    manager?: EntityManager,
  ) {
    const repo = manager
      ? manager.getRepository(LegalAssessment)
      : this.legalRepo;

    let assessment = await repo.findOne({
      where: {
        applicationId,
      },
    });

    if (!assessment) {
      assessment = repo.create({
        applicationId,
        assessmentStatus: LegalAssessmentStatus.DRAFT,
      });

      assessment = await repo.save(assessment);
    }

    return assessment;
  }

  private async saveAssessment(
    application: Application,
    body: any,
    actor: ActorLike,
    status: LegalAssessmentStatus,
    manager?: EntityManager,
  ) {
    const applicationId = Number(application.id);

    const legalRepo = manager
      ? manager.getRepository(LegalAssessment)
      : this.legalRepo;

    const valuationRepo = manager
      ? manager.getRepository(ValuationAssessment)
      : this.valuationRepo;

    const assessment = await this.getOrCreateAssessment(
      applicationId,
      manager,
    );

    const valuationAssessment = await valuationRepo.findOne({
      where: {
        applicationId,
      },
    });

    assessment.assessmentStatus = status;

    if (this.hasValue(body, 'propertyAddress')) {
      assessment.propertyAddress = this.toText(body.propertyAddress);
    }

    if (this.hasValue(body, 'propertyType')) {
      assessment.propertyType = this.toText(body.propertyType);
    }

    if (this.hasValue(body, 'currentOwner')) {
      assessment.currentOwner = this.toText(body.currentOwner);
    }

    if (this.hasValue(body, 'lawFirmAdvocate')) {
      assessment.lawFirmAdvocate = this.toText(body.lawFirmAdvocate);
    }

    if (this.hasValue(body, 'assignmentDate')) {
      assessment.assignmentDate =
        this.toDate(body.assignmentDate) || assessment.assignmentDate;
    }

    if (this.hasValue(body, 'mortgageMethod')) {
      assessment.mortgageMethod = this.toText(body.mortgageMethod);
    }

    if (this.hasValue(body, 'titleStatus')) {
      assessment.titleStatus = this.toText(body.titleStatus);
    }

    if (this.hasValue(body, 'encumbranceStatus')) {
      assessment.encumbranceStatus = this.toText(body.encumbranceStatus);
    }

    if (this.hasValue(body, 'cersaiResult')) {
      assessment.cersaiResult = this.toText(body.cersaiResult);
    }

    if (this.hasValue(body, 'finalLegalStatus')) {
      assessment.finalLegalStatus = this.toText(body.finalLegalStatus);
    }

    if (this.hasValue(body, 'conditions')) {
      assessment.conditions = this.toText(body.conditions);
    }

    if (this.hasValue(body, 'opinionSummary') || this.hasValue(body, 'summary')) {
      assessment.opinionSummary = this.toText(
        body.opinionSummary ?? body.summary,
      );
    }

    if (this.hasValue(body, 'legalRemarks') || this.hasValue(body, 'remarks')) {
      assessment.legalRemarks = this.toText(
        body.legalRemarks ?? body.remarks,
      );
    }

    if (this.hasValue(body, 'queryRemarks')) {
      assessment.queryRemarks = this.toText(body.queryRemarks);
    }

    if (this.hasValue(body, 'negativeRemarks')) {
      assessment.negativeRemarks = this.toText(body.negativeRemarks);
    }

    if (this.hasValue(body, 'opsInstructions')) {
      assessment.opsInstructions = this.toText(body.opsInstructions);
    }

    if (this.hasValue(body, 'legalReportReference')) {
      assessment.legalReportReference = this.toText(
        body.legalReportReference,
      );
    }

    if (this.hasValue(body, 'titleChain')) {
      assessment.titleChainJson = this.toJson(body.titleChain || []);
    }

    if (this.hasValue(body, 'checklist')) {
      assessment.checklistJson = this.toJson(body.checklist || []);
    }

    assessment.customerSnapshot = this.toJson(
      body?.customerSnapshot || {
        applicationId: application.id,
        applicationNumber: application.applicationNumber,
        customerName: application.customerName,
        mobile: application.mobile,
        pan: application.pan,
        requestedAmount: application.requestedAmount,
        stage: application.stage,
        status: application.status,
      },
    );

    assessment.propertySnapshot = this.toJson(
      body?.propertySnapshot || {
        propertyAddress: assessment.propertyAddress,
        propertyType: assessment.propertyType,
        currentOwner: assessment.currentOwner,
        mortgageMethod: assessment.mortgageMethod,
      },
    );

    assessment.valuationSnapshot = this.toJson(
      body?.valuationSnapshot || valuationAssessment || {},
    );

    assessment.legalPayload = this.toJson(body || {});
    assessment.submittedBy = this.toInteger(actor?.id) ?? assessment.submittedBy;
    assessment.submittedAt = new Date();

    return legalRepo.save(assessment);
  }





  private firstDefined(...values: any[]) {
    return values.find(
      (value) =>
        value !== undefined &&
        value !== null &&
        value !== '',
    );
  }

  private hasValue(object: any, key: string) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  private toText(value: any): string | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    return String(value).trim();
  }

  private toDecimalString(value: any): string | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return undefined;
    }

    return number.toFixed(2);
  }

  private toInteger(value: any): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const number = Number(value);

    if (!Number.isFinite(number)) {
      return undefined;
    }

    return Math.trunc(number);
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    return date;
  }

  private toJson(value: any): string {
    try {
      const seen = new WeakSet();

      return JSON.stringify(value || {}, (_key, jsonValue) => {
        if (typeof jsonValue === 'bigint') {
          return jsonValue.toString();
        }

        if (typeof jsonValue === 'object' && jsonValue !== null) {
          if (seen.has(jsonValue)) {
            return undefined;
          }

          seen.add(jsonValue);
        }

        return jsonValue;
      });
    } catch {
      return '{}';
    }
  }
}
