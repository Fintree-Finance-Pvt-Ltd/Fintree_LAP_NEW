// src/modules/valuation/valuation.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from '../applications/entities/application.entity';
import { WorkflowModule } from '../workflow/workflow.module';
import { ValuationAssessment } from './entities/valuation-assessment.entity';
import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';

@Module({
  imports: [
    WorkflowModule,
    TypeOrmModule.forFeature([
      Application,
      ValuationAssessment,
    ]),
  ],
  controllers: [ValuationController],
  providers: [ValuationService],
  exports: [ValuationService],
})
export class ValuationModule {}
