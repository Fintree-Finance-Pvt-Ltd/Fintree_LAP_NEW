import { Injectable, BadRequestException, NotFoundException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { Role } from './entities/role.entity';

// @Injectable()
// export class RolesService {
//   constructor(
//     @InjectRepository(Role)
//     private readonly roleRepository: Repository<Role>,
//   ) {}

//   async findAll(): Promise<Array<{ id: number; name: string }>> {
//     const roles = await this.roleRepository
//       .createQueryBuilder('role')
//       .select([
//         'role.id',
//         'role.name',
//       ])
//       .orderBy('role.name', 'ASC')
//       .getMany();

//     return roles.map((role) => ({
//       id: Number(role.id),
//       name: role.name,
//     }));
//   }
// }

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  /*
   * Existing role dropdown API.
   */
  async findAll(): Promise<
    Array<{
      id: number;
      name: string;
    }>
  > {
    const roles = await this.roleRepository
      .createQueryBuilder('role')
      .select([
        'role.id',
        'role.name',
      ])
      .orderBy('role.name', 'ASC')
      .getMany();

    return roles.map((role) => ({
      id: Number(role.id),
      name: role.name,
    }));
  }

  /*
   * Fetch permissions already assigned to a role.
   */
  async getRolePermissions(
    roleId: number,
  ) {
    const role =
      await this.roleRepository.findOne({
        where: {
          id: roleId,
        },

        relations: {
          permissions: true,
        },
      });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} was not found.`,
      );
    }

    const permissions = [
      ...(role.permissions ?? []),
    ].sort((first, second) =>
      first.code.localeCompare(second.code),
    );

    return {
      role: {
        id: Number(role.id),
        name: role.name,
        code: role.code,
      },

      permissionIds: permissions.map(
        (permission) =>
          Number(permission.id),
      ),

      permissions: permissions.map(
        (permission) => ({
          id: Number(permission.id),
          code: permission.code,
          name: permission.name,
        }),
      ),
    };
  }

  /*
   * Replace all existing permissions assigned to a role.
   */
  async updateRolePermissions(
    roleId: number,
    permissionIds: unknown,
  ) {
    if (!Array.isArray(permissionIds)) {
      throw new BadRequestException(
        'permissionIds must be an array.',
      );
    }

    /*
     * Convert received values to numbers and remove duplicates.
     */
    const normalizedPermissionIds = [
      ...new Set(
        permissionIds.map((permissionId) =>
          Number(permissionId),
        ),
      ),
    ];

    const containsInvalidId =
      normalizedPermissionIds.some(
        (permissionId) =>
          !Number.isInteger(permissionId) ||
          permissionId <= 0,
      );

    if (containsInvalidId) {
      throw new BadRequestException(
        'Every permission ID must be a positive integer.',
      );
    }

    const role =
      await this.roleRepository.findOne({
        where: {
          id: roleId,
        },

        relations: {
          permissions: true,
        },
      });

    if (!role) {
      throw new NotFoundException(
        `Role with ID ${roleId} was not found.`,
      );
    }

    /*
     * An empty array is valid.
     * It means remove every permission from the role.
     */
    const permissions =
      normalizedPermissionIds.length > 0
        ? await this.permissionRepository.find({
            where: {
              id: In(
                normalizedPermissionIds,
              ),
            },
          })
        : [];

    /*
     * Make sure every submitted permission exists.
     */
    if (
      permissions.length !==
      normalizedPermissionIds.length
    ) {
      const foundPermissionIds = new Set(
        permissions.map((permission) =>
          Number(permission.id),
        ),
      );

      const missingPermissionIds =
        normalizedPermissionIds.filter(
          (permissionId) =>
            !foundPermissionIds.has(
              permissionId,
            ),
        );

      throw new BadRequestException(
        `Invalid permission IDs: ${missingPermissionIds.join(', ')}`,
      );
    }

    /*
     * TypeORM updates the role_permissions join table.
     */
    role.permissions = permissions;

    await this.roleRepository.save(
      role,
    );

    return this.getRolePermissions(
      roleId,
    );
  }
}