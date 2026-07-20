import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { KycVerificationStatus } from './entities/kyc-verification-status.entity';
import { VarificationController } from './varification.controller';
import { VarificationService } from './varification.service';
import { AadhaarWebhookController } from './aadhaar-webhook.controller';


@Module({
  imports: [
    TypeOrmModule.forFeature([
      CustomerProfile,
      Application,
      KycVerificationStatus,
    ]),
  ],
 controllers: [
    VarificationController,
    AadhaarWebhookController,
  ],
  providers: [VarificationService],
  exports: [VarificationService],
})
export class VarificationModule {}