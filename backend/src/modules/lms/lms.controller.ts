import { Controller, Get, Query } from '@nestjs/common';
import { LmsService } from '../lms/lms.service';

@Controller('lms')
export class LmsController {
  constructor(private readonly service: LmsService) {}

  @Get('dashboard')
  dashboard() {
    return this.service.dashboard();
  }

  @Get('loan-accounts')
  loanAccounts(@Query() query: any) {
    return this.service.loanAccounts(query);
  }
}
