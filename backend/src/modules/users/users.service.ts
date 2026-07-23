import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcrypt from "bcrypt";

import { User } from "./entities/user.entity";
import { Role } from "../roles/entities/role.entity";

interface CreateUserPayload {
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
  ) {}

  /*
   * Fetch all users with their assigned roles.
   *
   * Only the required user and role fields are selected.
   * Password hash is not selected or returned.
   */
  async findAll() {
    const users =
      await this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect(
          "user.roles",
          "role",
        )
        .select([
          "user.id",
          "user.name",
          "user.email",
          "user.location",
          "user.isActive",
          "role.id",
          "role.name",
        ])
        .orderBy("user.id", "DESC")
        .getMany();

    return users.map((user) =>
      this.formatUser(user),
    );
  }

  /*
   * Existing access-list method.
   */
  async getAccessList() {
    const users =
      await this.userRepository.find({
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

  /*
   * Existing create-user method.
   */
  async createUser(
    payload: CreateUserPayload,
  ) {
    const name =
      payload.name?.trim();

    const email =
      payload.email
        ?.trim()
        .toLowerCase();

    const password =
      payload.password;

    const roleName =
      payload.role?.trim();

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
      await bcrypt.hash(
        password,
        12,
      );

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
     * Reload the created user with its role relation.
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

    return this.formatUser(
      createdUser,
    );
  }

  /*
   * Common response formatter.
   *
   * This prevents passwordHash and other internal
   * fields from being returned by the APIs.
   */
  private formatUser(
    user: User,
  ) {
    return {
      id: Number(user.id),

      name: user.name,

      email: user.email,

      role:
        user.roles
          ?.map(
            (role) => role.name,
          )
          .join(", ") ||
        "Not Assigned",

      roles:
        user.roles?.map(
          (role) => ({
            id: Number(role.id),
            name: role.name,
          }),
        ) ?? [],

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