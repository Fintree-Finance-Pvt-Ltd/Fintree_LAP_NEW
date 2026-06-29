import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationGeoLocation } from './entities/geo-location.entity';
import { GeoController } from './geo.controller';
import { GeoService } from './geo.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationGeoLocation,
    ]),
  ],
  controllers: [
    GeoController,
  ],
  providers: [
    GeoService,
  ],
  exports: [
    GeoService,
  ],
})
export class GeoModule {}