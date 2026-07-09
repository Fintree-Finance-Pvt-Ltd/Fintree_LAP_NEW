import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ChargesReceiptsService } from './charges-receipts.service';

@Controller('charges-receipts')
export class ChargesReceiptsController {
  constructor(
    private readonly chargesReceiptsService: ChargesReceiptsService,
  ) {}

  // Create single charge manually
  // POST /charges-receipts
  @Post()
  create(@Body() body: any) {
    return this.chargesReceiptsService.create(body);
  }

  // Create default charges schedule for application
  // POST /charges-receipts/application/22/default
  @Post('application/:applicationId/default')
  createDefaultSchedule(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.chargesReceiptsService.createDefaultSchedule(applicationId);
  }

  // Get all charges by application id
  // GET /charges-receipts/application/22
  @Get('application/:applicationId')
  findByApplicationId(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.chargesReceiptsService.findByApplicationId(applicationId);
  }

  // Submit schedule
  // PATCH /charges-receipts/application/22/submit-schedule
  @Patch('application/:applicationId/submit-schedule')
  submitSchedule(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.chargesReceiptsService.submitSchedule(applicationId);
  }

  // Approve schedule
  // PATCH /charges-receipts/application/22/approve-schedule
  @Patch('application/:applicationId/approve-schedule')
  approveSchedule(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.chargesReceiptsService.approveSchedule(applicationId);
  }

  // Reject schedule
  // PATCH /charges-receipts/application/22/reject-schedule
  @Patch('application/:applicationId/reject-schedule')
  rejectSchedule(
    @Param('applicationId', ParseIntPipe) applicationId: number,
  ) {
    return this.chargesReceiptsService.rejectSchedule(applicationId);
  }

  // Update single charge
  // PATCH /charges-receipts/5
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.chargesReceiptsService.update(id, body);
  }

  // Mark charge paid
  // PATCH /charges-receipts/5/mark-paid
  @Patch(':id/mark-paid')
  markPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.chargesReceiptsService.markPaid(id, body);
  }

  // Waive charge
  // PATCH /charges-receipts/5/waive
  @Patch(':id/waive')
  waiveCharge(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.chargesReceiptsService.waiveCharge(id, body);
  }

  // Refund charge
  // PATCH /charges-receipts/5/refund
  @Patch(':id/refund')
  refundCharge(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.chargesReceiptsService.refundCharge(id, body);
  }

  // Delete charge
  // DELETE /charges-receipts/5
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.chargesReceiptsService.remove(id);
  }


  @Post('application/:applicationId/payment-link')
async createPaymentLink(@Param('applicationId') applicationId: string) {
  return this.chargesReceiptsService.createEasebuzzPaymentLink(
    Number(applicationId),
  );
}
}