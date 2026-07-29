import {
  Controller,
  Get,
} from '@nestjs/common';

import { PermissionsService } from './permissions.service';

@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly permissionsService: PermissionsService,
  ) {}

  /*
   * GET /permissions
   * Fetch all available system permissions.
   */
  @Get()
  async findAll() {
    const permissions =
      await this.permissionsService.findAll();

    return {
      success: true,
      permissions,
    };
  }
}