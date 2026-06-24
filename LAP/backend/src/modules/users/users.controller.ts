import { Controller, Get } from "@nestjs/common";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get("access-list")
  async getAccessList() {
    const users =
      await this.usersService.getAccessList();

    return {
      success: true,
      users,
    };
  }
}