import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import {
  ApplyLeaveDto,
  ApproveLeaveDto,
  QueryLeavesDto,
  RejectLeaveDto,
} from './dto/leaves.dto';
import { LeavesService } from './leaves.service';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  /**
   * Apply for leave (Any authenticated user)
   */
  @Post('apply')
  async applyLeave(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: ApplyLeaveDto,
  ) {
    return this.leavesService.applyLeave(user.id, dto);
  }

  /**
   * Get logged-in user's leave history
   */
  @Get('my-leaves')
  async getMyLeaves(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query() query: QueryLeavesDto,
  ) {
    return this.leavesService.getMyLeaves(user.id, query);
  }

  /**
   * Cancel pending leave application
   */
  @Post(':id/cancel')
  async cancelLeave(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.leavesService.cancelLeave(id, user.id);
  }

  /**
   * Get approved leaves for Attendance Calendar integration
   */
  @Get('calendar-leaves')
  async getCalendarLeaves(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query('userId') queryUserId?: string,
    @Query('month') month?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const parsedUid =
      queryUserId && !isNaN(parseInt(queryUserId, 10))
        ? parseInt(queryUserId, 10)
        : undefined;
    const targetUserId = parsedUid !== undefined ? parsedUid : user.id;
    return this.leavesService.getApprovedLeavesForCalendar(
      targetUserId,
      month,
      startDate,
      endDate,
    );
  }

  /**
   * Get leave KPI statistics
   */
  @Get('stats')
  async getLeaveStats(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query('userId') queryUserId?: string,
    @Query('month') month?: string,
  ) {
    const isAdmin = user.roles?.includes(RoleCode.ADMIN);
    const targetUserId = isAdmin && queryUserId ? parseInt(queryUserId, 10) : user.id;
    return this.leavesService.getLeaveStats(targetUserId, month);
  }

  /**
   * Admin: View all leave applications across the company
   */
  @Get('admin/all')
  @Roles(RoleCode.ADMIN)
  async getAllLeaves(@Query() query: QueryLeavesDto) {
    return this.leavesService.getAllLeaves(query);
  }

  /**
   * Admin: Approve leave request
   */
  @Post('admin/:id/approve')
  @Roles(RoleCode.ADMIN)
  async approveLeave(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveLeaveDto,
  ) {
    return this.leavesService.approveLeave(id, user.id, dto);
  }

  /**
   * Admin: Reject leave request
   */
  @Post('admin/:id/reject')
  @Roles(RoleCode.ADMIN)
  async rejectLeave(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectLeaveDto,
  ) {
    return this.leavesService.rejectLeave(id, user.id, dto);
  }
}
