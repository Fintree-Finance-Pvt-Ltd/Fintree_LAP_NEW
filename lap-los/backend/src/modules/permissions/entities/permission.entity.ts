import { Column, CreateDateColumn, Entity, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Role } from '../../roles/entities/role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ length: 120, unique: true }) code: string;
  @Column({ length: 160 }) name: string;
  @ManyToMany(() => Role, (role) => role.permissions) roles: Role[];
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
