import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { HalfDayType, LeaveStatus, LeaveType } from '../entities/lap-leave.entity';

export class ApplyLeaveDto {
  @IsEnum(LeaveType)
  @IsNotEmpty()
  leaveType: LeaveType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in format YYYY-MM-DD',
  })
  startDate: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in format YYYY-MM-DD',
  })
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;

  @IsEnum(HalfDayType)
  @IsOptional()
  halfDayType?: HalfDayType;

  @IsNumber()
  @IsOptional()
  totalDays?: number;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  contactNumber?: string;
}

export class ApproveLeaveDto {
  @IsString()
  @IsOptional()
  adminRemarks?: string;
}

export class RejectLeaveDto {
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason / remarks is required' })
  adminRemarks: string;
}

export class QueryLeavesDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  month?: string; // YYYY-MM

  @IsOptional()
  @IsString()
  date?: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  page?: string;
}
