import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  ApplyLeaveDto,
  ApproveLeaveDto,
  QueryLeavesDto,
  RejectLeaveDto,
} from './dto/leaves.dto';
import { HalfDayType, LapLeave, LeaveStatus } from './entities/lap-leave.entity';

@Injectable()
export class LeavesService implements OnModuleInit {
  private readonly logger = new Logger(LeavesService.name);

  constructor(
    @InjectRepository(LapLeave)
    private readonly leaveRepo: Repository<LapLeave>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    try {
      await this.dataSource.query(`
        CREATE TABLE IF NOT EXISTS \`lap_leaves\` (
          \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
          \`user_id\` bigint unsigned NOT NULL,
          \`leave_type\` varchar(30) NOT NULL DEFAULT 'CASUAL',
          \`start_date\` varchar(10) NOT NULL,
          \`end_date\` varchar(10) NOT NULL,
          \`is_half_day\` tinyint(1) NOT NULL DEFAULT 0,
          \`half_day_type\` varchar(20) DEFAULT 'FULL_DAY',
          \`total_days\` decimal(5,2) NOT NULL DEFAULT '1.00',
          \`reason\` text NOT NULL,
          \`status\` varchar(30) NOT NULL DEFAULT 'PENDING',
          \`approved_by\` bigint unsigned DEFAULT NULL,
          \`approved_at\` datetime(6) DEFAULT NULL,
          \`admin_remarks\` text DEFAULT NULL,
          \`contact_number\` varchar(30) DEFAULT NULL,
          \`created_by\` bigint unsigned DEFAULT NULL,
          \`updated_by\` bigint unsigned DEFAULT NULL,
          \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          PRIMARY KEY (\`id\`),
          KEY \`idx_lap_leaves_user_id\` (\`user_id\`),
          KEY \`idx_lap_leaves_status\` (\`status\`),
          KEY \`idx_lap_leaves_dates\` (\`start_date\`, \`end_date\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this.logger.log('✅ Table `lap_leaves` initialized / verified successfully.');
    } catch (err: any) {
      this.logger.error(`Failed to verify or create lap_leaves table: ${err?.message}`);
    }
  }

  /**
   * Helper to calculate working days count between two YYYY-MM-DD dates (inclusive)
   */
  private calculateDays(startDate: string, endDate: string, isHalfDay = false): number {
    if (isHalfDay) return 0.5;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1.0;

    const diffTime = end.getTime() - start.getTime();
    if (diffTime < 0) return 1.0;

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diffDays);
  }

  /**
   * Apply for a new leave request (Employee / User)
   */
  async applyLeave(userId: number, dto: ApplyLeaveDto) {
    if (dto.startDate > dto.endDate) {
      throw new BadRequestException('Start date cannot be after end date');
    }

    const calculatedTotalDays = dto.isHalfDay
      ? 0.5
      : (dto.totalDays || this.calculateDays(dto.startDate, dto.endDate, Boolean(dto.isHalfDay)));

    // Check for active overlapping leaves
    const overlapping = await this.leaveRepo
      .createQueryBuilder('l')
      .where('l.userId = :userId', { userId })
      .andWhere('l.status IN (:...statuses)', {
        statuses: [LeaveStatus.PENDING, LeaveStatus.APPROVED],
      })
      .andWhere(
        '((l.startDate <= :endDate AND l.endDate >= :startDate))',
        { startDate: dto.startDate, endDate: dto.endDate },
      )
      .getOne();

    if (overlapping) {
      throw new BadRequestException(
        `You already have an active leave (${overlapping.status}) for overlapping dates (${overlapping.startDate} to ${overlapping.endDate})`,
      );
    }

    const leave = this.leaveRepo.create({
      userId,
      leaveType: dto.leaveType,
      startDate: dto.startDate,
      endDate: dto.endDate,
      isHalfDay: Boolean(dto.isHalfDay),
      halfDayType: dto.isHalfDay ? (dto.halfDayType || HalfDayType.FIRST_HALF) : HalfDayType.FULL_DAY,
      totalDays: calculatedTotalDays,
      reason: dto.reason,
      status: LeaveStatus.PENDING,
      contactNumber: dto.contactNumber || null,
      createdBy: userId,
    });

    const saved = await this.leaveRepo.save(leave);

    return {
      success: true,
      message: 'Leave application submitted successfully. Pending Admin approval.',
      data: saved,
    };
  }

  /**
   * Get all leaves applied by the current user
   */
  async getMyLeaves(userId: number, query: QueryLeavesDto) {
    const qb = this.leaveRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.approvedByUser', 'admin')
      .where('l.userId = :userId', { userId })
      .orderBy('l.createdAt', 'DESC');

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('l.status = :status', { status: query.status });
    }

    if (query.month) {
      qb.andWhere('(l.startDate LIKE :month OR l.endDate LIKE :month)', {
        month: `${query.month}%`,
      });
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 50;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;

    qb.take(limit).skip(skip);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get all leaves across the organization with rich filters
   */
  async getAllLeaves(query: QueryLeavesDto) {
    const qb = this.leaveRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.user', 'user')
      .leftJoinAndSelect('l.approvedByUser', 'admin')
      .orderBy('l.createdAt', 'DESC');

    if (query.userId) {
      qb.andWhere('l.userId = :userId', { userId: parseInt(query.userId, 10) });
    }

    if (query.status && query.status !== 'ALL') {
      qb.andWhere('l.status = :status', { status: query.status });
    }

    if (query.month) {
      qb.andWhere('(l.startDate LIKE :month OR l.endDate LIKE :month)', {
        month: `${query.month}%`,
      });
    }

    if (query.date) {
      qb.andWhere('(l.startDate <= :date AND l.endDate >= :date)', {
        date: query.date,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR l.reason LIKE :search OR l.leaveType LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const limit = query.limit ? parseInt(query.limit, 10) : 100;
    const page = query.page ? parseInt(query.page, 10) : 1;
    const skip = (page - 1) * limit;

    qb.take(limit).skip(skip);

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Approve a leave application
   */
  async approveLeave(leaveId: number, adminUserId: number, dto: ApproveLeaveDto) {
    const leave = await this.leaveRepo.findOne({
      where: { id: leaveId },
      relations: ['user'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (leave.status === LeaveStatus.APPROVED) {
      throw new BadRequestException('Leave is already approved');
    }

    leave.status = LeaveStatus.APPROVED;
    leave.approvedBy = adminUserId;
    leave.approvedAt = new Date();
    leave.adminRemarks = dto.adminRemarks || leave.adminRemarks || 'Approved by Admin';
    leave.updatedBy = adminUserId;

    const saved = await this.leaveRepo.save(leave);

    return {
      success: true,
      message: `Leave approved for ${leave.user?.name || 'Employee'}. It will now reflect in attendance calendar.`,
      data: saved,
    };
  }

  /**
   * Admin: Reject a leave application
   */
  async rejectLeave(leaveId: number, adminUserId: number, dto: RejectLeaveDto) {
    const leave = await this.leaveRepo.findOne({
      where: { id: leaveId },
      relations: ['user'],
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    leave.status = LeaveStatus.REJECTED;
    leave.approvedBy = adminUserId;
    leave.approvedAt = new Date();
    leave.adminRemarks = dto.adminRemarks || 'Rejected by Admin';
    leave.updatedBy = adminUserId;

    const saved = await this.leaveRepo.save(leave);

    return {
      success: true,
      message: 'Leave application rejected.',
      data: saved,
    };
  }

  /**
   * User: Cancel own pending leave
   */
  async cancelLeave(leaveId: number, userId: number) {
    const leave = await this.leaveRepo.findOne({ where: { id: leaveId } });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    if (Number(leave.userId) !== Number(userId)) {
      throw new ForbiddenException('You can only cancel your own leave request');
    }

    if (leave.status !== LeaveStatus.PENDING && leave.status !== LeaveStatus.APPROVED) {
      throw new BadRequestException(`Cannot cancel leave with status: ${leave.status}`);
    }

    leave.status = LeaveStatus.CANCELLED;
    leave.updatedBy = userId;

    const saved = await this.leaveRepo.save(leave);

    return {
      success: true,
      message: 'Leave request cancelled successfully.',
      data: saved,
    };
  }

  /**
   * Helper to expand YYYY-MM-DD date ranges into an array of date strings
   */
  private expandDateRange(startDateStr: string, endDateStr: string): string[] {
    try {
      const [sY, sM, sD] = startDateStr.split('-').map(Number);
      const [eY, eM, eD] = endDateStr.split('-').map(Number);
      const start = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
      const end = new Date(Date.UTC(eY, eM - 1, eD, 0, 0, 0));
      const dates: string[] = [];
      const cur = new Date(start);
      while (cur <= end) {
        const y = cur.getUTCFullYear();
        const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
        const d = String(cur.getUTCDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${d}`);
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
      return dates.length > 0 ? dates : [startDateStr];
    } catch {
      return [startDateStr];
    }
  }

  /**
   * Get approved leaves for Attendance Calendar reflection
   * Returns a map of date string "YYYY-MM-DD" -> Leave Info
   */
  async getApprovedLeavesForCalendar(userId?: number, month?: string, startDate?: string, endDate?: string) {
    const qb = this.leaveRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.user', 'user')
      .leftJoinAndSelect('l.approvedByUser', 'admin')
      .where('l.status = :status', { status: LeaveStatus.APPROVED });

    if (userId && !isNaN(Number(userId)) && Number(userId) > 0) {
      qb.andWhere('l.userId = :userId', { userId: Number(userId) });
    }

    if (month && month.length === 7) {
      qb.andWhere('(l.startDate LIKE :month OR l.endDate LIKE :month OR (l.startDate <= :monthEnd AND l.endDate >= :monthStart))', {
        month: `${month}%`,
        monthStart: `${month}-01`,
        monthEnd: `${month}-31`,
      });
    } else if (startDate && endDate) {
      qb.andWhere('(l.startDate <= :endDate AND l.endDate >= :startDate)', {
        startDate,
        endDate,
      });
    }

    const approvedLeaves = await qb.getMany();

    // Expand date ranges into individual dates using UTC date range expansion
    const dateLeaveMap: Record<string, any[]> = {};

    approvedLeaves.forEach((leave) => {
      const dates = this.expandDateRange(leave.startDate, leave.endDate);
      dates.forEach((dateStr) => {
        if (!dateLeaveMap[dateStr]) {
          dateLeaveMap[dateStr] = [];
        }
        dateLeaveMap[dateStr].push({
          id: leave.id,
          userId: leave.userId,
          userName: leave.user?.name,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          isHalfDay: leave.isHalfDay,
          halfDayType: leave.halfDayType,
          totalDays: leave.totalDays,
          reason: leave.reason,
          approvedBy: leave.approvedByUser?.name || 'Admin',
          approvedAt: leave.approvedAt,
          adminRemarks: leave.adminRemarks,
        });
      });
    });

    return {
      data: approvedLeaves,
      dateMap: dateLeaveMap,
    };
  }

  /**
   * Get leave KPI statistics
   */
  async getLeaveStats(userId?: number, month?: string) {
    const qb = this.leaveRepo.createQueryBuilder('l');

    if (userId) {
      qb.where('l.userId = :userId', { userId });
    }

    if (month) {
      qb.andWhere('(l.startDate LIKE :month OR l.endDate LIKE :month)', {
        month: `${month}%`,
      });
    }

    const all = await qb.getMany();

    const pending = all.filter((l) => l.status === LeaveStatus.PENDING).length;
    const approved = all.filter((l) => l.status === LeaveStatus.APPROVED).length;
    const rejected = all.filter((l) => l.status === LeaveStatus.REJECTED).length;
    const cancelled = all.filter((l) => l.status === LeaveStatus.CANCELLED).length;

    const totalApprovedDays = all
      .filter((l) => l.status === LeaveStatus.APPROVED)
      .reduce((sum, l) => sum + (Number(l.totalDays) || 0), 0);

    return {
      data: {
        total: all.length,
        pending,
        approved,
        rejected,
        cancelled,
        totalApprovedDays: parseFloat(totalApprovedDays.toFixed(1)),
      },
    };
  }
}
