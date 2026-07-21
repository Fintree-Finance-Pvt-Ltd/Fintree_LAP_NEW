import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity';

export enum ValuationAssessmentStatus {
  DRAFT = 'DRAFT',
  QUERY = 'QUERY',
  NEGATIVE = 'NEGATIVE',
  APPROVED_TO_LEGAL = 'APPROVED_TO_LEGAL',
}

@Entity('valuation_assessments')
@Index('idx_valuation_assessment_application_id', ['applicationId'], {
  unique: true,
})
@Index('idx_valuation_assessment_status', ['assessmentStatus'])
export class ValuationAssessment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'applicationId', type: 'bigint', unsigned: true })
  applicationId: number;

  @Column({
    type: 'varchar',
    length: 40,
    default: ValuationAssessmentStatus.DRAFT,
  })
  assessmentStatus: ValuationAssessmentStatus;

  @Column({ type: 'varchar', length: 150, nullable: true })
  valuer?: string;

  @Column({ type: 'date', nullable: true })
  visitDate?: Date;

  @Column({ type: 'varchar', length: 80, nullable: true })
  propertyArea?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  occupancy?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  constructionQuality?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  residualLife?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  marketability?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  propertyRiskGrade?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  marketValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  distressValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  realisableValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  recommendedValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  requestedLoan?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  indicativeLtv?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  ltvOnRecommendedValue?: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  valuationStatus?: string;

  @Column({ type: 'text', nullable: true })
  technicalRemarks?: string;

  @Column({ type: 'text', nullable: true })
  queryRemarks?: string;

  @Column({ type: 'text', nullable: true })
  negativeRemarks?: string;

  @Column({ type: 'text', nullable: true })
  legalInstructions?: string;

  @Column({ type: 'longtext', nullable: true })
  comparablesJson?: string;

  @Column({ type: 'longtext', nullable: true })
  customerSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  propertySnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  valuationPayload?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  submittedBy?: number;

  @Column({ type: 'datetime', nullable: true })
  submittedAt?: Date;

  @CreateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @ManyToOne(() => Application, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;
}