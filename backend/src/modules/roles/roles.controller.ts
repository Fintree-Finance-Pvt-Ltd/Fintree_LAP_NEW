import { Body, Controller, Get, Param, ParseIntPipe, Put, } from '@nestjs/common';

import { RolesService } from './roles.service';

@Controller('roles')
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
  ) {}

  /*
   * GET /roles
   * Existing role dropdown API.
   */
  @Get()
  async findAll(): Promise<
    Array<{
      id: number;
      name: string;
    }>
  > {
    return this.rolesService.findAll();
  }

  /*
   * GET /roles/:roleId/permissions
   * Fetch permissions assigned to the selected role.
   */
  @Get(':roleId/permissions')
  async getRolePermissions(
    @Param(
      'roleId',
      ParseIntPipe,
    )
    roleId: number,
  ) {
    const data =
      await this.rolesService.getRolePermissions(
        roleId,
      );

    return {
      success: true,
      ...data,
    };
  }

  /*
   * PUT /roles/:roleId/permissions
   * Replace all permissions assigned to the selected role.
   */
  @Put(':roleId/permissions')
  async updateRolePermissions(
    @Param(
      'roleId',
      ParseIntPipe,
    )
    roleId: number,

    @Body()
    body: {
      permissionIds: number[];
    },
  ) {
    const data =
      await this.rolesService.updateRolePermissions(
        roleId,
        body?.permissionIds,
      );

    return {
      success: true,
      message:
        'Role permissions updated successfully.',
      ...data,
    };
  }
}
