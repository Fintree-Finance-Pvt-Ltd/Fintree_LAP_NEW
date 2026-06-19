import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, VersionColumn } from 'typeorm';
import { ApplicationStage } from '../../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_number', length: 40, unique: true }) applicationNumber: string;
  @Column({ name: 'customer_name', length: 160 }) customerName: string;
  @Column({ length: 20 }) mobile: string;
  @Column({ length: 10, nullable: true }) pan?: string;
  @Column({ name: 'requested_amount', type: 'decimal', precision: 15, scale: 2, default: 0 }) requestedAmount: string;
  @Column({ type: 'enum', enum: ApplicationStage, default: ApplicationStage.LEAD }) stage: ApplicationStage;
  @Column({ type: 'enum', enum: ApplicationStatus, default: ApplicationStatus.DRAFT }) status: ApplicationStatus;
  @VersionColumn() version: number;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true }) updatedBy?: number;
}
