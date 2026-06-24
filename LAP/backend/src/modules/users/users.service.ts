import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./entities/user.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
  ) {}

  async getAccessList() {
    const users = await this.userRepository.find({
      select: {
        id: true,
        name: true,
        email: true,
    
      },

      order: {
        name: "ASC",
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,

    
    }));
  }
}