import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { VarificationService } from './varification.service';

@ApiTags('Aadhaar Webhook')
@Public()
@Controller('aadhaar')
export class AadhaarWebhookController {
  constructor(private readonly service: VarificationService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async aadhaarWebhook(
    @Body() body: any,
    @Headers('x-lap-webhook-secret') secret: string,
    @Headers('x-webhook-source') source: string,
  ) {
    console.log('✅ LAP Aadhaar webhook reached controller');
    console.log('Webhook source:', source || 'unknown');

    const expectedSecret = process.env.LAP_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('❌ LAP_WEBHOOK_SECRET missing in LAP .env');
      throw new UnauthorizedException('Webhook secret is not configured.');
    }

    if (secret !== expectedSecret) {
      console.error('❌ Invalid LAP webhook secret');
      throw new UnauthorizedException('Invalid webhook secret.');
    }

    return this.service.updateAadhaarKycStatus(body);
  }
}