import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity';

@Entity('application_workflows')
@Index('idx_application_workflows_stage', ['currentStage'])
@Index('idx_application_workflows_status', ['currentStatus'])
@Index('idx_application_workflows_assigned_role', ['currentAssignedRole'])
@Index('idx_application_workflows_last_action_by', ['lastActionBy'])
@Index('idx_application_workflows_updated_at', ['updatedAt'])
export class Workflow {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'application_id', type: 'bigint', unsigned: true, unique: true })
  applicationId: number;

  @OneToOne(() => Application, (application) => application.workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ name: 'current_stage', type: 'varchar', length: 50 })
  currentStage: string;

  @Column({ name: 'current_status', type: 'varchar', length: 80 })
  currentStatus: string;

  @Column({ name: 'previous_stage', type: 'varchar', length: 50, nullable: true })
  previousStage?: string;

  @Column({ name: 'previous_status', type: 'varchar', length: 80, nullable: true })
  previousStatus?: string;

  @Column({ name: 'current_assigned_role', type: 'varchar', length: 80, nullable: true })
  currentAssignedRole?: string;

  @Column({ name: 'current_assigned_user_id', type: 'bigint', unsigned: true, nullable: true })
  currentAssignedUserId?: number;

  @Column({ name: 'last_action', type: 'varchar', length: 100, nullable: true })
  lastAction?: string;

  @Column({ name: 'last_decision', type: 'varchar', length: 100, nullable: true })
  lastDecision?: string;

  @Column({ name: 'last_remarks', type: 'text', nullable: true })
  lastRemarks?: string;

  @Column({ name: 'last_action_by', type: 'bigint', unsigned: true, nullable: true })
  lastActionBy?: number;

  @Column({ name: 'last_action_by_name', type: 'varchar', length: 255, nullable: true })
  lastActionByName?: string;

  @Column({ name: 'last_action_by_role', type: 'varchar', length: 100, nullable: true })
  lastActionByRole?: string;

  @Column({ name: 'last_action_at', type: 'datetime', precision: 6, nullable: true })
  lastActionAt?: Date;

  @Column({ name: 'rm_field_visit_required', default: false })
  rmFieldVisitRequired: boolean;

  @Column({ name: 'rm_field_visit_completed', default: false })
  rmFieldVisitCompleted: boolean;

  @Column({ name: 'rm_geo_required', default: false })
  rmGeoRequired: boolean;

  @Column({ name: 'rm_geo_completed', default: false })
  rmGeoCompleted: boolean;

  @Column({ name: 'valuation_field_visit_required', default: false })
  valuationFieldVisitRequired: boolean;

  @Column({ name: 'valuation_field_visit_completed', default: false })
  valuationFieldVisitCompleted: boolean;

  @Column({ name: 'valuation_geo_required', default: false })
  valuationGeoRequired: boolean;

  @Column({ name: 'valuation_geo_completed', default: false })
  valuationGeoCompleted: boolean;

  @Column({ name: 'is_terminal', default: false })
  isTerminal: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  // Backward-compatible aliases used by existing modules.
  get assignedTo() { return this.currentAssignedRole; }
  set assignedTo(value: string | undefined) { this.currentAssignedRole = value; }
  get currentOwner() { return this.currentAssignedUserId; }
  set currentOwner(value: number | undefined) { this.currentAssignedUserId = value; }
}
