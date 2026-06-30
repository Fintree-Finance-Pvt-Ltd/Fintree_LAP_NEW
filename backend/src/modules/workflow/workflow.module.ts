import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { WorkflowHistory } from './entities/workflow-history.entity';
import { WorkflowLog } from './entities/workflow-log.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

@Module({
  imports: [TypeOrmModule.forFeature([Workflow, WorkflowHistory, WorkflowLog, Application, CustomerProfile, Document, Notification, AuditLog])],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService]
})
export class WorkflowModule {}
