import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  CreatePartnerPayload,
  PartnerService,
  UpdatePartnerPayload,
  UpdatePartnerStatusPayload,
} from './partner.service';

@Controller('partners')
export class PartnerController {
  constructor(
    private readonly partnerService: PartnerService,
  ) {}

  @Get()
  findAll(
    @Query('search') search?: string,
  ) {
    return this.partnerService.findAll(search);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe)
    partnerId: number,
  ) {
    return this.partnerService.findOne(
      partnerId,
    );
  }

  @Post()
  create(
    @Body()
    payload: CreatePartnerPayload,
  ) {
    return this.partnerService.create(payload);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    partnerId: number,
    @Body()
    payload: UpdatePartnerPayload,
  ) {
    return this.partnerService.update(
      partnerId,
      payload,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe)
    partnerId: number,
    @Body()
    payload: UpdatePartnerStatusPayload,
  ) {
    return this.partnerService.updateStatus(
      partnerId,
      payload,
    );
  }
}