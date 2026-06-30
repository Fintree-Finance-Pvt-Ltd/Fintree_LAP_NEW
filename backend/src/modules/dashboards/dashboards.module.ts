import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from '../applications/entities/application.entity';
import { DashboardsController } from './dashboards.controller';
import { DashboardsService } from './dashboards.service';

@Module({
  imports: [TypeOrmModule.forFeature([Application])],
  controllers: [DashboardsController],
  providers: [DashboardsService]
})
export class DashboardsModule {}
