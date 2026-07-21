import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Application } from '../applications/entities/application.entity';
import { CreditAssessment } from '../credit/entities/credit-assessment.entity';
import { LoanAccount } from '../loan-accounts/entities/loan-account.entity';
import { Partner } from '../partners/entities/partner.entity';
import { ValuationAssessment } from '../valuation/entities/valuation-assessment.entity';
import { LegalAssessment } from './entities/legal-assessment.entity';
import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Application,
      LegalAssessment,
      ValuationAssessment,
      CreditAssessment,
      Partner,
      LoanAccount,
    ]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
  exports: [LegalService],
})
export class LegalModule {}