import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import { Organization } from '../../auth/entities/organization.entity';

import { HubController } from './hub.controller';
import { HubService } from './hub.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hub,
      Organization,
    ]),
  ],
  controllers: [HubController],
  providers: [HubService],
  exports: [HubService],
})
export class HubModule {}