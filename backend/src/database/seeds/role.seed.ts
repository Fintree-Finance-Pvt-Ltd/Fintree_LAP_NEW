import { Repository } from 'typeorm';
import { RoleCode } from '../../common/enums/role.enum';
import { Role } from '../../modules/roles/entities/role.entity';

export async function seedRoles(repo: Repository<Role>) {
  for (const code of Object.values(RoleCode)) {
    await repo.upsert({ code, name: code.replaceAll('_', ' ') }, ['code']);
  }
}
