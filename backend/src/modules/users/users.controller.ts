import { Body, Controller, Get, Post } from "@nestjs/common";
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

  @Post() async createUser(
    @Body()
      body :{
        name: string;
        email:string;
        password:string;
        role:string;
        location:string;
      },
    ){
    const user= await this.usersService.createUser(body);
       return {
      success: true,
      message: "User created successfully.",
      user,
    };
  }
}