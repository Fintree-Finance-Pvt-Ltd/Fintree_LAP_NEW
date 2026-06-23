import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workflow_history')
export class WorkflowHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @Column({ name: 'from_role', length: 60 }) fromRole: string;
  @Column({ name: 'to_role', length: 60 }) toRole: string;
  @Column({ length: 80 }) action: string;
  @Column({ type: 'text' }) remarks: string;
  @Column({ name: 'action_by', type: 'bigint', unsigned: true, nullable: true }) actionBy?: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
