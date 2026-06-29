import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import { GeoService } from './geo.service';

@Controller('applications')
export class GeoController {
  constructor(
    private readonly geoService:
      GeoService,
  ) {}

  @Post(':applicationId/geo-location')
  saveLiveLocation(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,

    @Body()
    body: {
      locationType?: string;
      latitude?: number | string;
      longitude?: number | string;
      accuracyMeters?: number | string;
      gpsAddress?: string;
    },
  ) {
    return this.geoService.saveLiveLocation(
      applicationId,
      body,
    );
  }

  @Get(':applicationId/geo-locations')
  getLiveLocations(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.geoService.getLiveLocations(
      applicationId,
    );
  }
}