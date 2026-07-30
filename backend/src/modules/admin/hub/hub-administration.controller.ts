import {
  Controller,
  Get,
} from '@nestjs/common';

import { HubService } from './hub.service';

@Controller('hubs')
export class HubAdministrationController {
  constructor(
    private readonly hubService:
      HubService,
  ) {}

  /*
   * GET /api/hubs/administration
   */
  @Get('administration')
  getAdministrationData() {
    return this.hubService
      .getAdministrationData();
  }
}