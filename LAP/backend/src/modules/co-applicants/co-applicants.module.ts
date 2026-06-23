import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { CoApplicantsController } from './co-applicants.controller';
import { CoApplicantsService } from './co-applicants.service';
import { CoApplicant } from './entities/co-applicant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CoApplicant, Application])],
  controllers: [CoApplicantsController],
  providers: [CoApplicantsService],
  exports: [CoApplicantsService]
})
export class CoApplicantsModule {}
