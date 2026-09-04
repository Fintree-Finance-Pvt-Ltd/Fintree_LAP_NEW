import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EndWorkDto } from './dto/end-work.dto';
import { StartWorkDto } from './dto/start-work.dto';
import { LapAttendance } from './entities/lap-attendance.entity';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(LapAttendance)
    private readonly attendanceRepo: Repository<LapAttendance>,
  ) {}

  private getTodayDateString(dateObj: Date = new Date()): string {
    // Return YYYY-MM-DD in local time
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDuration(minutes: number): string {
    if (minutes < 0) minutes = 0;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hrs === 0) {
      return `${mins} min${mins === 1 ? '' : 's'}`;
    }
    return `${hrs} hr${hrs === 1 ? '' : 's'} ${mins} min${mins === 1 ? '' : 's'}`;
  }

  async getTodayStatus(userId: number) {
    const todayStr = this.getTodayDateString();
    const record = await this.attendanceRepo.findOne({
      where: { userId, date: todayStr },
      order: { id: 'DESC' },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const isAfter8AM = currentHour >= 8;

    if (!record) {
      return {
        isWorkStarted: false,
        isWorkEnded: false,
        date: todayStr,
        serverTime: now.toISOString(),
        isAfter8AM,
        record: null,
      };
    }

    const isWorkStarted = Boolean(record.startTime);
    const isWorkEnded = Boolean(record.endTime) || record.status === 'COMPLETED';

    return {
      isWorkStarted,
      isWorkEnded,
      date: todayStr,
      serverTime: now.toISOString(),
      isAfter8AM,
      record: {
        id: record.id,
        date: record.date,
        startTime: record.startTime,
        startLocation: record.startLocation,
        startLatitude: record.startLatitude,
        startLongitude: record.startLongitude,
        endTime: record.endTime,
        endLocation: record.endLocation,
        endLatitude: record.endLatitude,
        endLongitude: record.endLongitude,
        totalHours: record.totalHours,
        totalMinutes: record.totalMinutes,
        status: record.status,
        createdAt: record.createdAt,
      },
    };
  }

  async startWork(userId: number, dto: StartWorkDto) {
    const todayStr = this.getTodayDateString();
    const existing = await this.attendanceRepo.findOne({
      where: { userId, date: todayStr },
      order: { id: 'DESC' },
    });

    if (existing && existing.startTime) {
      return {
        message: 'Work already started for today',
        data: existing,
      };
    }

    const now = new Date();
    const location = dto.location || dto.spoke || 'Location detected';

    const attendance = this.attendanceRepo.create({
      userId,
      date: todayStr,
      startTime: now,
      startLocation: location,
      startLatitude: dto.latitude ?? null,
      startLongitude: dto.longitude ?? null,
      status: 'IN_PROGRESS',
      createdBy: userId,
    });

    const saved = await this.attendanceRepo.save(attendance);

    return {
      message: 'Work started successfully',
      data: saved,
    };
  }

  async endWork(userId: number, dto: EndWorkDto) {
    const todayStr = this.getTodayDateString();

    // Find the active attendance for today or latest unclosed session
    let record = await this.attendanceRepo.findOne({
      where: { userId, date: todayStr, status: 'IN_PROGRESS' },
      order: { id: 'DESC' },
    });

    if (!record) {
      record = await this.attendanceRepo.findOne({
        where: { userId, date: todayStr },
        order: { id: 'DESC' },
      });
    }

    if (!record) {
      throw new NotFoundException('No active work attendance record found for today.');
    }

    if (record.status === 'COMPLETED' && record.endTime) {
      return {
        message: 'Work was already completed today',
        data: record,
      };
    }

    const now = new Date();
    const startMillis = new Date(record.startTime).getTime();
    const endMillis = now.getTime();
    const diffMinutes = Math.max(0, Math.round((endMillis - startMillis) / (1000 * 60)));
    const formattedDuration = this.formatDuration(diffMinutes);

    record.endTime = now;
    record.endLocation = dto.location || record.startLocation || 'Location detected';
    if (dto.latitude !== undefined) record.endLatitude = dto.latitude;
    if (dto.longitude !== undefined) record.endLongitude = dto.longitude;
    record.totalMinutes = diffMinutes;
    record.totalHours = formattedDuration;
    record.status = 'COMPLETED';
    record.updatedBy = userId;

    const updated = await this.attendanceRepo.save(record);

    return {
      message: 'Work ended successfully',
      data: updated,
    };
  }

  async getMyHistory(userId: number, limit = 60) {
    const list = await this.attendanceRepo.find({
      where: { userId },
      order: { date: 'DESC', startTime: 'DESC' },
      take: limit,
    });
    return { data: list };
  }

  async getAllAttendance(options?: { date?: string; month?: string; search?: string; limit?: number; page?: number }) {
    const limit = options?.limit ?? 100;
    const page = options?.page ?? 1;
    const skip = (page - 1) * limit;

    const qb = this.attendanceRepo
      .createQueryBuilder('att')
      .leftJoinAndSelect('att.user', 'user')
      .orderBy('att.date', 'DESC')
      .addOrderBy('att.startTime', 'DESC')
      .take(limit)
      .skip(skip);

    if (options?.date) {
      qb.andWhere('att.date = :date', { date: options.date });
    }

    if (options?.month) {
      qb.andWhere('att.date LIKE :month', { month: `${options.month}%` });
    }

    if (options?.search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search OR att.startLocation LIKE :search)', {
        search: `%${options.search}%`,
      });
    }

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
}

