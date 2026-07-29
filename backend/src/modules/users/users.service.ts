import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import {
  InjectRepository,
} from "@nestjs/typeorm";

import {
  Repository,
} from "typeorm";

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

interface UpdateUserPayload {
  name: string;
  email: string;
  roleId: number;
  location: string;
  password?: string;
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
   * Fetch all active users with their assigned roles.
   *
   * Password hash is never selected or returned.
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
        .where(
          "user.isActive = :isActive",
          {
            isActive: true,
          },
        )
        .orderBy(
          "user.id",
          "DESC",
        )
        .getMany();

    return users.map((user) =>
      this.formatUser(user),
    );
  }

  /*
   * Existing access-list method.
   *
   * Inactive/deleted users are excluded.
   */
  async getAccessList() {
    const users =
      await this.userRepository.find({
        select: {
          id: true,
          name: true,
          email: true,
        },

        where: {
          isActive: true,
        },

        order: {
          name: "ASC",
        },
      });

    return users.map((user) => ({
      id: Number(user.id),
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
   * Update user information and assigned role.
   *
   * The operation runs in one transaction because
   * both users and user_roles may be updated.
   */
  async updateUser(
    userId: number,
    payload: UpdateUserPayload,
  ) {
    const name =
      payload.name?.trim();

    const email =
      payload.email
        ?.trim()
        .toLowerCase();

    const location =
      payload.location?.trim();

    const roleId =
      Number(payload.roleId);

    const password =
      payload.password?.trim();

    if (
      !name ||
      !email ||
      !location ||
      !Number.isInteger(roleId) ||
      roleId <= 0
    ) {
      throw new BadRequestException(
        "Name, email, role and location are required.",
      );
    }

    return this.userRepository
      .manager
      .transaction(
        async (manager) => {
          const userRepository =
            manager.getRepository(User);

          const roleRepository =
            manager.getRepository(Role);

          /*
           * Load the user with the existing role
           * relation so TypeORM can update user_roles.
           */
          const user =
            await userRepository.findOne({
              where: {
                id: userId,
              },

              relations: {
                roles: true,
              },
            });

          if (!user) {
            throw new NotFoundException(
              "User not found.",
            );
          }

          if (!user.isActive) {
            throw new BadRequestException(
              "Inactive users cannot be updated.",
            );
          }

          /*
           * Check whether another user already uses
           * the submitted email address.
           */
          const duplicateEmailUser =
            await userRepository
              .createQueryBuilder(
                "existingUser",
              )
              .select([
                "existingUser.id",
              ])
              .where(
                "LOWER(existingUser.email) = LOWER(:email)",
                {
                  email,
                },
              )
              .andWhere(
                "existingUser.id != :userId",
                {
                  userId,
                },
              )
              .getOne();

          if (duplicateEmailUser) {
            throw new ConflictException(
              "A user with this email already exists.",
            );
          }

          const selectedRole =
            await roleRepository.findOne({
              where: {
                id: roleId,
              },
            });

          if (!selectedRole) {
            throw new NotFoundException(
              "Selected role was not found.",
            );
          }

          user.name = name;
          user.email = email;
          user.location = location;

          /*
           * Replace the current assigned role.
           *
           * Existing create-user logic assigns one
           * role, so update follows the same logic.
           */
          user.roles = [
            selectedRole,
          ];

          /*
           * Only update the password when the admin
           * entered a new password.
           */
          if (password) {
            user.passwordHash =
              await bcrypt.hash(
                password,
                12,
              );
          }

          await userRepository.save(
            user,
          );

          /*
           * Reload user with role relation to return
           * a clean response.
           */
          const updatedUser =
            await userRepository.findOne({
              where: {
                id: userId,
              },

              relations: {
                roles: true,
              },
            });

          if (!updatedUser) {
            throw new NotFoundException(
              "Updated user could not be loaded.",
            );
          }

          return this.formatUser(
            updatedUser,
          );
        },
      );
  }

  /*
   * Soft delete user.
   *
   * The database record is preserved for audit
   * and reference purposes.
   */
  async deleteUser(
  userId: number,
) {
  return this.userRepository.manager.transaction(
    async (manager) => {
      const userRepository =
        manager.getRepository(User);

      const user =
        await userRepository.findOne({
          where: {
            id: userId,
          },
          relations: {
            roles: true,
          },
        });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${userId} was not found.`,
        );
      }

      /*
       * Remove mappings from user_roles through
       * the TypeORM relation first.
       *
       * This avoids foreign-key errors without
       * directly depending on join-table columns.
       */
      if (user.roles?.length) {
        await manager
          .createQueryBuilder()
          .relation(User, "roles")
          .of(userId)
          .remove(
            user.roles.map(
              (role) => role.id,
            ),
          );
      }

      /*
       * Physically delete the user row.
       */
      const deleteResult =
        await userRepository.delete(
          userId,
        );

      if (
        !deleteResult.affected ||
        deleteResult.affected < 1
      ) {
        throw new BadRequestException(
          "Unable to delete user from the database.",
        );
      }

      /*
       * Confirm that the row no longer exists.
       */
      const deletedUser =
        await userRepository.findOne({
          where: {
            id: userId,
          },
        });

      if (deletedUser) {
        throw new BadRequestException(
          "User still exists after delete operation.",
        );
      }

      return {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        deleted: true,
      };
    },
  );
}
  /*
   * Fetch active users with their assigned role
   * and permissions.
   *
   * This executes as one joined database query.
   */
  async getUsersWithRolePermissions() {
    const users =
      await this.userRepository
        .createQueryBuilder("user")
        .leftJoinAndSelect(
          "user.roles",
          "role",
        )
        .leftJoinAndSelect(
          "role.permissions",
          "permission",
        )
        .select([
          "user.id",
          "user.name",
          "user.email",
          "user.location",
          "user.isActive",

          "role.id",
          "role.name",

          "permission.id",
          "permission.code",
          "permission.name",
        ])
        .where(
          "user.isActive = :isActive",
          {
            isActive: true,
          },
        )
        .orderBy(
          "user.id",
          "DESC",
        )
        .addOrderBy(
          "role.name",
          "ASC",
        )
        .addOrderBy(
          "permission.name",
          "ASC",
        )
        .getMany();

    return users.map((user) => {
      const assignedRole =
        user.roles?.[0] ?? null;

      const permissionMap =
        new Map<
          number,
          {
            id: number;
            code: string;
            name: string;
          }
        >();

      /*
       * Supports one role now and remains safe
       * if multiple roles are assigned later.
       */
      for (
        const role of
        user.roles ?? []
      ) {
        for (
          const permission of
          role.permissions ?? []
        ) {
          permissionMap.set(
            Number(permission.id),
            {
              id: Number(
                permission.id,
              ),
              code:
                permission.code,
              name:
                permission.name,
            },
          );
        }
      }

      return {
        userId: Number(user.id),

        name: user.name,

        email: user.email,

        /*
         * Required to prefill the Edit User modal.
         */
        location:
          user.location || "",

        isActive:
          Boolean(user.isActive),

        status:
          user.isActive
            ? "Active"
            : "Inactive",

        role: assignedRole
          ? {
              id: Number(
                assignedRole.id,
              ),
              name:
                assignedRole.name,
            }
          : null,

        permissions: Array.from(
          permissionMap.values(),
        ).sort(
          (
            first,
            second,
          ) =>
            first.name.localeCompare(
              second.name,
            ),
        ),
      };
    });
  }

  /*
   * Common response formatter.
   *
   * Password hash and internal fields are never
   * returned.
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
            (role) =>
              role.name,
          )
          .join(", ") ||
        "Not Assigned",

      roles:
        user.roles?.map(
          (role) => ({
            id: Number(
              role.id,
            ),
            name: role.name,
          }),
        ) ?? [],

      location:
        user.location ||
        "Not Assigned",

      isActive:
        Boolean(user.isActive),

      status:
        user.isActive
          ? "Active"
          : "Inactive",
    };
  }
}