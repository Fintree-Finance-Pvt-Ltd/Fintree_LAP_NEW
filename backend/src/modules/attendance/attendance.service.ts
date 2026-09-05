import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { EndWorkDto } from './dto/end-work.dto';
import { StartWorkDto } from './dto/start-work.dto';
import { TrackLocationDto } from './dto/track-location.dto';
import { LapAttendance } from './entities/lap-attendance.entity';
import { LapAttendanceLocation } from './entities/lap-attendance-location.entity';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @InjectRepository(LapAttendance)
    private readonly attendanceRepo: Repository<LapAttendance>,
    @InjectRepository(LapAttendanceLocation)
    private readonly locationRepo: Repository<LapAttendanceLocation>,
  ) {}

  private getTodayDateString(dateObj: Date = new Date()): string {
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

  // Haversine formula to compute distance in KM between two coordinates
  private calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in KM
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Daily Cron at 10:00 PM (22:00 IST):
   * Auto-ends open work sessions for users who forgot to click "End Work".
   */
  @Cron('0 0 22 * * *', {
    name: 'auto-end-attendance-10pm',
    timeZone: 'Asia/Kolkata',
  })
  async handleAutoEndWorkCron() {
    this.logger.log('⏰ Running daily 10:00 PM IST Auto-End Attendance Cron...');
    try {
      const result = await this.autoEndForgottenSessions();
      this.logger.log(
        `✅ Auto-End Attendance Cron finished. Auto-ended ${result.affectedCount} open sessions with status auto_end_work.`,
      );
    } catch (error: any) {
      this.logger.error(
        `❌ Failed during Auto-End Attendance Cron: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  /**
   * Auto-closes a single open attendance record with 10:00 PM cutoff timestamp.
   */
  async autoCloseSingleRecord(record: LapAttendance): Promise<LapAttendance> {
    if (
      !record ||
      record.status === 'COMPLETED' ||
      record.status === 'AUTO_END_WORK' ||
      record.status === 'auto_end_work' ||
      record.status === 'AUTO_ENDED' ||
      record.status === 'END_WORK_HOUR'
    ) {
      return record;
    }

    const [y, m, d] = (record.date || this.getTodayDateString()).split('-').map((v) => parseInt(v, 10));
    // Set auto-end time to 10:00 PM (22:00:00) on that session's date
    const autoEndTime = new Date(y, m - 1, d, 22, 0, 0, 0);

    const startMillis = record.startTime ? new Date(record.startTime).getTime() : autoEndTime.getTime();
    const endMillis = autoEndTime.getTime();
    const diffMinutes = Math.max(0, Math.round((endMillis - startMillis) / (1000 * 60)));
    const formattedDuration = this.formatDuration(diffMinutes);

    record.endTime = autoEndTime;
    record.endLocation =
      record.currentLocation || record.startLocation || 'Office Workspace (Auto Ended at 10 PM)';

    const endLat = record.currentLatitude ?? record.startLatitude ?? null;
    const endLng = record.currentLongitude ?? record.startLongitude ?? null;

    if (endLat !== null) record.endLatitude = endLat;
    if (endLng !== null) record.endLongitude = endLng;

    record.totalMinutes = diffMinutes;
    record.totalHours = formattedDuration;
    record.status = 'AUTO_END_WORK';
    record.updatedBy = record.userId;

    const saved = await this.attendanceRepo.save(record);

    // Save final location breadcrumb if coordinates exist
    if (endLat && endLng) {
      try {
        const finalLoc = this.locationRepo.create({
          attendanceId: record.id,
          userId: record.userId,
          latitude: endLat,
          longitude: endLng,
          locationName: record.endLocation,
          recordedAt: autoEndTime,
        });
        await this.locationRepo.save(finalLoc);
      } catch (locErr: any) {
        this.logger.warn(`Could not save auto-end breadcrumb for session ${record.id}: ${locErr?.message}`);
      }
    }

    return saved;
  }

  /**
   * Process all open IN_PROGRESS sessions on or before target date.
   */
  async autoEndForgottenSessions(targetDate?: string) {
    const todayStr = targetDate || this.getTodayDateString();

    const openRecords = await this.attendanceRepo
      .createQueryBuilder('att')
      .where('att.status = :status', { status: 'IN_PROGRESS' })
      .andWhere('att.date <= :todayStr', { todayStr })
      .getMany();

    let affectedCount = 0;
    for (const record of openRecords) {
      try {
        await this.autoCloseSingleRecord(record);
        affectedCount++;
      } catch (err: any) {
        this.logger.warn(
          `Failed to auto-end session ID ${record.id} for user ${record.userId}: ${err?.message}`,
        );
      }
    }

    return {
      message: 'Auto-end check completed successfully',
      affectedCount,
    };
  }

  async getTodayStatus(userId: number) {
    const todayStr = this.getTodayDateString();
    let record = await this.attendanceRepo.findOne({
      where: { userId, date: todayStr },
      order: { id: 'DESC' },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const isAfter8AM = currentHour >= 8;
    const isPast10PM = currentHour >= 22;

    // Auto-close lazily if still IN_PROGRESS and past 10:00 PM
    if (record && record.status === 'IN_PROGRESS' && isPast10PM) {
      record = await this.autoCloseSingleRecord(record);
    }

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
    const isWorkEnded =
      Boolean(record.endTime) ||
      record.status === 'COMPLETED' ||
      record.status === 'AUTO_END_WORK' ||
      record.status === 'auto_end_work' ||
      record.status === 'AUTO_ENDED' ||
      record.status === 'END_WORK_HOUR';

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
        currentLatitude: record.currentLatitude,
        currentLongitude: record.currentLongitude,
        currentLocation: record.currentLocation,
        lastTrackedAt: record.lastTrackedAt,
        endTime: record.endTime,
        endLocation: record.endLocation,
        endLatitude: record.endLatitude,
        endLongitude: record.endLongitude,
        totalHours: record.totalHours,
        totalMinutes: record.totalMinutes,
        totalDistanceKm: record.totalDistanceKm,
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
      startLatitude: dto.latitude !== undefined && dto.latitude !== null ? dto.latitude : null,
      startLongitude: dto.longitude !== undefined && dto.longitude !== null ? dto.longitude : null,
      currentLatitude: dto.latitude !== undefined && dto.latitude !== null ? dto.latitude : null,
      currentLongitude: dto.longitude !== undefined && dto.longitude !== null ? dto.longitude : null,
      currentLocation: location,
      lastTrackedAt: now,
      totalDistanceKm: 0,
      status: 'IN_PROGRESS',
      createdBy: userId,
    });

    const saved = await this.attendanceRepo.save(attendance);

    // Save initial starting breadcrumb
    if (dto.latitude && dto.longitude) {
      const initialLoc = this.locationRepo.create({
        attendanceId: saved.id,
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        locationName: location,
        recordedAt: now,
      });
      await this.locationRepo.save(initialLoc);
    }

    return {
      message: 'Work started successfully',
      data: saved,
    };
  }

  async trackLocation(userId: number, dto: TrackLocationDto) {
    const todayStr = this.getTodayDateString();

    let attendance: LapAttendance | null = null;
    if (dto.attendanceId) {
      attendance = await this.attendanceRepo.findOne({
        where: { id: dto.attendanceId, userId },
      });
    }

    if (!attendance) {
      attendance = await this.attendanceRepo.findOne({
        where: { userId, date: todayStr, status: 'IN_PROGRESS' },
        order: { id: 'DESC' },
      });
    }

    if (!attendance) {
      return { message: 'No active attendance session to track' };
    }

    const now = new Date();
    const lat = dto.latitude;
    const lng = dto.longitude;

    // Calculate distance from last point
    let distanceIncrement = 0;
    const prevLat = attendance.currentLatitude ?? attendance.startLatitude;
    const prevLng = attendance.currentLongitude ?? attendance.startLongitude;

    if (prevLat && prevLng) {
      distanceIncrement = this.calculateDistanceKm(
        Number(prevLat),
        Number(prevLng),
        lat,
        lng,
      );
      // Filter out small GPS jitter (< 20 meters)
      if (distanceIncrement < 0.02) {
        distanceIncrement = 0;
      }
    }

    const currentTotalDist = Number(attendance.totalDistanceKm || 0) + distanceIncrement;

    attendance.currentLatitude = lat;
    attendance.currentLongitude = lng;
    if (dto.locationName) attendance.currentLocation = dto.locationName;
    attendance.lastTrackedAt = now;
    attendance.totalDistanceKm = parseFloat(currentTotalDist.toFixed(3));
    await this.attendanceRepo.save(attendance);

    const locationPoint = this.locationRepo.create({
      attendanceId: attendance.id,
      userId,
      latitude: lat,
      longitude: lng,
      accuracy: dto.accuracy ?? null,
      speed: dto.speed ?? null,
      heading: dto.heading ?? null,
      locationName: dto.locationName ?? null,
      recordedAt: now,
    });
    await this.locationRepo.save(locationPoint);

    return {
      message: 'Location tracked successfully',
      data: {
        attendanceId: attendance.id,
        latitude: lat,
        longitude: lng,
        totalDistanceKm: attendance.totalDistanceKm,
        lastTrackedAt: now,
      },
    };
  }

  async endWork(userId: number, dto: EndWorkDto) {
    const todayStr = this.getTodayDateString();

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

    if (
      (record.status === 'COMPLETED' ||
        record.status === 'AUTO_END_WORK' ||
        record.status === 'auto_end_work' ||
        record.status === 'AUTO_ENDED' ||
        record.status === 'END_WORK_HOUR') &&
      record.endTime
    ) {
      return {
        message: 'Work was already completed or auto-ended today',
        data: record,
      };
    }

    const now = new Date();
    const startMillis = new Date(record.startTime).getTime();
    const endMillis = now.getTime();
    const diffMinutes = Math.max(0, Math.round((endMillis - startMillis) / (1000 * 60)));
    const formattedDuration = this.formatDuration(diffMinutes);

    record.endTime = now;
    record.endLocation = dto.location || record.currentLocation || record.startLocation || 'Office Workspace';

    const endLat = dto.latitude ?? record.currentLatitude ?? record.startLatitude ?? null;
    const endLng = dto.longitude ?? record.currentLongitude ?? record.startLongitude ?? null;

    if (endLat !== null) record.endLatitude = endLat;
    if (endLng !== null) record.endLongitude = endLng;

    // Add remaining distance if final coords provided and differ from current
    if (dto.latitude && dto.longitude && record.currentLatitude && record.currentLongitude) {
      const dist = this.calculateDistanceKm(
        Number(record.currentLatitude),
        Number(record.currentLongitude),
        dto.latitude,
        dto.longitude,
      );
      if (dist >= 0.02) {
        record.totalDistanceKm = parseFloat(
          (Number(record.totalDistanceKm || 0) + dist).toFixed(3),
        );
      }
    }

    record.totalMinutes = diffMinutes;
    record.totalHours = formattedDuration;
    record.status = 'COMPLETED';
    record.updatedBy = userId;

    // Save final location point
    if (endLat && endLng) {
      const finalLoc = this.locationRepo.create({
        attendanceId: record.id,
        userId,
        latitude: endLat,
        longitude: endLng,
        locationName: record.endLocation,
        recordedAt: now,
      });
      await this.locationRepo.save(finalLoc);
    }

    const updated = await this.attendanceRepo.save(record);

    return {
      message: 'Work ended successfully',
      data: updated,
    };
  }

  async getAttendanceRoute(attendanceId: number) {
    const attendance = await this.attendanceRepo.findOne({
      where: { id: attendanceId },
      relations: ['user'],
    });

    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }

    const points = await this.locationRepo.find({
      where: { attendanceId },
      order: { recordedAt: 'ASC' },
    });

    return {
      data: {
        attendance: {
          id: attendance.id,
          userId: attendance.userId,
          userName: attendance.user?.name || `Employee #${attendance.userId}`,
          userEmail: attendance.user?.email || '',
          date: attendance.date,
          startTime: attendance.startTime,
          startLocation: attendance.startLocation,
          startLatitude: attendance.startLatitude,
          startLongitude: attendance.startLongitude,
          endTime: attendance.endTime,
          endLocation: attendance.endLocation,
          endLatitude: attendance.endLatitude,
          endLongitude: attendance.endLongitude,
          currentLatitude: attendance.currentLatitude,
          currentLongitude: attendance.currentLongitude,
          currentLocation: attendance.currentLocation,
          lastTrackedAt: attendance.lastTrackedAt,
          totalHours: attendance.totalHours,
          totalMinutes: attendance.totalMinutes,
          totalDistanceKm: attendance.totalDistanceKm || 0,
          status: attendance.status,
        },
        points: points.map((p) => ({
          id: p.id,
          latitude: Number(p.latitude),
          longitude: Number(p.longitude),
          accuracy: p.accuracy,
          speed: p.speed,
          heading: p.heading,
          locationName: p.locationName,
          recordedAt: p.recordedAt,
        })),
      },
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

  async getAllAttendance(options?: {
    date?: string;
    month?: string;
    search?: string;
    status?: string;
    limit?: number;
    page?: number;
  }) {
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

    if (options?.status && options.status !== 'ALL') {
      if (
        options.status === 'AUTO_END_WORK' ||
        options.status === 'auto_end_work' ||
        options.status === 'AUTO_ENDED' ||
        options.status === 'END_WORK_HOUR'
      ) {
        qb.andWhere('(att.status = :s1 OR att.status = :s2 OR att.status = :s3 OR att.status = :s4)', {
          s1: 'AUTO_END_WORK',
          s2: 'auto_end_work',
          s3: 'AUTO_ENDED',
          s4: 'END_WORK_HOUR',
        });
      } else {
        qb.andWhere('att.status = :status', { status: options.status });
      }
    }

    if (options?.search) {
      qb.andWhere(
        '(user.name LIKE :search OR user.email LIKE :search OR att.startLocation LIKE :search OR att.endLocation LIKE :search)',
        {
          search: `%${options.search}%`,
        },
      );
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
