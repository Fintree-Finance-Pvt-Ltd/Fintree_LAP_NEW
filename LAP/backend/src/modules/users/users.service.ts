import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { User } from "./entities/user.entity";
import * as bcrypt from "bcrypt";
import { Role } from "../roles/entities/role.entity";

interface createUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  location: string;
}


@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository:
      Repository<User>,
      
    @InjectRepository(Role)
    private readonly roleRepository:
      Repository<Role>,
  ) { }

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
  

   async createUser(
    payload: createUserPayload,
  ) {
    const name = payload.name?.trim();

    const email = payload.email
      ?.trim()
      .toLowerCase();

    const password = payload.password;

    const roleName = payload.role?.trim();

    const location =
      payload.location?.trim();

    if (
      !name ||
      !email ||
      !password ||
      !roleName ||
      !location
    ) {
      throw new BadRequestException(
        "Name, email, password, role and location are required.",
      );
    }

    const existingUser =
      await this.userRepository.findOne({
        where: {
          email,
        },
      });

    if (existingUser) {
      throw new ConflictException(
        "A user with this email already exists.",
      );
    }

    /*
     * This assumes your Role entity has a property
     * named "name".
     */
    const selectedRole =
      await this.roleRepository.findOne({
        where: {
          name: roleName,
        },
      });

    if (!selectedRole) {
      throw new NotFoundException(
        `Role "${roleName}" was not found.`,
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const newUser =
      this.userRepository.create({
        name,
        email,
        passwordHash,
        location,
        isActive: true,
        roles: [selectedRole],
      });

    const savedUser =
      await this.userRepository.save(
        newUser,
      );

    /*
     * Reload the user with role relation.
     */
    const createdUser =
      await this.userRepository.findOne({
        where: {
          id: savedUser.id,
        },

        relations: {
          roles: true,
        },
      });

    if (!createdUser) {
      throw new NotFoundException(
        "Created user could not be loaded.",
      );
    }

    return this.formatUser(createdUser);
  }

   private formatUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,

      role:
        user.roles
          ?.map((role) => role.name)
          .join(", ") ||
        "Not Assigned",

      roles:
        user.roles?.map((role) => ({
          id: role.id,
          name: role.name,
        })) ?? [],

      location:
        user.location ||
        "Not Assigned",

      status:
        user.isActive
          ? "Active"
          : "Inactive",
    };
  }


}