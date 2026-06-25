// import { Module } from "@nestjs/common";
// import { BmController } from "./bm.controller";
// import { BmService } from "./bm.service";

// @Module({
//   controllers: [BmController],
//   providers: [BmService],
//   exports: [BmService],
// })
// export class BmModule {}



import { Module } from "@nestjs/common";

import { BmController } from "./bm.controller";
import { BmReviewsService } from "./bm.service";

@Module({
  controllers: [BmController],
  providers: [BmReviewsService],
  exports: [BmReviewsService],
})
export class BmModule {}