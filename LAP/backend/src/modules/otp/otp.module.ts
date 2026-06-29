
import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { OtpSession } from './entities/otp-session.entity';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SmsService } from './sms/sms.service';

import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { Workflow } from '../workflow/entities/workflow.entity';
import { WorkflowHistory } from '../workflow/entities/workflow-history.entity';
import { EmailService } from './email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OtpSession,
      Application,
      CustomerProfile,
      Workflow,
      WorkflowHistory,
    ]),
  ],

  controllers: [
    OtpController,
  ],

  providers: [
    OtpService,
    SmsService,
    EmailService,
  ],

  exports: [
    OtpService,
  ],
})
export class OtpModule {}

