// src/modules/credit/entities/credit-assessment.entity.ts

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

export enum CreditAssessmentStatus {
  CM_DRAFT = 'CM_DRAFT',
  CM_RECOMMENDED = 'CM_RECOMMENDED',
  CM_HOLD_QUERY = 'CM_HOLD_QUERY',
  CM_REJECTED = 'CM_REJECTED',

  MAKER_DRAFT = 'MAKER_DRAFT',
  MAKER_QUERY = 'MAKER_QUERY',
  MAKER_SUBMITTED = 'MAKER_SUBMITTED',

  CHECKER_APPROVED = 'CHECKER_APPROVED',
  CHECKER_RETURNED = 'CHECKER_RETURNED',
  CHECKER_REJECTED = 'CHECKER_REJECTED',
}

export enum CreditDecision {
  RECOMMEND = 'RECOMMEND',
  HOLD_QUERY = 'HOLD_QUERY',
  REJECT = 'REJECT',
  APPROVE = 'APPROVE',
  RETURN_TO_MAKER = 'RETURN_TO_MAKER',
}

@Entity('credit_assessments')
@Index('idx_credit_assessment_application_id', ['applicationId'], {
  unique: true,
})
@Index('idx_credit_assessment_status', ['assessmentStatus'])
export class CreditAssessment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'applicationId', type: 'bigint', unsigned: true })
  applicationId: number;

  @Column({
    type: 'varchar',
    length: 40,
    default: CreditAssessmentStatus.CM_DRAFT,
  })
  assessmentStatus: CreditAssessmentStatus;

  // =========================
  // CM SCREENING DATA
  // =========================

  @Column({ type: 'varchar', length: 40, nullable: true })
  cmDecision?: CreditDecision;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cmRecommendedAmount?: string;

  @Column({ type: 'int', nullable: true })
  cmRiskScore?: number;

  @Column({ type: 'text', nullable: true })
  cmRemarks?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  verifiedIncome?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  existingObligations?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  foir?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  propertyValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  requestedLoan?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  indicativeLtv?: string;

  @Column({ type: 'int', nullable: true })
  bureauScore?: number;

  @Column({ type: 'int', nullable: true })
  currentDpd?: number;

  @Column({ type: 'int', nullable: true })
  dpd30In12m?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  writtenOffSettled?: string;

  @Column({ type: 'int', nullable: true })
  recentEnquiries?: number;

  @Column({ type: 'varchar', length: 80, nullable: true })
  commercialBureau?: string;

  @Column({ type: 'longtext', nullable: true })
  cmPayload?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  cmSubmittedBy?: number;

  @Column({ type: 'datetime', nullable: true })
  cmSubmittedAt?: Date;

  // =========================
  // CREDIT MAKER DATA
  // =========================

  @Column({ type: 'varchar', length: 40, nullable: true })
  makerDecision?: CreditDecision;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  makerRecommendedAmount?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  makerRecommendedRoi?: string;

  @Column({ type: 'int', nullable: true })
  makerRecommendedTenure?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  makerRiskGrade?: string;

  @Column({ type: 'text', nullable: true })
  makerRemarks?: string;

  @Column({ type: 'longtext', nullable: true })
  makerPayload?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  makerSubmittedBy?: number;

  @Column({ type: 'datetime', nullable: true })
  makerSubmittedAt?: Date;

  // =========================
  // CREDIT CHECKER DATA
  // =========================

  @Column({ type: 'varchar', length: 40, nullable: true })
  checkerDecision?: CreditDecision;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  checkerApprovedAmount?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  checkerApprovedRoi?: string;

  @Column({ type: 'int', nullable: true })
  checkerApprovedTenure?: number;

  @Column({ type: 'text', nullable: true })
  checkerRemarks?: string;

  @Column({ type: 'longtext', nullable: true })
  checkerPayload?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  checkerSubmittedBy?: number;

  @Column({ type: 'datetime', nullable: true })
  checkerSubmittedAt?: Date;

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