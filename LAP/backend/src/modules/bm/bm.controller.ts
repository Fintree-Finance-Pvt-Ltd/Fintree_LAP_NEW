

import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from "@nestjs/common";

import { BmReviewsService } from "./bm.service";

@Controller("bm-reviews")
export class BmController {
  constructor(
    private readonly bmReviewsService: BmReviewsService,
  ) {}

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