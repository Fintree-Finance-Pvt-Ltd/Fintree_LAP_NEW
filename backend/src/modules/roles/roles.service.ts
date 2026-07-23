import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async findAll(): Promise<Array<{ id: number; name: string }>> {
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
}