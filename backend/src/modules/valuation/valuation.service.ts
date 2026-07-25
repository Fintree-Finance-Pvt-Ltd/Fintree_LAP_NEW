
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Application } from '../applications/entities/application.entity';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';
import {
  ValuationAssessment,
  ValuationAssessmentStatus,
} from './entities/valuation-assessment.entity';

type ActorLike = {
  id?: number;
  roles?: string[];
};

@Injectable()
export class ValuationService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationsRepo: Repository<Application>,

    @InjectRepository(ValuationAssessment)
    private readonly valuationRepo: Repository<ValuationAssessment>,
    private readonly workflowTransitions: WorkflowTransitionService,
  ) { }

  // async getCases() {
  //   const data = await this.applicationsRepo.find({
  //     where: [
  //       {
  //         stage: 'VALUATION' as any,
  //       },
  //       {
  //         status: In([
  //           'CREDIT_CHECKER_APPROVED',
  //           'VALUATION_PENDING',
  //           'VALUATION_QUERY',
  //           'VALUATION_APPROVED',
  //           'VALUATION_REJECTED',
  //         ] as any),
  //       },
  //     ],
  //     order: {
  //       updatedAt: 'DESC' as any,
  //     },
  //   });

  //   return {
  //     success: true,
  //     data,
  //   };
  // }

  async debugQueue() {
  const database = await this.applicationsRepo.query(
    'SELECT DATABASE() AS databaseName',
  );

  const tableName = this.applicationsRepo.metadata.tablePath;

  const stageStatusSummary = await this.applicationsRepo
    .createQueryBuilder('application')
    .select('application.stage', 'stage')
    .addSelect('application.status', 'status')
    .addSelect('COUNT(application.id)', 'total')
    .groupBy('application.stage')
    .addGroupBy('application.status')
    .orderBy('application.stage', 'ASC')
    .addOrderBy('application.status', 'ASC')
    .getRawMany();

  const exactMatchingRows = await this.applicationsRepo
    .createQueryBuilder('application')
    .select([
      'application.id',
      'application.applicationNumber',
      'application.customerName',
      'application.stage',
      'application.status',
      'application.updatedAt',
    ])
    .where('application.stage = :stage', {
      stage: 'VALUATION',
    })
    .andWhere('application.status = :status', {
      status: 'VALUATION_PENDING',
    })
    .orderBy('application.updatedAt', 'DESC')
    .getMany();

  const valuationRelatedRows = await this.applicationsRepo
    .createQueryBuilder('application')
    .select([
      'application.id',
      'application.applicationNumber',
      'application.customerName',
      'application.stage',
      'application.status',
      'application.updatedAt',
    ])
    .where(
      `
        UPPER(COALESCE(application.stage, '')) LIKE :value
        OR UPPER(COALESCE(application.status, '')) LIKE :value
      `,
      {
        value: '%VALUATION%',
      },
    )
    .orderBy('application.updatedAt', 'DESC')
    .take(50)
    .getMany();

  const latestApplications = await this.applicationsRepo
    .createQueryBuilder('application')
    .select([
      'application.id',
      'application.applicationNumber',
      'application.customerName',
      'application.stage',
      'application.status',
      'application.updatedAt',
    ])
    .orderBy('application.updatedAt', 'DESC')
    .take(20)
    .getMany();

  return {
    success: true,
    data: {
      connectedDatabase: database?.[0]?.databaseName ?? null,
      mappedApplicationTable: tableName,
      exactMatchingCount: exactMatchingRows.length,
      exactMatchingRows,
      valuationRelatedRows,
      stageStatusSummary,
      latestApplications,
    },
  };
}

  async getCases() {
  const applications = await this.applicationsRepo
    .createQueryBuilder('application')
    .leftJoin(
      ValuationAssessment,
      'valuationAssessment',
      'valuationAssessment.applicationId = application.id',
    )
    .select([
      'application.id',
      'application.applicationNumber',
      'application.customerName',
      'application.mobile',
      'application.pan',
      'application.requestedAmount',
      'application.stage',
      'application.status',
      'application.updatedAt',
    ])
    .where('application.stage = :stage', {
      stage: 'VALUATION',
    })
    .andWhere('application.status = :status', {
      status: 'VALUATION_PENDING',
    })
    .orderBy('application.updatedAt', 'DESC')
    .getMany();

  const data = applications.map((application) => ({
    applicationId: Number(application.id),
    applicationNumber: application.applicationNumber,
    customerName: application.customerName,
    mobileNumber: application.mobile,
    pan: application.pan ?? null,
    requestedAmount: application.requestedAmount ?? null,
    stage: application.stage,
    status: application.status,
  }));

  return {
    success: true,
    message: 'Valuation queue fetched successfully.',
    data,
  };
}

async debugValuationTransitions() {
  const rows = await this.applicationsRepo.query(`
    SELECT
      wa.application_id AS applicationId,
      wa.action,
      wa.from_stage AS fromStage,
      wa.from_status AS fromStatus,
      wa.to_stage AS toStage,
      wa.to_status AS toStatus,
      wa.created_at AS transitionCreatedAt,
      a.application_number AS applicationNumber,
      a.stage AS currentApplicationStage,
      a.status AS currentApplicationStatus
    FROM workflow_approval_logs wa
    LEFT JOIN applications a
      ON a.id = wa.application_id
    WHERE UPPER(TRIM(wa.to_stage)) = 'VALUATION'
       OR UPPER(TRIM(wa.to_status)) = 'VALUATION_PENDING'
    ORDER BY wa.created_at DESC
    LIMIT 50
  `);

  return {
    message: 'Valuation transition debug fetched successfully.',
    data: rows,
  };
}
 

  async getApplication(applicationId: number) {
    const application = await this.applicationsRepo.findOne({
      where: {
        id: applicationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const valuationAssessment = await this.valuationRepo.findOne({
      where: {
        applicationId,
      },
    });

    return {
      success: true,
      data: {
        application,
        valuationAssessment,
      },
    };
  }

  async getAssessment(applicationId: number) {
    const application = await this.applicationsRepo.findOne({
      where: {
        id: applicationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    const valuationAssessment = await this.valuationRepo.findOne({
      where: {
        applicationId,
      },
    });

    return {
      success: true,
      data: {
        application,
        valuationAssessment,
      },
    };
  }

  async saveDraft(applicationId: number, body: any, actor: ActorLike) {
    const application = await this.getApplicationOrFail(applicationId);

    const valuationAssessment = await this.saveAssessment(
      application,
      body,
      actor,
      ValuationAssessmentStatus.DRAFT,
    );

    return {
      success: true,
      message: 'Valuation draft saved successfully.',
      data: {
        application,
        valuationAssessment,
      },
    };
  }

  async raiseQuery(applicationId: number, body: any, actor: ActorLike) {
    const movement = await this.workflowTransitions.move({
      applicationId, action: 'VALUATION_QUERY', remarks: body?.remarks,
      payload: body, actor,
    });
    const savedApplication = movement.data.application;

    const valuationAssessment = await this.saveAssessment(
      savedApplication,
      {
        ...body,
        valuationStatus: 'Query',
      },
      actor,
      ValuationAssessmentStatus.QUERY,
    );

    return {
      success: true,
      message: 'Technical valuation query raised successfully.',
      data: {
        application: savedApplication,
        valuationAssessment,
      },
    };
  }

  async markNegative(applicationId: number, body: any, actor: ActorLike) {
    const movement = await this.workflowTransitions.move({
      applicationId, action: 'VALUATION_REJECT', remarks: body?.remarks,
      payload: body, actor,
    });
    const savedApplication = movement.data.application;

    const valuationAssessment = await this.saveAssessment(
      savedApplication,
      {
        ...body,
        valuationStatus: 'Negative',
      },
      actor,
      ValuationAssessmentStatus.NEGATIVE,
    );

    return {
      success: true,
      message: 'Application marked negative by Valuation.',
      data: {
        application: savedApplication,
        valuationAssessment,
      },
    };
  }

  // async approveToLegal(applicationId: number, body: any, actor: ActorLike) {
  //   await this.workflowTransitions.updateVerification(applicationId, {
  //     valuationFieldVisitRequired:
  //       process.env.VALUATION_FIELD_VISIT_REQUIRED === 'true',
  //     valuationFieldVisitCompleted: Boolean(body?.visitDate),
  //     valuationGeoRequired:
  //       process.env.VALUATION_GEO_REQUIRED === 'true',
  //     valuationGeoCompleted:
  //       body?.latitude !== undefined &&
  //       body?.longitude !== undefined &&
  //       body?.latitude !== '' &&
  //       body?.longitude !== '',
  //   });

  //   const movement = await this.workflowTransitions.move({
  //     applicationId, action: 'VALUATION_APPROVE_TO_LEGAL', remarks: body?.remarks,
  //     payload: body, actor,
  //   });
  //   const savedApplication = movement.data.application;

  //   const valuationAssessment = await this.saveAssessment(
  //     savedApplication,
  //     {
  //       ...body,
  //       valuationStatus: 'Positive',
  //     },
  //     actor,
  //     ValuationAssessmentStatus.APPROVED_TO_LEGAL,
  //   );

  //   return {
  //     success: true,
  //     message: 'Valuation accepted and case sent to Legal successfully.',
  //     data: {
  //       application: savedApplication,
  //       valuationAssessment,
  //     },
  //   };
  // }

  async approveToLegal(
  applicationId: number,
  body: any,
  actor: ActorLike,
) {
  let application =
    await this.getApplicationOrFail(applicationId);

  const currentStage = String(
    application.stage || '',
  ).toUpperCase();

  const currentStatus = String(
    application.status || '',
  ).toUpperCase();

  /*
   * The request may be repeated because of:
   * - double click
   * - network retry
   * - assessment saving failure after workflow movement
   *
   * If the case is already in Legal, do not attempt
   * the same workflow transition again.
   */
  if (
    currentStage === 'LEGAL' &&
    currentStatus === 'LEGAL_PENDING'
  ) {
    const valuationAssessment =
      await this.saveAssessment(
        application,
        {
          ...body,
          valuationStatus: 'Positive',
        },
        actor,
        ValuationAssessmentStatus.APPROVED_TO_LEGAL,
      );

    return {
      success: true,
      message:
        'Application was already sent to Legal. Valuation assessment has been updated.',
      data: {
        application,
        valuationAssessment,
      },
    };
  }

  /*
   * Reject approval from every other unexpected state.
   */
  if (
    currentStage !== 'VALUATION' ||
    currentStatus !== 'VALUATION_PENDING'
  ) {
    throw new BadRequestException(
      `Application cannot be approved from ${currentStage}/${currentStatus}. ` +
        'Expected VALUATION/VALUATION_PENDING.',
    );
  }

  await this.workflowTransitions.updateVerification(
    applicationId,
    {
      valuationFieldVisitRequired:
        process.env.VALUATION_FIELD_VISIT_REQUIRED ===
        'true',

      valuationFieldVisitCompleted: Boolean(
        body?.visitDate,
      ),

      valuationGeoRequired:
        process.env.VALUATION_GEO_REQUIRED ===
        'true',

      valuationGeoCompleted:
        body?.latitude !== undefined &&
        body?.longitude !== undefined &&
        body?.latitude !== '' &&
        body?.longitude !== '',
    },
  );

  let savedApplication: Application;

  try {
    const movement =
      await this.workflowTransitions.move({
        applicationId,
        action:
          'VALUATION_APPROVE_TO_LEGAL',
        remarks: body?.remarks,
        payload: body,
        actor,
      });

    savedApplication =
      movement.data.application;
  } catch (error) {
    /*
     * Handles two approval requests arriving
     * almost simultaneously.
     */
    application =
      await this.getApplicationOrFail(
        applicationId,
      );

    const latestStage = String(
      application.stage || '',
    ).toUpperCase();

    const latestStatus = String(
      application.status || '',
    ).toUpperCase();

    if (
      latestStage === 'LEGAL' &&
      latestStatus === 'LEGAL_PENDING'
    ) {
      savedApplication = application;
    } else {
      throw error;
    }
  }

  const valuationAssessment =
    await this.saveAssessment(
      savedApplication,
      {
        ...body,
        valuationStatus: 'Positive',
      },
      actor,
      ValuationAssessmentStatus.APPROVED_TO_LEGAL,
    );

  return {
    success: true,
    message:
      'Valuation accepted and case sent to Legal successfully.',
    data: {
      application: savedApplication,
      valuationAssessment,
    },
  };
}

  private async getApplicationOrFail(applicationId: number) {
    if (!applicationId) {
      throw new BadRequestException('applicationId is required.');
    }

    const application = await this.applicationsRepo.findOne({
      where: {
        id: applicationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found.');
    }

    return application;
  }

  private async getOrCreateAssessment(applicationId: number) {
    let assessment = await this.valuationRepo.findOne({
      where: {
        applicationId,
      },
    });

    if (!assessment) {
      assessment = this.valuationRepo.create({
        applicationId,
        assessmentStatus: ValuationAssessmentStatus.DRAFT,
      });

      assessment = await this.valuationRepo.save(assessment);
    }

    return assessment;
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
      return JSON.stringify(value || {});
    } catch {
      return '{}';
    }
  }

  private async saveAssessment(
    application: Application,
    body: any,
    actor: ActorLike,
    status: ValuationAssessmentStatus,
  ) {
    const applicationId = Number(application.id);

    const assessment = await this.getOrCreateAssessment(applicationId);

    const requestedLoan =
      body?.requestedLoan ||
      body?.requestedAmount ||
      application?.requestedAmount;

    const marketValue =
      body?.marketValue ||
      application?.marketValue ||
      application?.propertyValue;

    const recommendedValue =
      body?.recommendedValue ||
      body?.realisableValue ||
      marketValue;

    const indicativeLtv =
      body?.indicativeLtv ||
      this.calculateLtv(requestedLoan, marketValue);

    const ltvOnRecommendedValue =
      body?.ltvOnRecommendedValue ||
      this.calculateLtv(requestedLoan, recommendedValue);

    assessment.assessmentStatus = status;

    assessment.valuer = body?.valuer || assessment.valuer;
    assessment.visitDate = this.toDate(body?.visitDate) || assessment.visitDate;
    assessment.propertyArea = body?.propertyArea || assessment.propertyArea;
    assessment.occupancy = body?.occupancy || assessment.occupancy;
    assessment.constructionQuality =
      body?.constructionQuality || assessment.constructionQuality;
    assessment.residualLife = body?.residualLife || assessment.residualLife;
    assessment.marketability = body?.marketability || assessment.marketability;
    assessment.propertyRiskGrade =
      body?.propertyRiskGrade || assessment.propertyRiskGrade;

    assessment.marketValue =
      this.toDecimalString(marketValue) || assessment.marketValue;
    assessment.distressValue =
      this.toDecimalString(body?.distressValue) || assessment.distressValue;
    assessment.realisableValue =
      this.toDecimalString(body?.realisableValue) || assessment.realisableValue;
    assessment.recommendedValue =
      this.toDecimalString(recommendedValue) || assessment.recommendedValue;
    assessment.requestedLoan =
      this.toDecimalString(requestedLoan) || assessment.requestedLoan;
    assessment.indicativeLtv =
      this.toDecimalString(indicativeLtv) || assessment.indicativeLtv;
    assessment.ltvOnRecommendedValue =
      this.toDecimalString(ltvOnRecommendedValue) ||
      assessment.ltvOnRecommendedValue;

    assessment.valuationStatus =
      body?.valuationStatus || assessment.valuationStatus;
    assessment.technicalRemarks =
      body?.technicalRemarks || body?.remarks || assessment.technicalRemarks;
    assessment.queryRemarks =
      body?.queryRemarks || assessment.queryRemarks;
    assessment.negativeRemarks =
      body?.negativeRemarks || assessment.negativeRemarks;
    assessment.legalInstructions =
      body?.legalInstructions || assessment.legalInstructions;

    assessment.comparablesJson = this.toJson(body?.comparables || []);
    assessment.customerSnapshot = this.toJson({
      customerName: application?.customerName,
      mobile: application?.mobile,
      email: (application as any)?.email,
      pan: application?.pan,
      applicationNumber: application?.applicationNumber,
      requestedAmount: application?.requestedAmount,
      stage: application?.stage,
      status: application?.status,
    });

    assessment.propertySnapshot = this.toJson({
      propertyCategory: (application as any)?.propertyCategory,
      propertyType: (application as any)?.propertyType,
      propertyAddress: (application as any)?.propertyAddress,
      propertyCity: (application as any)?.propertyCity,
      propertyState: (application as any)?.propertyState,
      propertyPincode: (application as any)?.propertyPincode,
      marketValue: (application as any)?.marketValue,
    });

    assessment.valuationPayload = this.toJson(body);
    assessment.submittedBy = actor?.id ?? assessment.submittedBy;
    assessment.submittedAt = new Date();

    return this.valuationRepo.save(assessment);
  }

  private calculateLtv(loanAmount: any, propertyValue: any) {
    const loan = Number(loanAmount || 0);
    const property = Number(propertyValue || 0);

    if (!loan || !property) {
      return undefined;
    }

    return ((loan / property) * 100).toFixed(2);
  }
}
