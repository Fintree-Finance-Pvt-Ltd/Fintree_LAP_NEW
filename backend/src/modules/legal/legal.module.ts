import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LegalController } from './legal.controller';
import { LegalService } from './legal.service';

import { Application } from '../applications/entities/application.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application]),
  ],
  controllers: [LegalController],
  providers: [LegalService],
})
export class LegalModule {}