import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ length: 120 }) name: string;
  @Column({ length: 180, unique: true }) email: string;
  @Column({ name: 'password_hash', length: 255 }) passwordHash: string;
  @Column({ default: true }) isActive: boolean;
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({ name: 'user_roles' })
  roles: Role[];
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true }) updatedBy?: number;
}
