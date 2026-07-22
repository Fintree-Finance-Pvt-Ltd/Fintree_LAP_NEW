import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { CoApplicantsController } from './co-applicants.controller';
import { CoApplicantsService } from './co-applicants.service';
import { CoApplicant } from './entities/co-applicant.entity';
import { KycVerificationStatus } from '../varification/entities/kyc-verification-status.entity';
import { OtpModule } from '../otp/otp.module';
import { CoApplicantVerificationService } from './co-applicant-verification.service';

@Module({
  imports: [OtpModule, TypeOrmModule.forFeature([CoApplicant, Application, KycVerificationStatus])],
  controllers: [CoApplicantsController],
  providers: [CoApplicantsService, CoApplicantVerificationService],
  exports: [CoApplicantsService]
})
export class CoApplicantsModule {}
