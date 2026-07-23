import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('api_execution_logs')
@Index('idx_api_execution_logs_created_at', ['createdAt'])
@Index('idx_api_execution_logs_endpoint', ['method', 'endpoint'])
@Index('idx_api_execution_logs_status', ['statusCode'])
@Index('idx_api_execution_user_id', ['userId'])
@Index('idx_api_execution_user_endpoint', ['userId', 'method', 'endpoint'])
@Index('idx_api_execution_created_user', ['createdAt', 'userId'])
export class ApiExecutionLog {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 10 })
  method: string;

  @Column({ type: 'varchar', length: 500 })
  endpoint: string;

  @Column({ type: 'smallint', unsigned: true })
  statusCode: number;

  @Column({ type: 'int', unsigned: true })
  latencyMs: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  requestId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userEmail?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  userRoles?: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;
}
