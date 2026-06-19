import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('visits')
export class Visit {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @Column({ name: 'visit_type', length: 40 }) visitType: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) latitude?: string;
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true }) longitude?: string;
  @Column({ type: 'text', nullable: true }) remarks?: string;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true }) updatedBy?: number;
}
