import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { CustomerProfile } from '../customer-profiles/entities/customer-profile.entity';
import { VarificationController } from './varification.controller';
import { VarificationService } from './varification.service';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, Application])],
  controllers: [VarificationController],
  providers: [VarificationService],
  exports: [VarificationService],
})
export class VarificationModule {}

