import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { EndWorkDto } from './dto/end-work.dto';
import { StartWorkDto } from './dto/start-work.dto';
import { TrackLocationDto } from './dto/track-location.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('today-status')
  async getTodayStatus(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
  ) {
    return this.attendanceService.getTodayStatus(user.id);
  }

  @Post('start-work')
  async startWork(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: StartWorkDto,
  ) {
    return this.attendanceService.startWork(user.id, dto);
  }

  @Post('track-location')
  async trackLocation(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: TrackLocationDto,
  ) {
    return this.attendanceService.trackLocation(user.id, dto);
  }

  @Post('end-work')
  async endWork(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: EndWorkDto,
  ) {
    return this.attendanceService.endWork(user.id, dto);
  }

  @Get('route/:attendanceId')
  async getRoute(
    @Param('attendanceId', ParseIntPipe) attendanceId: number,
  ) {
    return this.attendanceService.getAttendanceRoute(attendanceId);
  }

  @Get('my-history')
  async getMyHistory(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query('limit') limit?: string,
  ) {
    const take = limit ? parseInt(limit, 10) : 60;
    return this.attendanceService.getMyHistory(user.id, take);
  }

  @Get('all')
  async getAll(
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.attendanceService.getAllAttendance({
      date,
      month,
      search,
      limit: limit ? parseInt(limit, 10) : 100,
      page: page ? parseInt(page, 10) : 1,
    });
  }
}


