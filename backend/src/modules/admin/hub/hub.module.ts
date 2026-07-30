import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import { Organization } from '../../auth/entities/organization.entity';

import { User } from '../../users/entities/user.entity';

import { HubAdministrationController } from './hub-administration.controller';
import { HubController } from './hub.controller';
import { HubService } from './hub.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hub,
      Organization,
      User,
    ]),
  ],
  controllers: [HubController, HubAdministrationController,],
  providers: [HubService],
  exports: [HubService],
})
export class HubModule {}