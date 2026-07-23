import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Partner } from './entities/partner.entity';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Partner]),
  ],
  controllers: [PartnerController],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}