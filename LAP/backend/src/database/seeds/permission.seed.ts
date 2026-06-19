import { Repository } from 'typeorm';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permission } from '../../modules/permissions/entities/permission.entity';

export async function seedPermissions(repo: Repository<Permission>) {
  for (const code of Object.values(PERMISSIONS)) {
    await repo.upsert({ code, name: code.replace(':', ' ') }, ['code']);
  }
}
