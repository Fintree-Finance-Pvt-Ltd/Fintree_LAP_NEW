import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { VarificationService } from './varification.service';

@ApiTags('Varification')
@ApiBearerAuth()
@Controller()
export class VarificationController {
  constructor(private readonly service: VarificationService) {}

  @Post('pan/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPan(@Body() body: any) {
    return this.service.verifyPan(
      body?.panNumber,
      body?.name,
      Number(body?.applicationId),
    );
  }

  @Post('gst/verify')
  @HttpCode(HttpStatus.OK)
  async verifyGst(@Body() body: any) {
    return this.service.verifyGst(
      body?.gstNumber,
      Number(body?.applicationId),
    );
  }

  @Post('aadhaar/init')
  @HttpCode(HttpStatus.OK)
  async initAadhaarKyc(@Body() body: any) {
    return this.service.initAadhaarKyc(Number(body?.applicationId));
  }

  @Get("aadhaar/status/:applicationId")
@HttpCode(HttpStatus.OK)
async getAadhaarKycStatus(
  @Param("applicationId", ParseIntPipe) applicationId: number,
) {
  return this.service.getAadhaarKycStatus(applicationId);
}
}