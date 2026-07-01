import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from '../applications/entities/application.entity';
import { Document } from '../documents/entities/document.entity';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';

import { FieldVisitsController } from './field-visits.controller';
import { FieldVisitsService } from './field-visits.service';
import { Visit } from './entities/visit.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visit,
      Document,
      Application,
      WorkflowLog,
    ]),
  ],

  controllers: [
    FieldVisitsController,
  ],

  providers: [
    FieldVisitsService,
  ],

  exports: [
    FieldVisitsService,
  ],
})
export class FieldVisitsModule {}