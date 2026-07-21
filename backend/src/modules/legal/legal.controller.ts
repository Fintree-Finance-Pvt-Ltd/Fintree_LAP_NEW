import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';

import { LegalService } from './legal.service';

@Controller('legal')
export class LegalController {
  constructor(
    private readonly service: LegalService,
  ) {}

  @Get('cases-requiring-attention')
  getCasesRequiringAttention() {
    return this.service.getCasesRequiringAttention();
  }

  @Get(':applicationId/status')
  getStatus(
    @Param('applicationId', ParseIntPipe) id: number,
  ) {
    return this.service.getStatus(id);
  }
}