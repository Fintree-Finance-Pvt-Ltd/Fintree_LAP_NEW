import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';

import { LapPaymentsService } from './lap-payments.service';

@Controller('easebuzz')
export class LapPaymentWebhookController {
  constructor(
    private readonly lapPaymentsService: LapPaymentsService,
  ) {}

  @Post('webhook')
  handleEasebuzzWebhook(
    @Body() body: any,
    @Headers() headers: any,
  ) {
    return this.lapPaymentsService.handleEasebuzzWebhook(
      body,
      headers,
    );
  }
}