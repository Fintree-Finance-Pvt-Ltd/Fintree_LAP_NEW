import { DataSource } from 'typeorm';
import { RoleCode } from '../../common/enums/role.enum';
import { hashPassword } from '../../common/utils/hash.util';
import { Permission } from '../../modules/permissions/entities/permission.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';

const users: Array<[string, string, RoleCode]> = [
  ['Admin', 'admin@fintree.in', RoleCode.ADMIN],
  ['RM', 'rm@fintree.in', RoleCode.RM],
  ['BM', 'bm@fintree.in', RoleCode.BM],
  ['CM', 'cm@fintree.in', RoleCode.CM],
  ['Credit Maker', 'credit.maker@fintree.in', RoleCode.CREDIT_MAKER],
  ['Credit Checker', 'credit.checker@fintree.in', RoleCode.CREDIT_CHECKER],
  ['Legal', 'legal@fintree.in', RoleCode.LEGAL],
  ['Valuation', 'valuation@fintree.in', RoleCode.VALUATION],
  ['Sanction', 'sanction@fintree.in', RoleCode.SANCTION],
  ['Ops Maker', 'ops.maker@fintree.in', RoleCode.OPS_MAKER],
  ['Ops Checker', 'ops.checker@fintree.in', RoleCode.OPS_CHECKER],
  ['LMS', 'lms@fintree.in', RoleCode.LMS],
  ['Collection', 'collection@fintree.in', RoleCode.COLLECTION]
];

export async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);
  const permissions = await dataSource.getRepository(Permission).find();
  for (const role of await roleRepo.find()) {
    role.permissions = permissions;
    await roleRepo.save(role);
  }
  for (const [name, email, code] of users) {
    const role = await roleRepo.findOneByOrFail({ code });
    const existing = await userRepo.findOne({ where: { email }, relations: ['roles'] });
    const user = existing ?? userRepo.create({ name, email, passwordHash: await hashPassword('Password@123') });
    user.roles = [role];
    await userRepo.save(user);
  }
}
