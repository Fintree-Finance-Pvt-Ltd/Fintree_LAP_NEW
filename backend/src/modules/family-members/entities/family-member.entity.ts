import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Application } from '../../applications/entities/application.entity';

@Entity('family_members')
export class FamilyMember {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'application_id', type: 'bigint', unsigned: true })
  applicationId: number;

  @ManyToOne(() => Application, (application) => application.familyMembers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ length: 140 })
  name: string;

  @Column({ length: 50 })
  relation: string;

  @Column({ type: 'int', nullable: true })
  age?: number;

  @Column({ length: 120, nullable: true })
  occupation?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  income?: number;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;
}
