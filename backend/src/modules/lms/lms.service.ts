import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoanAccount } from '../loan-accounts/entities/loan-account.entity';

@Injectable()
export class LmsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LoanAccount)
    private readonly loanAccountsRepository: Repository<LoanAccount>,
  ) {}

  async dashboard() {
    const [loanStats] = await this.dataSource.query(`
      SELECT
        COUNT(*) AS totalLoanAccounts,
        SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS activeLoans,
        SUM(CASE WHEN status = 'CLOSED' THEN 1 ELSE 0 END) AS closedLoans,
        COALESCE(SUM(sanctionedAmount), 0) AS disbursedAmount
      FROM loan_accounts
    `);

    const [repaymentStats] = await this.dataSource.query(`
      SELECT
        COALESCE(SUM(transfer_amount), 0) AS collectedAmount
      FROM repayments
    `).catch(() => [{ collectedAmount: 0 }]);

    return {
      success: true,
      data: {
        totalLoanAccounts: Number(loanStats?.totalLoanAccounts || 0),
        activeLoans: Number(loanStats?.activeLoans || 0),
        closedLoans: Number(loanStats?.closedLoans || 0),
        disbursedAmount: Number(loanStats?.disbursedAmount || 0),
        collectedAmount: Number(repaymentStats?.collectedAmount || 0),

        overdueCases: 0,
        pendingNach: 0,
        pendingUtr: 0,
      },
    };
  }

  async loanAccounts(query: any) {
    const page = this.positiveInteger(query?.page, 1);
    const limit = Math.min(this.positiveInteger(query?.limit, 20), 500);
    const search = String(query?.search || '').trim();
    const status = String(query?.status || '').trim().toUpperCase();
    const stage = String(query?.stage || '').trim().toUpperCase();

    const builder = this.loanAccountsRepository
      .createQueryBuilder('loan')
      .leftJoin('loan.partner', 'partner')
      .select([
        'loan.id',
        'loan.applicationId',
        'loan.partnerId',
        'loan.lan',
        'loan.applicationNumber',
        'loan.customerName',
        'loan.mobile',
        'loan.pan',
        'loan.requestedAmount',
        'loan.approvedAmount',
        'loan.sanctionedAmount',
        'loan.roi',
        'loan.tenureMonths',
        'loan.productType',
        'loan.loanStatus',
        'loan.stage',
        'loan.status',
        'loan.propertyAddress',
        'loan.propertyType',
        'loan.marketValue',
        'loan.valuationRecommendedValue',
        'loan.legalStatus',
        'loan.createdAt',
        'loan.updatedAt',
        'partner.id',
        'partner.name',
        'partner.code',
      ]);

    if (search) {
      builder.andWhere(
        `(loan.lan LIKE :search
          OR loan.applicationNumber LIKE :search
          OR loan.customerName LIKE :search
          OR loan.mobile LIKE :search
          OR loan.pan LIKE :search)`,
        { search: `%${search}%` },
      );
    }
    if (status && status !== 'ALL') {
      builder.andWhere('loan.status = :status', { status });
    }
    if (stage && stage !== 'ALL') {
      builder.andWhere('loan.stage = :stage', { stage });
    }

    const [rows, total] = await builder
      .orderBy('loan.createdAt', 'DESC')
      .addOrderBy('loan.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      success: true,
      data: rows.map((row) => ({
        ...row,
        id: Number(row.id),
        applicationId: Number(row.applicationId),
        partnerId: Number(row.partnerId),
        requestedAmount: this.numberOrNull(row.requestedAmount),
        approvedAmount: this.numberOrNull(row.approvedAmount),
        sanctionedAmount: this.numberOrNull(row.sanctionedAmount),
        roi: this.numberOrNull(row.roi),
        marketValue: this.numberOrNull(row.marketValue),
        valuationRecommendedValue: this.numberOrNull(row.valuationRecommendedValue),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
      filters: { search, status, stage },
    };
  }

  private positiveInteger(value: any, fallback: number) {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }

  private numberOrNull(value: any) {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
