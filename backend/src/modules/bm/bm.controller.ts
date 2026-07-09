

import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";

import { BmReviewsService } from "./bm.service";
import { CurrentUser } from "src/common/decorators/current-user.decorator";

@Controller("bm-reviews")
export class BmController {
  constructor(
    private readonly bmReviewsService: BmReviewsService,
  ) { }

  // GET /api/bm-reviews/queue
  @Get("queue")
  async getSubmittedToBmCases() {
    const applications =
      await this.bmReviewsService.getSubmittedToBmCases();

    return {
      success: true,
      applications,
    };
  }


  @Get("approved")
  async getApprovedToBmCases() {
    const applications =
      await this.bmReviewsService.getApprovedToBmCases();

    return {
      success: true,
      applications,
    };
  }


  @Get("charges-approved")
  async getChargesApproved() {
    const charges =
      await this.bmReviewsService.getChargesApprovedToBm();

    return {
      success: true,
      charges,
    };
  }


  @Post('approve-charge/:chargeId')
  async approveCharge(
    @Param('chargeId', ParseIntPipe) chargeId: number,
  ) {
    return this.bmReviewsService.approveCharge(chargeId);
  }



  // GET /api/bm-reviews/application/25
  @Get("application/:applicationId")
  async getReview(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.bmReviewsService.getReview(
        applicationId,
      );

    return {
      success: true,
      data,
    };
  }
}