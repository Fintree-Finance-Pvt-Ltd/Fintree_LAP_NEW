

import { Module } from "@nestjs/common";

import { OpsController } from "./ops.controller";
import { OpsService } from "./ops.service";
import { WorkflowModule } from "../workflow/workflow.module";

@Module({
  imports: [WorkflowModule],
  controllers: [OpsController],
  providers: [OpsService],
  exports: [OpsService],
})
export class OpsModule {}
