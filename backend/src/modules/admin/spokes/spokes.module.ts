import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Hub } from '../../auth/entities/hub.entity';
import { Spoke } from '../../auth/entities/spoke.entity';
import { SpokesController } from './spokes.controller';
import { SpokesService } from './spokes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Spoke,
      Hub,
    ]),
  ],
  controllers: [
    SpokesController,
  ],
  providers: [
    SpokesService,
  ],
  exports: [
    SpokesService,
  ],
})
export class SpokesModule {}