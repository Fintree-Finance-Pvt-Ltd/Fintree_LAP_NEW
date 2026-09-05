import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { LapAttendance } from './entities/lap-attendance.entity';
import { LapAttendanceLocation } from './entities/lap-attendance-location.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LapAttendance, LapAttendanceLocation, User])],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

