import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class FieldVisitsService {
  private readonly completionAction = 'CUSTOMER_VISIT_DONE';

  constructor(private readonly dataSource: DataSource) {}

  async completeVisit(
    applicationId: number,
    body: Record<string, unknown>,
    createdBy: number | string | null = null,
  ) {
    const action = String(body?.action ?? this.completionAction)
      .trim()
      .toUpperCase();

    if (action !== this.completionAction) {
      throw new BadRequestException(
        `Only ${this.completionAction} is supported by this endpoint`,
      );
    }

    const remarks = this.normaliseRemarks(body?.remarks);
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const applications = await queryRunner.query(
        `SELECT id
           FROM applications
          WHERE id = ?
          LIMIT 1
          FOR UPDATE`,
        [applicationId],
      );

      if (!applications.length) {
        throw new NotFoundException(
          `Application ${applicationId} was not found`,
        );
      }

      // Make the operation idempotent. Repeated button clicks will not create
      // duplicate completion records.
      const existingLogs = await queryRunner.query(
        `SELECT id, application_id, action, remarks, created_by, created_at
           FROM workflow_logs
          WHERE application_id = ?
            AND action = ?
          ORDER BY id DESC
          LIMIT 1`,
        [applicationId, this.completionAction],
      );

      if (existingLogs.length) {
        await queryRunner.commitTransaction();

        return {
          alreadyCompleted: true,
          visitCompleted: true,
          log: existingLogs[0],
        };
      }

      const insertResult = await queryRunner.query(
        `INSERT INTO workflow_logs
          (application_id, action, remarks, created_by, created_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP(6))`,
        [
          applicationId,
          this.completionAction,
          remarks,
          this.normaliseCreatedBy(createdBy),
        ],
      );

      const insertedLogs = await queryRunner.query(
        `SELECT id, application_id, action, remarks, created_by, created_at
           FROM workflow_logs
          WHERE id = ?
          LIMIT 1`,
        [insertResult.insertId],
      );

      await queryRunner.commitTransaction();

      return {
        alreadyCompleted: false,
        visitCompleted: true,
        log: insertedLogs[0],
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async getVisitStatus(applicationId: number) {
    await this.ensureApplicationExists(applicationId);

    const rows = await this.dataSource.query(
      `SELECT id, application_id, action, remarks, created_by, created_at
         FROM workflow_logs
        WHERE application_id = ?
          AND action = ?
        ORDER BY id DESC
        LIMIT 1`,
      [applicationId, this.completionAction],
    );

    return {
      applicationId,
      visitCompleted: rows.length > 0,
      completionLog: rows[0] ?? null,
    };
  }

  async getVisitHistory(applicationId: number) {
    await this.ensureApplicationExists(applicationId);

    return this.dataSource.query(
      `SELECT id, application_id, action, remarks, created_by, created_at
         FROM workflow_logs
        WHERE application_id = ?
          AND action IN ('CUSTOMER_VISIT_DRAFT', 'CUSTOMER_VISIT_DONE')
        ORDER BY created_at DESC, id DESC`,
      [applicationId],
    );
  }

  private async ensureApplicationExists(applicationId: number) {
    const rows = await this.dataSource.query(
      `SELECT id FROM applications WHERE id = ? LIMIT 1`,
      [applicationId],
    );

    if (!rows.length) {
      throw new NotFoundException(
        `Application ${applicationId} was not found`,
      );
    }
  }

  private normaliseCreatedBy(
    value: number | string | null,
  ): number | string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const userId = String(value).trim();
    return /^\d+$/.test(userId) ? userId : null;
  }

  private normaliseRemarks(value: unknown): string {
    if (value === undefined || value === null || String(value).trim() === '') {
      return 'Customer visit completed';
    }

    const remarks = String(value).trim();

    if (remarks.length > 5000) {
      throw new BadRequestException('Remarks cannot exceed 5000 characters');
    }

    return remarks;
  }
}
