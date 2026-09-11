import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import {
  ApproveClaimDto,
  BulkApproveClaimsDto,
  BulkRejectClaimsDto,
  CreateClaimDto,
  QueryClaimsDto,
  RejectClaimDto,
  UpdatePaymentStatusDto,
} from './dto/claims.dto';
import {
  ClaimCategory,
  ClaimStatus,
  PaymentStatus,
  LapClaim,
} from './entities/lap-claim.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClaimsService implements OnModuleInit {
  private readonly logger = new Logger(ClaimsService.name);

  constructor(
    @InjectRepository(LapClaim)
    private readonly claimRepo: Repository<LapClaim>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS \`lap_claims\` (
          \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
          \`claim_number\` varchar(50) NOT NULL,
          \`user_id\` bigint unsigned NOT NULL,
          \`category\` varchar(50) NOT NULL DEFAULT 'OTHER',
          \`title\` varchar(255) NOT NULL,
          \`amount\` decimal(12,2) NOT NULL,
          \`tax_amount\` decimal(12,2) NOT NULL DEFAULT '0.00',
          \`expense_date\` varchar(10) NOT NULL,
          \`merchant_name\` varchar(255) DEFAULT NULL,
          \`invoice_number\` varchar(100) DEFAULT NULL,
          \`gst_number\` varchar(30) DEFAULT NULL,
          \`description\` text DEFAULT NULL,
          \`receipt_url\` varchar(500) DEFAULT NULL,
          \`receipt_original_name\` varchar(255) DEFAULT NULL,
          \`receipt_mime_type\` varchar(100) DEFAULT NULL,
          \`receipt_size\` int DEFAULT NULL,
          \`ocr_raw_text\` longtext DEFAULT NULL,
          \`status\` varchar(30) NOT NULL DEFAULT 'PENDING',
          \`admin_remarks\` text DEFAULT NULL,
          \`approved_by\` bigint unsigned DEFAULT NULL,
          \`approved_at\` datetime(6) DEFAULT NULL,
          \`rejected_by\` bigint unsigned DEFAULT NULL,
          \`rejected_at\` datetime(6) DEFAULT NULL,
          \`payment_status\` varchar(30) NOT NULL DEFAULT 'UNPAID',
          \`payment_date\` varchar(10) DEFAULT NULL,
          \`payment_reference\` varchar(100) DEFAULT NULL,
          \`created_by\` bigint unsigned DEFAULT NULL,
          \`updated_by\` bigint unsigned DEFAULT NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uniq_lap_claims_claim_number\` (\`claim_number\`),
          KEY \`idx_lap_claims_user_id\` (\`user_id\`),
          KEY \`idx_lap_claims_status\` (\`status\`),
          KEY \`idx_lap_claims_category\` (\`category\`),
          KEY \`idx_lap_claims_expense_date\` (\`expense_date\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this.logger.log('✅ Table `lap_claims` initialized / verified successfully.');
    } catch (err: any) {
      this.logger.error(`Failed to verify or create lap_claims table: ${err?.message}`);
    }
  }

  /**
   * Helper to generate unique claim number CLM-YYYY-XXXX
   */
  private async generateClaimNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CLM-${year}-`;
    const count = await this.claimRepo.count();
    const sequence = String(count + 1).padStart(4, '0');
    let candidate = `${prefix}${sequence}`;

    const exists = await this.claimRepo.findOne({ where: { claimNumber: candidate } });
    if (exists) {
      candidate = `${prefix}${Date.now().toString().slice(-6)}`;
    }
    return candidate;
  }

  /**
   * Apply / Submit a new expense claim
   */
  async createClaim(
    userId: number,
    dto: CreateClaimDto,
  ): Promise<{ success: boolean; data: LapClaim; message: string }> {
    const claimNumber = await this.generateClaimNumber();

    const claim = this.claimRepo.create({
      ...dto,
      claimNumber,
      userId,
      status: ClaimStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      createdBy: userId,
    });

    const saved = await this.claimRepo.save(claim);
    return {
      success: true,
      data: saved,
      message: `Claim ${claimNumber} submitted successfully. Pending admin approval.`,
    };
  }

  /**
   * Get claims submitted by the logged-in user
   */
  async getMyClaims(
    userId: number,
    query: QueryClaimsDto,
  ): Promise<{ success: boolean; data: LapClaim[]; total: number }> {
    const qb = this.claimRepo
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.user', 'user')
      .where('claim.userId = :userId', { userId })
      .orderBy('claim.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('claim.status = :status', { status: query.status });
    }

    if (query.category) {
      qb.andWhere('claim.category = :category', { category: query.category });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('claim.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(claim.title LIKE :search OR claim.claimNumber LIKE :search OR claim.merchantName LIKE :search OR claim.invoiceNumber LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 50));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      success: true,
      data,
      total,
    };
  }

  /**
   * Admin: View all claims across all users with filters and user details
   */
  async getAllClaims(
    query: QueryClaimsDto,
  ): Promise<{ success: boolean; data: LapClaim[]; total: number }> {
    const qb = this.claimRepo
      .createQueryBuilder('claim')
      .leftJoinAndSelect('claim.user', 'user')
      .orderBy('claim.createdAt', 'DESC');

    if (query.status) {
      qb.andWhere('claim.status = :status', { status: query.status });
    }

    if (query.paymentStatus) {
      qb.andWhere('claim.paymentStatus = :paymentStatus', {
        paymentStatus: query.paymentStatus,
      });
    }

    if (query.category) {
      qb.andWhere('claim.category = :category', { category: query.category });
    }

    if (query.userId && !isNaN(parseInt(query.userId, 10))) {
      qb.andWhere('claim.userId = :uid', { uid: parseInt(query.userId, 10) });
    }

    if (query.startDate && query.endDate) {
      qb.andWhere('claim.expenseDate BETWEEN :startDate AND :endDate', {
        startDate: query.startDate,
        endDate: query.endDate,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(claim.title LIKE :search OR claim.claimNumber LIKE :search OR claim.merchantName LIKE :search OR claim.invoiceNumber LIKE :search OR user.name LIKE :search OR user.email LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 100));
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      success: true,
      data,
      total,
    };
  }

  /**
   * Get single claim by ID
   */
  async getClaimById(id: number): Promise<LapClaim> {
    const claim = await this.claimRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }
    return claim;
  }

  /**
   * Admin: Approve claim
   */
  async approveClaim(
    id: number,
    adminId: number,
    dto: ApproveClaimDto,
  ): Promise<{ success: boolean; data: LapClaim; message: string }> {
    const claim = await this.getClaimById(id);

    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve claim with status '${claim.status}'. Only PENDING claims can be approved.`,
      );
    }

    claim.status = ClaimStatus.APPROVED;
    claim.adminRemarks = dto.adminRemarks || claim.adminRemarks || 'Approved by Admin';
    claim.approvedBy = adminId;
    claim.approvedAt = new Date();
    claim.updatedBy = adminId;

    const saved = await this.claimRepo.save(claim);
    return {
      success: true,
      data: saved,
      message: `Claim ${claim.claimNumber} approved successfully for ₹${claim.amount}.`,
    };
  }

  /**
   * Admin: Reject claim
   */
  async rejectClaim(
    id: number,
    adminId: number,
    dto: RejectClaimDto,
  ): Promise<{ success: boolean; data: LapClaim; message: string }> {
    const claim = await this.getClaimById(id);

    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject claim with status '${claim.status}'. Only PENDING claims can be rejected.`,
      );
    }

    if (!dto.adminRemarks || !dto.adminRemarks.trim()) {
      throw new BadRequestException('Reason/Remarks for rejection is mandatory.');
    }

    claim.status = ClaimStatus.REJECTED;
    claim.adminRemarks = dto.adminRemarks.trim();
    claim.rejectedBy = adminId;
    claim.rejectedAt = new Date();
    claim.updatedBy = adminId;

    const saved = await this.claimRepo.save(claim);
    return {
      success: true,
      data: saved,
      message: `Claim ${claim.claimNumber} has been rejected.`,
    };
  }

  /**
   * Admin: Bulk approve pending claims
   */
  async bulkApproveClaims(
    adminId: number,
    dto: BulkApproveClaimsDto,
  ): Promise<{ success: boolean; updatedCount: number; message: string }> {
    if (!dto.claimIds || !dto.claimIds.length) {
      throw new BadRequestException('Please provide at least one claim ID to approve.');
    }

    const pendingClaims = await this.claimRepo.find({
      where: {
        id: In(dto.claimIds),
        status: ClaimStatus.PENDING,
      },
    });

    if (pendingClaims.length === 0) {
      throw new BadRequestException('No eligible pending claims found to approve.');
    }

    const remarks = dto.adminRemarks?.trim() || 'Bulk Approved by Admin';
    const now = new Date();

    for (const claim of pendingClaims) {
      claim.status = ClaimStatus.APPROVED;
      claim.adminRemarks = remarks;
      claim.approvedBy = adminId;
      claim.approvedAt = now;
      claim.updatedBy = adminId;
    }

    await this.claimRepo.save(pendingClaims);

    return {
      success: true,
      updatedCount: pendingClaims.length,
      message: `Successfully approved ${pendingClaims.length} expense claim(s).`,
    };
  }

  /**
   * Admin: Bulk reject pending claims
   */
  async bulkRejectClaims(
    adminId: number,
    dto: BulkRejectClaimsDto,
  ): Promise<{ success: boolean; updatedCount: number; message: string }> {
    if (!dto.claimIds || !dto.claimIds.length) {
      throw new BadRequestException('Please provide at least one claim ID to reject.');
    }

    if (!dto.adminRemarks || !dto.adminRemarks.trim()) {
      throw new BadRequestException('Rejection reason is required for bulk rejection.');
    }

    const pendingClaims = await this.claimRepo.find({
      where: {
        id: In(dto.claimIds),
        status: ClaimStatus.PENDING,
      },
    });

    if (pendingClaims.length === 0) {
      throw new BadRequestException('No eligible pending claims found to reject.');
    }

    const remarks = dto.adminRemarks.trim();
    const now = new Date();

    for (const claim of pendingClaims) {
      claim.status = ClaimStatus.REJECTED;
      claim.adminRemarks = remarks;
      claim.rejectedBy = adminId;
      claim.rejectedAt = now;
      claim.updatedBy = adminId;
    }

    await this.claimRepo.save(pendingClaims);

    return {
      success: true,
      updatedCount: pendingClaims.length,
      message: `Successfully rejected ${pendingClaims.length} expense claim(s).`,
    };
  }

  /**
   * User: Cancel a pending claim
   */
  async cancelClaim(
    id: number,
    userId: number,
  ): Promise<{ success: boolean; data: LapClaim; message: string }> {
    const claim = await this.getClaimById(id);

    if (Number(claim.userId) !== Number(userId)) {
      throw new ForbiddenException('You are not authorized to cancel this claim.');
    }

    if (claim.status !== ClaimStatus.PENDING) {
      throw new BadRequestException(
        `Only PENDING claims can be cancelled. Current status is ${claim.status}.`,
      );
    }

    claim.status = ClaimStatus.CANCELLED;
    claim.updatedBy = userId;

    const saved = await this.claimRepo.save(claim);
    return {
      success: true,
      data: saved,
      message: `Claim ${claim.claimNumber} cancelled successfully.`,
    };
  }

  /**
   * Admin / Finance: Update payment disbursement status
   */
  async updatePaymentStatus(
    id: number,
    adminId: number,
    dto: UpdatePaymentStatusDto,
  ): Promise<{ success: boolean; data: LapClaim; message: string }> {
    const claim = await this.getClaimById(id);

    if (claim.status !== ClaimStatus.APPROVED) {
      throw new BadRequestException('Payment status can only be updated for APPROVED claims.');
    }

    claim.paymentStatus = dto.paymentStatus;
    if (dto.paymentDate) claim.paymentDate = dto.paymentDate;
    if (dto.paymentReference) claim.paymentReference = dto.paymentReference;
    claim.updatedBy = adminId;

    const saved = await this.claimRepo.save(claim);
    return {
      success: true,
      data: saved,
      message: `Payment status updated to ${dto.paymentStatus} for claim ${claim.claimNumber}.`,
    };
  }

  /**
   * Delete an expense claim (User if pending/cancelled, or Admin)
   */
  async deleteClaim(
    id: number,
    userId: number,
    roles: string[] = [],
  ): Promise<{ success: boolean; message: string }> {
    const claim = await this.getClaimById(id);
    const isAdmin = roles.some(
      (r) => typeof r === 'string' && r.toUpperCase() === 'ADMIN',
    );

    if (!isAdmin && Number(claim.userId) !== Number(userId)) {
      throw new ForbiddenException('You are not authorized to delete this claim.');
    }

    if (
      !isAdmin &&
      claim.status !== ClaimStatus.PENDING &&
      claim.status !== ClaimStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot delete a claim with status ${claim.status}.`,
      );
    }

    await this.claimRepo.remove(claim);
    return {
      success: true,
      message: `Claim ${claim.claimNumber} deleted successfully.`,
    };
  }

  /**
   * Get stats / KPI counts & totals (Excludes CANCELLED claims from total expenses)
   */
  async getClaimStats(
    userId?: number,
    month?: string,
  ): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalClaimedAmount: number;
    approvedAmount: number;
    pendingAmount: number;
    rejectedAmount: number;
  }> {
    const qb = this.claimRepo.createQueryBuilder('claim');

    if (userId) {
      qb.andWhere('claim.userId = :userId', { userId });
    }

    if (month) {
      qb.andWhere('claim.expenseDate LIKE :monthPrefix', {
        monthPrefix: `${month}%`,
      });
    }

    const claims = await qb.getMany();

    const activeClaims = claims.filter((c) => c.status !== ClaimStatus.CANCELLED);
    const total = activeClaims.length;
    const pending = claims.filter((c) => c.status === ClaimStatus.PENDING).length;
    const approved = claims.filter((c) => c.status === ClaimStatus.APPROVED).length;
    const rejected = claims.filter((c) => c.status === ClaimStatus.REJECTED).length;

    const totalClaimedAmount = activeClaims.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const approvedAmount = claims
      .filter((c) => c.status === ClaimStatus.APPROVED)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const pendingAmount = claims
      .filter((c) => c.status === ClaimStatus.PENDING)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const rejectedAmount = claims
      .filter((c) => c.status === ClaimStatus.REJECTED)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    return {
      total,
      pending,
      approved,
      rejected,
      totalClaimedAmount: Math.round(totalClaimedAmount * 100) / 100,
      approvedAmount: Math.round(approvedAmount * 100) / 100,
      pendingAmount: Math.round(pendingAmount * 100) / 100,
      rejectedAmount: Math.round(rejectedAmount * 100) / 100,
    };
  }
}
