import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';
import { User } from '../../users/entities/user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ length: 60, unique: true }) code: string;
  @Column({ length: 120 }) name: string;
  @ManyToMany(() => Permission, (permission) => permission.roles, { eager: true })
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
