import { Module } from '@nestjs/common';
import { LmsController } from './lms.controller';
import { LmsService } from './lms.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanAccount } from '../loan-accounts/entities/loan-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoanAccount])],
  controllers: [LmsController],
  providers: [LmsService],
})
export class LmsModule {}
