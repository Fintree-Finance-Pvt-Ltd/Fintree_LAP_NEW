import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { Document } from '../documents/entities/document.entity';
import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Application, Visit, Document, WorkflowHistory, AuditLog])],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService]
})
export class ApplicationsModule {}
