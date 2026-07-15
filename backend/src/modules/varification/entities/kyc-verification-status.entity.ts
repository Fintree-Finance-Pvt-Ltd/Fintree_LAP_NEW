import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity';

export enum KycOwnerType {
  COMPANY = 'COMPANY',
  APPLICANT = 'APPLICANT',
  CO_APPLICANT = 'CO_APPLICANT',
}

export enum KycVerificationStatusValue {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

@Entity('kyc_verification_status')
@Index('idx_kyc_application_id', ['applicationId'])
@Index('idx_kyc_owner_type', ['ownerType'])
@Index('idx_kyc_applicant_id', ['applicantId'])
@Index('idx_kyc_co_applicant_id', ['coApplicantId'])
export class KycVerificationStatus {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'applicationId', type: 'bigint', unsigned: true })
  applicationId: number;

  @Column({
    type: 'enum',
    enum: KycOwnerType,
  })
  ownerType: KycOwnerType;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  applicantId?: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  coApplicantId?: number;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  panStatus: KycVerificationStatusValue;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  gstStatus: KycVerificationStatusValue;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  aadhaarStatus: KycVerificationStatusValue;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  bureauStatus: KycVerificationStatusValue;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  mobileStatus: KycVerificationStatusValue;

  @Column({
    type: 'enum',
    enum: KycVerificationStatusValue,
    default: KycVerificationStatusValue.PENDING,
  })
  emailStatus: KycVerificationStatusValue;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aadhaarTransactionId?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aadhaarName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aadhaarMaskedNumber?: string;

  @Column({ type: 'date', nullable: true })
  aadhaarDob?: Date;

  @Column({ type: 'text', nullable: true })
  aadhaarAddress?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  middleName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lastName?: string;

  @Column({ type: 'longtext', nullable: true })
  bureauApiRequest?: string;

  @Column({ type: 'longtext', nullable: true })
  bureauApiResponse?: string;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;

  @Column({
    name: 'is_pdf_generated',
    type: 'tinyint',
    width: 1,
    default: 0,
  })
  isPdfGenerated: boolean;

  @Column({ type: 'longtext', nullable: true })
  panApiRequest?: string;

  @Column({ type: 'longtext', nullable: true })
  panApiResponse?: string;

  @Column({ type: 'longtext', nullable: true })
  gstApiRequest?: string;

  @Column({ type: 'longtext', nullable: true })
  gstApiResponse?: string;

  @Column({ type: 'longtext', nullable: true })
  aadhaarApiRequest?: string;

  @Column({ type: 'longtext', nullable: true })
  aadhaarApiResponse?: string;

  @Column({ type: 'longtext', nullable: true })
  aadhaarWebhookResponse?: string;

  @ManyToOne(() => Application, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;
}