import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Permission } from './entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll() {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .select([
        'permission.id',
        'permission.code',
        'permission.name',
      ])
      .orderBy('permission.code', 'ASC')
      .getMany();

    return permissions.map((permission) => ({
      id: Number(permission.id),
      code: permission.code,
      name: permission.name,

      /*
       * Module is generated from the permission code.
       *
       * application:read  -> APPLICATION
       * document:upload   -> DOCUMENT
       * customer-profile:manage -> CUSTOMER PROFILE
       */
      module: String(permission.code)
        .split(':')[0]
        .replace(/-/g, ' ')
        .toUpperCase(),
    }));
  }
}