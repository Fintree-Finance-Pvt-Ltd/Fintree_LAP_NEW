import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ApplicationStage } from '../../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';
import { WorkflowAction } from '../../../common/enums/workflow-action.enum';
import { Application } from '../../applications/entities/application.entity';

@Entity('workflow')
export class Workflow {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true, unique: true }) applicationId: number;
  @OneToOne(() => Application, (application) => application.workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
  @Column({ name: 'current_stage', type: 'enum', enum: ApplicationStage }) currentStage: ApplicationStage;
  @Column({ name: 'current_status', type: 'enum', enum: ApplicationStatus }) currentStatus: ApplicationStatus;
  @Column({ name: 'assigned_to', length: 60, nullable: true }) assignedTo?: string;
  @Column({ name: 'current_owner', type: 'bigint', unsigned: true, nullable: true }) currentOwner?: number;
  @Column({ name: 'last_action', type: 'enum', enum: WorkflowAction }) lastAction: WorkflowAction;
  @Column({ name: 'last_remarks', type: 'text', nullable: true }) lastRemarks?: string;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
