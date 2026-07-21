// src/modules/legal/entities/legal-assessment.entity.ts

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

export enum LegalAssessmentStatus {
  DRAFT = 'DRAFT',
  QUERY = 'QUERY',
  NEGATIVE = 'NEGATIVE',
  APPROVED_TO_OPS_MAKER = 'APPROVED_TO_OPS_MAKER',
}

@Entity('legal_assessments')
@Index('idx_legal_assessment_application_id', ['applicationId'], {
  unique: true,
})
@Index('idx_legal_assessment_status', ['assessmentStatus'])
export class LegalAssessment {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'applicationId', type: 'bigint', unsigned: true })
  applicationId: number;

  @Column({
    type: 'varchar',
    length: 40,
    default: LegalAssessmentStatus.DRAFT,
  })
  assessmentStatus: LegalAssessmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  propertyAddress?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  propertyType?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  currentOwner?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  lawFirmAdvocate?: string;

  @Column({ type: 'date', nullable: true })
  assignmentDate?: Date;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mortgageMethod?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  titleStatus?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  encumbranceStatus?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cersaiResult?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  finalLegalStatus?: string;

  @Column({ type: 'text', nullable: true })
  conditions?: string;

  @Column({ type: 'text', nullable: true })
  opinionSummary?: string;

  @Column({ type: 'text', nullable: true })
  legalRemarks?: string;

  @Column({ type: 'text', nullable: true })
  queryRemarks?: string;

  @Column({ type: 'text', nullable: true })
  negativeRemarks?: string;

  @Column({ type: 'text', nullable: true })
  opsInstructions?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalReportReference?: string;

  @Column({ type: 'longtext', nullable: true })
  titleChainJson?: string;

  @Column({ type: 'longtext', nullable: true })
  checklistJson?: string;

  @Column({ type: 'longtext', nullable: true })
  customerSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  propertySnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  valuationSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  legalPayload?: string;

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