import {
  Body,
  Controller,
  Get,
  Post,
} from "@nestjs/common";

import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
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
      await this.usersService.getAccessList();

    return {
      success: true,
      users,
    };
  }

  /*
   * POST /users
   * Existing create-user API remains unchanged.
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
    },
  ) {
    const user =
      await this.usersService.createUser(
        body,
      );

    return {
      success: true,
      message: "User created successfully.",
      user,
    };
  }
}