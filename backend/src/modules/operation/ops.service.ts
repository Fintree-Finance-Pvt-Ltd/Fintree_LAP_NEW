
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { WorkflowTransitionService } from '../workflow/workflow-transition.service';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowTransitions: WorkflowTransitionService,
  ) {}

   async getOpsMakerCase(applicationId: number) {
  console.log(
    '[OPS MAKER] Fetching application:',
    applicationId,
  );

  try {
    const rows = await this.dataSource.query(
      `
        SELECT
          a.id AS applicationId,
          a.application_number AS applicationNumber,
          a.customer_name AS customerName,
          a.mobile AS mobile,
          a.pan AS pan,
          a.requested_amount AS requestedAmount,
          a.stage AS stage,
          a.status AS applicationStatus,
          a.assigned_to AS assignedTo,
          a.created_at AS createdAt,
          a.updated_at AS updatedAt,

           cp.id AS customerProfileId,
          cp.customer_type AS customerType,
          cp.first_name AS firstName,
          cp.middle_name AS middleName,
          cp.last_name AS lastName,
          cp.mobile AS profileMobile,
          cp.email AS email,
          cp.pan_number AS profilePanNumber,

          cp.property_category AS propertyCategory,
          cp.property_type AS propertyType,
          cp.property_address AS propertyAddress,
          cp.property_city AS propertyCity,
          cp.property_state AS propertyState,
          cp.property_pincode AS propertyPincode,

          cp.monthly_income AS monthlyIncome,
          cp.annual_income AS annualIncome,
          cp.bureau_score AS bureauScore,
          cp.bureau_status AS bureauStatus,

          cp.bank_name AS bankName,
          cp.account_number AS accountNumber,
          cp.ifsc AS ifsc,
          cp.branch_name AS bankBranchName,
          cp.average_balance AS averageBalance,

          cp.foir AS foir,
          cp.eligible_amount AS eligibleAmount,
          cp.roi AS roi,
          cp.tenure AS tenure,
          cp.emi AS emi,
          cp.recommended_amount AS recommendedAmount,
          cp.recommended_roi AS recommendedRoi,
          cp.recommended_tenure AS recommendedTenure


        FROM applications a
         LEFT JOIN customer_profiles cp
          ON cp.application_id = a.id
        WHERE a.id = ?
        LIMIT 1
      `,
      [applicationId],
    );

    console.log(
      '[OPS MAKER] Query result:',
      rows,
    );

    if (!rows.length) {
      throw new NotFoundException(
        `Application ${applicationId} was not found`,
      );
    }

    const row = rows[0];

       const profileCustomerName = [
  row.firstName,
  row.middleName,
  row.lastName,
]
  .map((value) => String(value ?? '').trim())
  .filter(Boolean)
  .join(' ');
    return {
      applicationId: Number(row.applicationId),

      customer: {
        profileId: row.customerProfileId
          ? Number(row.customerProfileId)
          : null,

        name:
          profileCustomerName ||
          row.customerName ||
          '',

        mobile:
          row.profileMobile ||
          row.mobile ||
          '',

        email: row.email ?? '',

        pan:
          row.profilePanNumber ||
          row.pan ||
          '',

        customerType:
          row.customerType ?? '',
      },

      application: {
        applicationNumber:
          row.applicationNumber ?? '',

        stage:
          row.stage ?? '',

        status:
          row.applicationStatus ?? '',

        product:
          'Loan Against Property',

        propertyCategory:
          row.propertyCategory ?? '',

        propertyType:
          row.propertyType ?? '',

        propertyAddress:
          row.propertyAddress ?? '',

        propertyCity:
          row.propertyCity ?? '',

        propertyState:
          row.propertyState ?? '',

        propertyPincode:
          row.propertyPincode ?? '',

        branch:
          row.propertyCity ?? '',

        loanPurpose: '',

        requestedAmount:
          this.toNumber(row.requestedAmount),
      },

      financialProfile: {
        monthlyIncome:
          this.toNumber(row.monthlyIncome),

        annualIncome:
          this.toNumber(row.annualIncome),

        bureauScore:
          row.bureauScore !== null &&
          row.bureauScore !== undefined
            ? Number(row.bureauScore)
            : null,

        bureauStatus:
          row.bureauStatus ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        foir:
          this.toNumber(row.foir),

        eligibleAmount:
          this.toNumber(row.eligibleAmount),
      },

      sanction: {
        sanctionedAmount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        sanctionDate: null,

        loanTenure:
          row.recommendedTenure ??
          row.tenure ??
          null,

        interestRate:
          this.toNumber(
            row.recommendedRoi ??
              row.roi,
          ),

        monthlyEmi:
          this.toNumber(row.emi),
      },

      disbursement: {
        instructionId: null,

        lan:
          'Pending booking',

        amount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        type:
          'Single Disbursement',

        beneficiaryName:
          profileCustomerName ||
          row.customerName ||
          '',

        bankName:
          row.bankName ?? '',

        accountNumber:
          this.maskAccountNumber(
            row.accountNumber,
          ),

        ifsc:
          row.ifsc ?? '',

        bankBranchName:
          row.bankBranchName ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        pennyDropMatch: null,

        disbursementDate: null,

        paymentStatus:
          'Pending Checker Approval',

        utrNumber:
          'Generated after bank success',

        idempotencyKey: '',
      },

      maker: {
        name: '',
        role: 'Operations Maker',
        submittedAt:
          row.updatedAt ?? null,
      },

      checklist: [],
      documents: [],
      charges: [],
    };
    // return {
    //   applicationId: Number(row.applicationId),

    //   customer: {
    //     name: row.customerName ?? '',
    //     mobile: row.mobile ?? '',
    //     pan: row.pan ?? '',
    //   },

    //   application: {
    //     applicationNumber:
    //       row.applicationNumber ?? '',
    //     stage: row.stage ?? '',
    //     status: row.applicationStatus ?? '',
    //     product: 'Loan Against Property',
    //     propertyType: '',
    //     branch: '',
    //     loanPurpose: '',
    //     requestedAmount: this.toNumber(
    //       row.requestedAmount,
    //     ),
    //   },

    //   sanction: {
    //     sanctionedAmount: null,
    //     sanctionDate: null,
    //     loanTenure: null,
    //     interestRate: null,
    //     monthlyEmi: null,
    //   },

    //   disbursement: {
    //     instructionId: null,
    //     lan: 'Pending booking',
    //     amount: null,
    //     type: '',
    //     beneficiaryName:
    //       row.customerName ?? '',
    //     bankName: '',
    //     accountNumber: '',
    //     ifsc: '',
    //     pennyDropMatch: null,
    //     disbursementDate: null,
    //     paymentStatus:
    //       'Pending Checker Approval',
    //     utrNumber:
    //       'Generated after bank success',
    //     idempotencyKey: '',
    //   },

    //   maker: {
    //     name: '',
    //     role: 'Operations Maker',
    //     submittedAt: null,
    //   },

    //   checklist: [],
    //   documents: [],
    //   charges: [],
    // };
  } catch (error) {
    console.error(
      '[OPS CHECKER] Database/service error:',
      error,
    );

    throw error;
  }
}

  async getOpsHeadCase(applicationId: number) {
  console.log(
    '[OPS HEAD] Fetching application:',
    applicationId,
  );

  try {
    const rows = await this.dataSource.query(
      `
        SELECT
          a.id AS applicationId,
          a.application_number AS applicationNumber,
          a.customer_name AS customerName,
          a.mobile AS mobile,
          a.pan AS pan,
          a.requested_amount AS requestedAmount,
          a.stage AS stage,
          a.status AS applicationStatus,
          a.assigned_to AS assignedTo,
          a.created_at AS createdAt,
          a.updated_at AS updatedAt,

           cp.id AS customerProfileId,
          cp.customer_type AS customerType,
          cp.first_name AS firstName,
          cp.middle_name AS middleName,
          cp.last_name AS lastName,
          cp.mobile AS profileMobile,
          cp.email AS email,
          cp.pan_number AS profilePanNumber,

          cp.property_category AS propertyCategory,
          cp.property_type AS propertyType,
          cp.property_address AS propertyAddress,
          cp.property_city AS propertyCity,
          cp.property_state AS propertyState,
          cp.property_pincode AS propertyPincode,

          cp.monthly_income AS monthlyIncome,
          cp.annual_income AS annualIncome,
          cp.bureau_score AS bureauScore,
          cp.bureau_status AS bureauStatus,

          cp.bank_name AS bankName,
          cp.account_number AS accountNumber,
          cp.ifsc AS ifsc,
          cp.branch_name AS bankBranchName,
          cp.average_balance AS averageBalance,

          cp.foir AS foir,
          cp.eligible_amount AS eligibleAmount,
          cp.roi AS roi,
          cp.tenure AS tenure,
          cp.emi AS emi,
          cp.recommended_amount AS recommendedAmount,
          cp.recommended_roi AS recommendedRoi,
          cp.recommended_tenure AS recommendedTenure


        FROM applications a
         LEFT JOIN customer_profiles cp
          ON cp.application_id = a.id
        WHERE a.id = ?
        LIMIT 1
      `,
      [applicationId],
    );

    console.log(
      '[OPS CHECKER] Query result:',
      rows,
    );

    if (!rows.length) {
      throw new NotFoundException(
        `Application ${applicationId} was not found`,
      );
    }

    const row = rows[0];
       const profileCustomerName = [
  row.firstName,
  row.middleName,
  row.lastName,
]
  .map((value) => String(value ?? '').trim())
  .filter(Boolean)
  .join(' ');
    return {
      applicationId: Number(row.applicationId),

      customer: {
        profileId: row.customerProfileId
          ? Number(row.customerProfileId)
          : null,

        name:
          profileCustomerName ||
          row.customerName ||
          '',

        mobile:
          row.profileMobile ||
          row.mobile ||
          '',

        email: row.email ?? '',

        pan:
          row.profilePanNumber ||
          row.pan ||
          '',

        customerType:
          row.customerType ?? '',
      },

      application: {
        applicationNumber:
          row.applicationNumber ?? '',

        stage:
          row.stage ?? '',

        status:
          row.applicationStatus ?? '',

        product:
          'Loan Against Property',

        propertyCategory:
          row.propertyCategory ?? '',

        propertyType:
          row.propertyType ?? '',

        propertyAddress:
          row.propertyAddress ?? '',

        propertyCity:
          row.propertyCity ?? '',

        propertyState:
          row.propertyState ?? '',

        propertyPincode:
          row.propertyPincode ?? '',

        branch:
          row.propertyCity ?? '',

        loanPurpose: '',

        requestedAmount:
          this.toNumber(row.requestedAmount),
      },

      financialProfile: {
        monthlyIncome:
          this.toNumber(row.monthlyIncome),

        annualIncome:
          this.toNumber(row.annualIncome),

        bureauScore:
          row.bureauScore !== null &&
          row.bureauScore !== undefined
            ? Number(row.bureauScore)
            : null,

        bureauStatus:
          row.bureauStatus ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        foir:
          this.toNumber(row.foir),

        eligibleAmount:
          this.toNumber(row.eligibleAmount),
      },

      sanction: {
        sanctionedAmount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        sanctionDate: null,

        loanTenure:
          row.recommendedTenure ??
          row.tenure ??
          null,

        interestRate:
          this.toNumber(
            row.recommendedRoi ??
              row.roi,
          ),

        monthlyEmi:
          this.toNumber(row.emi),
      },

      disbursement: {
        instructionId: null,

        lan:
          'Pending booking',

        amount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        type:
          'Single Disbursement',

        beneficiaryName:
          profileCustomerName ||
          row.customerName ||
          '',

        bankName:
          row.bankName ?? '',

        accountNumber:
          this.maskAccountNumber(
            row.accountNumber,
          ),

        ifsc:
          row.ifsc ?? '',

        bankBranchName:
          row.bankBranchName ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        pennyDropMatch: null,

        disbursementDate: null,

        paymentStatus:
          'Pending Checker Approval',

        utrNumber:
          'Generated after bank success',

        idempotencyKey: '',
      },

      maker: {
        name: '',
        role: 'Operations Maker',
        submittedAt:
          row.updatedAt ?? null,
      },

      checklist: [],
      documents: [],
      charges: [],
    };
    // return {
    //   applicationId: Number(row.applicationId),

    //   customer: {
    //     name: row.customerName ?? '',
    //     mobile: row.mobile ?? '',
    //     pan: row.pan ?? '',
    //   },

    //   application: {
    //     applicationNumber:
    //       row.applicationNumber ?? '',
    //     stage: row.stage ?? '',
    //     status: row.applicationStatus ?? '',
    //     product: 'Loan Against Property',
    //     propertyType: '',
    //     branch: '',
    //     loanPurpose: '',
    //     requestedAmount: this.toNumber(
    //       row.requestedAmount,
    //     ),
    //   },

    //   sanction: {
    //     sanctionedAmount: null,
    //     sanctionDate: null,
    //     loanTenure: null,
    //     interestRate: null,
    //     monthlyEmi: null,
    //   },

    //   disbursement: {
    //     instructionId: null,
    //     lan: 'Pending booking',
    //     amount: null,
    //     type: '',
    //     beneficiaryName:
    //       row.customerName ?? '',
    //     bankName: '',
    //     accountNumber: '',
    //     ifsc: '',
    //     pennyDropMatch: null,
    //     disbursementDate: null,
    //     paymentStatus:
    //       'Pending Checker Approval',
    //     utrNumber:
    //       'Generated after bank success',
    //     idempotencyKey: '',
    //   },

    //   maker: {
    //     name: '',
    //     role: 'Operations Maker',
    //     submittedAt: null,
    //   },

    //   checklist: [],
    //   documents: [],
    //   charges: [],
    // };
  } catch (error) {
    console.error(
      '[OPS CHECKER] Database/service error:',
      error,
    );

    throw error;
  }
}
async getCheckerCase(applicationId: number) {
  console.log(
    '[OPS CHECKER] Fetching application:',
    applicationId,
  );

  try {
    const rows = await this.dataSource.query(
      `
        SELECT
          a.id AS applicationId,
          a.application_number AS applicationNumber,
          a.customer_name AS customerName,
          a.mobile AS mobile,
          a.pan AS pan,
          a.requested_amount AS requestedAmount,
          a.stage AS stage,
          a.status AS applicationStatus,
          a.assigned_to AS assignedTo,
          a.created_at AS createdAt,
          a.updated_at AS updatedAt,

           cp.id AS customerProfileId,
          cp.customer_type AS customerType,
          cp.first_name AS firstName,
          cp.middle_name AS middleName,
          cp.last_name AS lastName,
          cp.mobile AS profileMobile,
          cp.email AS email,
          cp.pan_number AS profilePanNumber,

          cp.property_category AS propertyCategory,
          cp.property_type AS propertyType,
          cp.property_address AS propertyAddress,
          cp.property_city AS propertyCity,
          cp.property_state AS propertyState,
          cp.property_pincode AS propertyPincode,

          cp.monthly_income AS monthlyIncome,
          cp.annual_income AS annualIncome,
          cp.bureau_score AS bureauScore,
          cp.bureau_status AS bureauStatus,

          cp.bank_name AS bankName,
          cp.account_number AS accountNumber,
          cp.ifsc AS ifsc,
          cp.branch_name AS bankBranchName,
          cp.average_balance AS averageBalance,

          cp.foir AS foir,
          cp.eligible_amount AS eligibleAmount,
          cp.roi AS roi,
          cp.tenure AS tenure,
          cp.emi AS emi,
          cp.recommended_amount AS recommendedAmount,
          cp.recommended_roi AS recommendedRoi,
          cp.recommended_tenure AS recommendedTenure


        FROM applications a
          LEFT JOIN customer_profiles cp
          ON cp.application_id = a.id
        WHERE a.id = ?
        LIMIT 1
      `,
      [applicationId],
    );

    console.log(
      '[OPS CHECKER] Query result:',
      rows,
    );

    if (!rows.length) {
      throw new NotFoundException(
        `Application ${applicationId} was not found`,
      );
    }

    const row = rows[0];
    const profileCustomerName = [
  row.firstName,
  row.middleName,
  row.lastName,
]
  .map((value) => String(value ?? '').trim())
  .filter(Boolean)
  .join(' ');
    return {
      applicationId: Number(row.applicationId),

      customer: {
        profileId: row.customerProfileId
          ? Number(row.customerProfileId)
          : null,

        name:
          profileCustomerName ||
          row.customerName ||
          '',

        mobile:
          row.profileMobile ||
          row.mobile ||
          '',

        email: row.email ?? '',

        pan:
          row.profilePanNumber ||
          row.pan ||
          '',

        customerType:
          row.customerType ?? '',
      },

      application: {
        applicationNumber:
          row.applicationNumber ?? '',

        stage:
          row.stage ?? '',

        status:
          row.applicationStatus ?? '',

        product:
          'Loan Against Property',

        propertyCategory:
          row.propertyCategory ?? '',

        propertyType:
          row.propertyType ?? '',

        propertyAddress:
          row.propertyAddress ?? '',

        propertyCity:
          row.propertyCity ?? '',

        propertyState:
          row.propertyState ?? '',

        propertyPincode:
          row.propertyPincode ?? '',

        branch:
          row.propertyCity ?? '',

        loanPurpose: '',

        requestedAmount:
          this.toNumber(row.requestedAmount),
      },

      financialProfile: {
        monthlyIncome:
          this.toNumber(row.monthlyIncome),

        annualIncome:
          this.toNumber(row.annualIncome),

        bureauScore:
          row.bureauScore !== null &&
          row.bureauScore !== undefined
            ? Number(row.bureauScore)
            : null,

        bureauStatus:
          row.bureauStatus ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        foir:
          this.toNumber(row.foir),

        eligibleAmount:
          this.toNumber(row.eligibleAmount),
      },

      sanction: {
        sanctionedAmount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        sanctionDate: null,

        loanTenure:
          row.recommendedTenure ??
          row.tenure ??
          null,

        interestRate:
          this.toNumber(
            row.recommendedRoi ??
              row.roi,
          ),

        monthlyEmi:
          this.toNumber(row.emi),
      },

      disbursement: {
        instructionId: null,

        lan:
          'Pending booking',

        amount:
          this.toNumber(
            row.recommendedAmount ??
              row.eligibleAmount,
          ),

        type:
          'Single Disbursement',

        beneficiaryName:
          profileCustomerName ||
          row.customerName ||
          '',

        bankName:
          row.bankName ?? '',

        accountNumber:
          this.maskAccountNumber(
            row.accountNumber,
          ),

        ifsc:
          row.ifsc ?? '',

        bankBranchName:
          row.bankBranchName ?? '',

        averageBalance:
          this.toNumber(row.averageBalance),

        pennyDropMatch: null,

        disbursementDate: null,

        paymentStatus:
          'Pending Checker Approval',

        utrNumber:
          'Generated after bank success',

        idempotencyKey: '',
      },

      maker: {
        name: '',
        role: 'Operations Maker',
        submittedAt:
          row.updatedAt ?? null,
      },

      checklist: [],
      documents: [],
      charges: [],
    };

    // return {
    //   applicationId: Number(row.applicationId),

    //   customer: {
    //     name: row.customerName ?? '',
    //     mobile: row.mobile ?? '',
    //     pan: row.pan ?? '',
    //   },

    //   application: {
    //     applicationNumber:
    //       row.applicationNumber ?? '',
    //     stage: row.stage ?? '',
    //     status: row.applicationStatus ?? '',
    //     product: 'Loan Against Property',
    //     propertyType: '',
    //     branch: '',
    //     loanPurpose: '',
    //     requestedAmount: this.toNumber(
    //       row.requestedAmount,
    //     ),
    //   },

    //   sanction: {
    //     sanctionedAmount: null,
    //     sanctionDate: null,
    //     loanTenure: null,
    //     interestRate: null,
    //     monthlyEmi: null,
    //   },

    //   disbursement: {
    //     instructionId: null,
    //     lan: 'Pending booking',
    //     amount: null,
    //     type: '',
    //     beneficiaryName:
    //       row.customerName ?? '',
    //     bankName: '',
    //     accountNumber: '',
    //     ifsc: '',
    //     pennyDropMatch: null,
    //     disbursementDate: null,
    //     paymentStatus:
    //       'Pending Checker Approval',
    //     utrNumber:
    //       'Generated after bank success',
    //     idempotencyKey: '',
    //   },

    //   maker: {
    //     name: '',
    //     role: 'Operations Maker',
    //     submittedAt: null,
    //   },

    //   checklist: [],
    //   documents: [],
    //   charges: [],
    // };
  } catch (error) {
    console.error(
      '[OPS CHECKER] Database/service error:',
      error,
    );

    throw error;
  }
}

// private toNumber(value: unknown): number | null {
//   if (
//     value === null ||
//     value === undefined ||
//     value === ''
//   ) {
//     return null;
//   }

//   const parsed = Number(value);

//   return Number.isFinite(parsed)
//     ? parsed
//     : null;
// }

private toNumber(
  value: unknown,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

private maskAccountNumber(
  accountNumber: unknown,
): string {
  if (
    accountNumber === null ||
    accountNumber === undefined
  ) {
    return '';
  }

  const normalized =
    String(accountNumber).trim();

  if (!normalized) {
    return '';
  }

  if (normalized.length <= 4) {
    return normalized;
  }

  return `${'X'.repeat(
    normalized.length - 4,
  )}${normalized.slice(-4)}`;
}
 async getSubmittedToOpsCheckerCases(
   user: Record<string, any>,
 ) {
    try {
       const roleCode =
        this.getUserRoleCode(user);

      let requiredStatus: string;
      let requiredStage: string;

      switch (roleCode) {
        case 'OPS_HEAD':
          requiredStatus =
            'OPS_HEAD_PENDING';
          requiredStage = 'OPS_HEAD';
          break;

        case 'OPS_CHECKER':
          requiredStatus =
            'OPS_CHECKER_PENDING';
          requiredStage = 'OPS_CHECKER';
          break;
        case 'OPS_MAKER':
          requiredStatus =
            'OPS_MAKER_PENDING';
          requiredStage = 'OPS_MAKER';
          break;
        default:
          throw new ForbiddenException(
            'You are not authorized to access the Operations review queue.',
          );
      }

      const rows =
        await this.dataSource.query(`
          SELECT
            a.id,
            a.application_number AS applicationNumber,
            a.customer_name AS customerName,
            a.mobile AS mobileNumber,
            a.pan AS panNumber,
            a.requested_amount AS requestedAmount,
            a.stage,
            a.status,
            a.version,
            a.assigned_to AS assignedTo,
            a.created_at AS createdAt,
            a.updated_at AS updatedAt
          FROM applications a
          WHERE
           a.stage = ?
              AND a.status = ?
          ORDER BY a.updated_at DESC
        `,
         [
            requiredStage,
            requiredStatus,
          ],
        );

      return rows.map(
        (row: Record<string, any>) => ({
          id: Number(row.id),

          applicationNumber:
            row.applicationNumber,

          customerName:
            row.customerName,

          mobileNumber:
            row.mobileNumber,

          panNumber:
            row.panNumber,

          requestedAmount: Number(
            row.requestedAmount ?? 0,
          ),

          stage: row.stage,

          status: row.status,

          version: Number(
            row.version ?? 0,
          ),

          assignedTo:
            row.assignedTo !== null
              ? Number(row.assignedTo)
              : null,

          createdAt:
            row.createdAt,

          updatedAt:
            row.updatedAt,
        }),
      );
    } catch (error) {
      this.logger.error(
        "Unable to fetch ops review queue",
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw new InternalServerErrorException(
        "Unable to fetch ops review queue.",
      );
    }
  }

  private getUserRoleCode(
  user: Record<string, any>,
): string {
  const arrayRole =
    Array.isArray(user?.roles) &&
    user.roles.length > 0
      ? user.roles[0]?.code ??
        user.roles[0]?.name ??
        user.roles[0]
      : null;

  const possibleRole =
    arrayRole ??
    user?.role?.code ??
    user?.role?.name ??
    user?.roleCode ??
    user?.roleName ??
    user?.role ??
    '';

  return String(possibleRole)
    .trim()
    .toUpperCase()
    .replaceAll(' ', '_')
    .replaceAll('-', '_');
}

async approveByOpsMaker(
  applicationId: number,
  user: Record<string, any>,
) {
  return this.workflowTransitions.move({
    applicationId,
    action: 'OPS_MAKER_APPROVE_TO_OPS_HEAD',
    remarks: 'Approved by Operations Maker.',
    actor: user,
  });
}


async approveByOpsHead(
  applicationId: number,
  user: Record<string, any>,
) {
  return this.workflowTransitions.move({
    applicationId,
    action: 'OPS_HEAD_APPROVE_TO_OPS_CHECKER',
    remarks: 'Approved by Operations Head.',
    actor: user,
  });
}


async approveByOpsChecker(
  applicationId: number,
  user: Record<string, any>,
) {
  return this.workflowTransitions.move({
    applicationId,
    action: 'OPS_CHECKER_APPROVE_TO_DISBURSEMENT',
    remarks: 'Approved by Operations Checker.',
    actor: user,
  });
}
}
