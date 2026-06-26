

import { Module } from "@nestjs/common";

import { BmController } from "./bm.controller";
import { BmReviewsService } from "./bm.service";

@Module({
  controllers: [BmController],
  providers: [BmReviewsService],
  exports: [BmReviewsService],
})
export class BmModule {}