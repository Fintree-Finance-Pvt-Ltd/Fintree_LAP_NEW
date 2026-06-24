import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workflow_logs')
export class WorkflowLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @Column({ length: 80 }) action: string;
  @Column({ type: 'text', nullable: true }) remarks?: string;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
