
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

@Injectable()
export class OpsService {
  private readonly logger = new Logger(OpsService.name);

  constructor(
    private readonly dataSource: DataSource,
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
          a.updated_at AS updatedAt
        FROM applications a
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

 async getSubmittedToOpsCheckerCases(
   user: Record<string, any>,
 ) {
    try {
       const roleCode =
        this.getUserRoleCode(user);

      let requiredStatus: string;

      switch (roleCode) {
        case 'OPS_HEAD':
          requiredStatus =
            'OPS_MAKER_APPROVED';
          break;

        case 'OPS_CHECKER':
          requiredStatus =
            'OPS_HEAD_APPROVED';
          break;
        case 'OPS_MAKER':
          requiredStatus =
            'LEGAL_APPROVED';
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
            'OPERATIONS',
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
  userId: number,
) {
  try {
    return await this.dataSource.transaction(
      async (manager) => {
        const rows = await manager.query(
          `
            SELECT
              id,
              application_number AS applicationNumber,
              stage,
              status,
              version
            FROM applications
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [applicationId],
        );

        if (!rows.length) {
          throw new NotFoundException(
            `Application ${applicationId} was not found`,
          );
        }

        const application = rows[0];

        const currentStatus = String(
          application.status ?? '',
        )
          .trim()
          .toUpperCase();

        if (currentStatus !== 'OPS_MAKER_APPROVED') {
          throw new BadRequestException(
            `Application cannot be approved by Operations Maker because its current status is ${currentStatus || 'UNKNOWN'}. Expected status is LEGAL_APPROVED.`,
          );
        }

        const updateResult = await manager.query(
          `
            UPDATE applications
            SET
              stage = 'OPS_HEAD',
              status = 'OPS_MAKER_APPROVED',
              version = COALESCE(version, 0) + 1,
              updated_by = ?,
              updated_at = NOW()
            WHERE
              id = ?
              AND UPPER(TRIM(status)) = 'OPS_MAKER_APPROVED'
          `,
          [
            userId,
            applicationId,
          ],
        );

        if (
          !updateResult ||
          Number(updateResult.affectedRows ?? 0) !== 1
        ) {
          throw new ConflictException(
            'The application was modified by another user. Refresh the case and try again.',
          );
        }

        return {
          applicationId,
          applicationNumber:
            application.applicationNumber,
          previousStage:
            application.stage,
          previousStatus:
            application.status,
          stage: 'OPERATIONS',
          status: 'OPS_MAKER_APPROVED',
          version:
            Number(application.version ?? 0) + 1,
          approvedBy: userId,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    this.logger.error(
      `Unable to approve application ${applicationId} by Operations Maker`,
      error instanceof Error
        ? error.stack
        : String(error),
    );

    throw new InternalServerErrorException(
      'Unable to approve the application.',
    );
  }
}


async approveByOpsHead(
  applicationId: number,
  userId: number,
) {
  try {
    return await this.dataSource.transaction(
      async (manager) => {
        const rows = await manager.query(
          `
            SELECT
              id,
              application_number AS applicationNumber,
              stage,
              status,
              version
            FROM applications
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [applicationId],
        );

        if (!rows.length) {
          throw new NotFoundException(
            `Application ${applicationId} was not found`,
          );
        }

        const application = rows[0];

        const currentStatus = String(
          application.status ?? '',
        )
          .trim()
          .toUpperCase();

        if (currentStatus !== 'OPS_MAKER_APPROVED') {
          throw new BadRequestException(
            `Application cannot be approved by Operations Maker because its current status is ${currentStatus || 'UNKNOWN'}. Expected status is LEGAL_APPROVED.`,
          );
        }

        const updateResult = await manager.query(
          `
            UPDATE applications
            SET
              stage = 'OPERATIONS',
              status = 'DISBURSED',
              version = COALESCE(version, 0) + 1,
              updated_by = ?,
              updated_at = NOW()
            WHERE
              id = ?
              AND UPPER(TRIM(status)) = 'OPS_MAKER_APPROVED'
          `,
          [
            userId,
            applicationId,
          ],
        );

        if (
          !updateResult ||
          Number(updateResult.affectedRows ?? 0) !== 1
        ) {
          throw new ConflictException(
            'The application was modified by another user. Refresh the case and try again.',
          );
        }

        return {
          applicationId,
          applicationNumber:
            application.applicationNumber,
          previousStage:
            application.stage,
          previousStatus:
            application.status,
          stage: 'OPERATIONS',
          status: 'OPS_HEAD_APPROVED',
          version:
            Number(application.version ?? 0) + 1,
          approvedBy: userId,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    this.logger.error(
      `Unable to approve application ${applicationId} by Operations Maker`,
      error instanceof Error
        ? error.stack
        : String(error),
    );

    throw new InternalServerErrorException(
      'Unable to approve the application.',
    );
  }
}


async approveByOpsChecker(
  applicationId: number,
  userId: number,
) {
  try {
    return await this.dataSource.transaction(
      async (manager) => {
        const rows = await manager.query(
          `
            SELECT
              id,
              application_number AS applicationNumber,
              stage,
              status,
              version
            FROM applications
            WHERE id = ?
            LIMIT 1
            FOR UPDATE
          `,
          [applicationId],
        );

        if (!rows.length) {
          throw new NotFoundException(
            `Application ${applicationId} was not found`,
          );
        }

        const application = rows[0];

        const currentStatus = String(
          application.status ?? '',
        )
          .trim()
          .toUpperCase();

        if (currentStatus !== 'OPS_HEAD_APPROVED') {
          throw new BadRequestException(
            `Application cannot be approved by Operations head because its current status is ${currentStatus || 'UNKNOWN'}. Expected status is ops_maker_APPROVED.`,
          );
        }

        const updateResult = await manager.query(
          `
            UPDATE applications
            SET
              stage = 'OPERATIONS',
              status = 'OPS_CHECKER_APPROVED',
              version = COALESCE(version, 0) + 1,
              updated_by = ?,
              updated_at = NOW()
            WHERE
              id = ?
              AND UPPER(TRIM(status)) = 'OPS_HEAD_APPROVED'
          `,
          [
            userId,
            applicationId,
          ],
        );

        if (
          !updateResult ||
          Number(updateResult.affectedRows ?? 0) !== 1
        ) {
          throw new ConflictException(
            'The application was modified by another user. Refresh the case and try again.',
          );
        }

        return {
          applicationId,
          applicationNumber:
            application.applicationNumber,
          previousStage:
            application.stage,
          previousStatus:
            application.status,
          stage: 'OPERATIONS',
          status: 'OPS_CHECKER_APPROVED',
          version:
            Number(application.version ?? 0) + 1,
          approvedBy: userId,
        };
      },
    );
  } catch (error) {
    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException ||
      error instanceof ConflictException
    ) {
      throw error;
    }

    this.logger.error(
      `Unable to approve application ${applicationId} by Operations Checker`,
      error instanceof Error
        ? error.stack
        : String(error),
    );

    throw new InternalServerErrorException(
      'Unable to approve the application.',
    );
  }
}
}