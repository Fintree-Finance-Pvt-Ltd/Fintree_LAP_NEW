import {
  Module,
} from '@nestjs/common';

import {
  TypeOrmModule,
} from '@nestjs/typeorm';

import { OtpSession } from './entities/otp-session.entity';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';
import { SmsService } from './sms/sms.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OtpSession,
    ]),
  ],

  controllers: [
    OtpController,
  ],

  providers: [
    OtpService,
    SmsService,
  ],

  exports: [
    OtpService,
  ],
})
export class OtpModule {}