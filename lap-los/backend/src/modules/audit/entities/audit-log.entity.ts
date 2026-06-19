import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ length: 80 }) action: string;
  @Column({ name: 'entity_name', length: 80 }) entityName: string;
  @Column({ name: 'entity_id', type: 'bigint', unsigned: true, nullable: true }) entityId?: number;
  @Column({ type: 'json', nullable: true }) snapshot?: Record<string, unknown>;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
