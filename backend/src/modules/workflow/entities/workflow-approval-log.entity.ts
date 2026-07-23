import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('workflow_approval_logs')
@Index('idx_workflow_approval_application', ['applicationId'])
@Index('idx_workflow_approval_workflow', ['workflowId'])
@Index('idx_workflow_approval_action', ['action'])
@Index('idx_workflow_approval_decision', ['decision'])
@Index('idx_workflow_approval_actor', ['actorUserId'])
@Index('idx_workflow_approval_actor_role', ['actorRole'])
@Index('idx_workflow_approval_to_stage', ['toStage'])
@Index('idx_workflow_approval_to_status', ['toStatus'])
@Index('idx_workflow_approval_created', ['createdAt'])
export class WorkflowApprovalLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true })
  applicationId: number;
  @Column({ name: 'workflow_id', type: 'bigint', unsigned: true, nullable: true })
  workflowId?: number;
  @Column({ type: 'varchar', length: 100 })
  action: string;
  @Column({ type: 'varchar', length: 100, nullable: true })
  decision?: string;
  @Column({ name: 'from_stage', type: 'varchar', length: 50, nullable: true })
  fromStage?: string;
  @Column({ name: 'from_status', type: 'varchar', length: 80, nullable: true })
  fromStatus?: string;
  @Column({ name: 'to_stage', type: 'varchar', length: 50 })
  toStage: string;
  @Column({ name: 'to_status', type: 'varchar', length: 80 })
  toStatus: string;
  @Column({ name: 'actor_user_id', type: 'bigint', unsigned: true, nullable: true })
  actorUserId?: number;
  @Column({ name: 'actor_name', type: 'varchar', length: 255, nullable: true })
  actorName?: string;
  @Column({ name: 'actor_email', type: 'varchar', length: 255, nullable: true })
  actorEmail?: string;
  @Column({ name: 'actor_role', type: 'varchar', length: 100, nullable: true })
  actorRole?: string;
  @Column({ name: 'assigned_to_role', type: 'varchar', length: 100, nullable: true })
  assignedToRole?: string;
  @Column({ name: 'assigned_to_user_id', type: 'bigint', unsigned: true, nullable: true })
  assignedToUserId?: number;
  @Column({ type: 'text', nullable: true })
  remarks?: string;
  @Column({ type: 'longtext', nullable: true })
  payload?: string;
  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
