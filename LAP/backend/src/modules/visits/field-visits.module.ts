import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Document } from '../documents/entities/document.entity';
import { DocumentsModule } from '../documents/documents.module';

import { Visit } from './entities/visit.entity';
import { FieldVisitsController } from './field-visits.controller';
import { FieldVisitsService } from './field-visits.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Visit,
      Document,
    ]),

    DocumentsModule,
  ],

  controllers: [
    FieldVisitsController,
  ],

  providers: [
    FieldVisitsService,
  ],

  exports: [
    FieldVisitsService,
  ],
})
export class FieldVisitsModule {}