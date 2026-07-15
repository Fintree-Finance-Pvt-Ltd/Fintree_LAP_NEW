import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit/entities/audit-log.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Document } from '../documents/entities/document.entity';
import { Visit } from '../visits/entities/visit.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { Application } from './entities/application.entity';
import { LapPaymentWebhookController } from './lap-payment-webhook.controller';
import { LapPaymentsService } from './lap-payments.service';
@Module({
  imports: [TypeOrmModule.forFeature([Application, Visit, Document, WorkflowHistory, Workflow, WorkflowLog, AuditLog, CustomerProfile,
    LapPaymentsService,
    LapPaymentWebhookController
  ])],
  controllers: [ApplicationsController, LapPaymentWebhookController],
  providers: [ApplicationsService, LapPaymentsService],
  exports: [ApplicationsService, LapPaymentsService],
})
export class ApplicationsModule {}
