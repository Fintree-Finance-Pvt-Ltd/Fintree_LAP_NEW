import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workflow_history')
export class WorkflowHistory {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @Column({ name: 'from_stage', length: 60 }) fromStage: string;
  @Column({ name: 'to_stage', length: 60 }) toStage: string;
  @Column({ length: 80 }) action: string;
  @Column({ type: 'text' }) remarks: string;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
