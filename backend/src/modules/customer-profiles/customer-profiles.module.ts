import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { CustomerProfilesController } from './customer-profiles.controller';
import { CustomerProfilesService } from './customer-profiles.service';
import { CustomerProfile } from './entities/customer-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile, Application])],
  controllers: [CustomerProfilesController],
  providers: [CustomerProfilesService],
  exports: [CustomerProfilesService]
})
export class CustomerProfilesModule {}
