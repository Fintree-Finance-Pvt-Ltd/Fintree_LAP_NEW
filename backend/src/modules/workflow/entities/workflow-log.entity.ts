import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkflowLogAction } from '../../../common/enums/workflow-action.enum';

@Entity('workflow_logs')
@Index(
  'idx_workflow_logs_application_action',
  ['applicationId', 'action'],
)
export class WorkflowLog {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Index()
  @Column({
    name: 'application_id',
    type: 'bigint',
    unsigned: true,
  })
  applicationId: number;

  /*
   * Keep database column as VARCHAR.
   * TypeScript restricts the value to WorkflowLogAction.
   */
  @Column({
    type: 'varchar',
    length: 80,
  })
  action: WorkflowLogAction;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks?: string;

  @Column({
    name: 'created_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  createdBy?: number;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  updatedBy?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
    precision: 6,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'datetime',
    precision: 6,
  })
  updatedAt: Date;
}