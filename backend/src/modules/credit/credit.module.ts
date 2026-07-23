// src/modules/credit/credit.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import { CreditController } from './credit.controller';
import { CreditService } from './credit.service';
import { CreditAssessment } from './entities/credit-assessment.entity';

@Module({
  imports: [
    WorkflowModule,
    TypeOrmModule.forFeature([
      Application,
      Workflow,
      WorkflowHistory,
      AuditLog,
      CreditAssessment,
    ]),
  ],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
