import { Module } from '@nestjs/common';
import { FieldVisitsController } from './field-visits.controller';
import { FieldVisitsService } from './field-visits.service';

@Module({
  controllers: [FieldVisitsController],
  providers: [FieldVisitsService],
  exports: [FieldVisitsService],
})
export class FieldVisitsModule {}
