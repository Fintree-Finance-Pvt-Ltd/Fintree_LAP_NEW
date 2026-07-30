import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from "@nestjs/common";

import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService:
      UsersService,
  ) {}

  /*
   * GET /users
   * Fetch all users for the Admin Users page.
   */
  @Get()
  async findAll() {
    const users =
      await this.usersService.findAll();

    return {
      success: true,
      users,
    };
  }

  /*
   * GET /users/access-list
   * Existing API remains unchanged.
   */
  @Get("access-list")
  async getAccessList() {
    const users =
      await this.usersService
        .getAccessList();

    return {
      success: true,
      users,
    };
  }

  /*
   * GET /users/role-access
   * Fetch users with role permissions.
   */
  @Get("role-access")
  async getUsersWithRolePermissions() {
    const users =
      await this.usersService
        .getUsersWithRolePermissions();

    return {
      success: true,
      users,
    };
  }

  /*
   * POST /users
   */
  @Post()
  async createUser(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      role: string;
      location: string;
      partnerId: number;
    },
  ) {
    const user =
      await this.usersService.createUser(
        body,
      );

    return {
      success: true,
      message:
        "User created successfully.",
      user,
    };
  }

  /*
   * PATCH /users/:userId
   * Update user details and assigned role.
   */
  @Patch(":userId")
  async updateUser(
    @Param(
      "userId",
      ParseIntPipe,
    )
    userId: number,

    @Body()
    body: {
      name: string;
      email: string;
      roleId: number;
      location: string;
      password?: string;
    },
  ) {
    const user =
      await this.usersService.updateUser(
        userId,
        body,
      );

    return {
      success: true,
      message:
        "User updated successfully.",
      user,
    };
  }

  /*
   * DELETE /users/:userId
   * Permanently delete the user.
   */
  @Delete(":userId")
  async deleteUser(
    @Param(
      "userId",
      ParseIntPipe,
    )
    userId: number,
  ) {
    const user =
      await this.usersService.deleteUser(
        userId,
      );

    return {
      success: true,
      message:
        "User permanently deleted successfully.",
      user,
    };
  }
}