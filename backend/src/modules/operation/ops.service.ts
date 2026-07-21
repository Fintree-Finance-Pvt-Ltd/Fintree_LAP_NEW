
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private readonly dataSource: DataSource,
  ) {}

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
          a.updated_at AS updatedAt
        FROM applications a
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

    return {
      applicationId: Number(row.applicationId),

      customer: {
        name: row.customerName ?? '',
        mobile: row.mobile ?? '',
        pan: row.pan ?? '',
      },

      application: {
        applicationNumber:
          row.applicationNumber ?? '',
        stage: row.stage ?? '',
        status: row.applicationStatus ?? '',
        product: 'Loan Against Property',
        propertyType: '',
        branch: '',
        loanPurpose: '',
        requestedAmount: this.toNumber(
          row.requestedAmount,
        ),
      },

      sanction: {
        sanctionedAmount: null,
        sanctionDate: null,
        loanTenure: null,
        interestRate: null,
        monthlyEmi: null,
      },

      disbursement: {
        instructionId: null,
        lan: 'Pending booking',
        amount: null,
        type: '',
        beneficiaryName:
          row.customerName ?? '',
        bankName: '',
        accountNumber: '',
        ifsc: '',
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
        submittedAt: null,
      },

      checklist: [],
      documents: [],
      charges: [],
    };
  } catch (error) {
    console.error(
      '[OPS CHECKER] Database/service error:',
      error,
    );

    throw error;
  }
}

private toNumber(value: unknown): number | null {
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

 async getSubmittedToOpsCheckerCases() {
    try {
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
            a.stage = 'OPERATION'
            AND a.status = 'OPS_MAKER_APPROVED'
          ORDER BY a.updated_at DESC
        `);

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

}