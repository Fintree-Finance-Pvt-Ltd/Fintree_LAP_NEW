import dataSource from '../database';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { seedOrganization } from './organization.seed';
import { seedPermissions } from './permission.seed';
import { seedRoles } from './role.seed';
import { seedUsers } from './admin-user.seed';

async function run() {
  await dataSource.initialize();
  await seedOrganization(dataSource);
  await seedPermissions(dataSource.getRepository(Permission));
  await seedRoles(dataSource.getRepository(Role));
  await seedUsers(dataSource);
  await dataSource.destroy();
}

run().catch(async (error) => {
  console.error(error);
  if (dataSource.isInitialized) await dataSource.destroy();
  process.exit(1);
});
