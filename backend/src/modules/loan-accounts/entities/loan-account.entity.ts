import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Application } from '../../applications/entities/application.entity';
import { Partner } from '../../partners/entities/partner.entity';

@Entity('loan_accounts')
@Index('uk_loan_accounts_application_id', ['applicationId'], {
  unique: true,
})
@Index('uk_loan_accounts_lan', ['lan'], {
  unique: true,
})
@Index('idx_loan_accounts_partner_id', ['partnerId'])
@Index('idx_loan_accounts_status', ['status'])
@Index('idx_loan_accounts_stage_status', ['stage', 'status'])
export class LoanAccount {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  applicationId: number;

  @Column({ type: 'bigint', unsigned: true })
  partnerId: number;

  @Column({ type: 'varchar', length: 40 })
  lan: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  applicationNumber?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customerName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  mobile?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  pan?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  requestedAmount?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  approvedAmount?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  sanctionedAmount?: string;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  roi?: string;

  @Column({ type: 'int', nullable: true })
  tenureMonths?: number;

  @Column({ type: 'varchar', length: 80, default: 'LAP' })
  productType: string;

  @Column({ type: 'varchar', length: 50, default: 'OPS_MAKER_PENDING' })
  loanStatus: string;

  @Column({ type: 'varchar', length: 50, default: 'OPS_MAKER' })
  stage: string;

  @Column({ type: 'varchar', length: 50, default: 'OPS_MAKER_PENDING' })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  propertyAddress?: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  propertyType?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  marketValue?: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  valuationRecommendedValue?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  legalStatus?: string;

  @Column({ type: 'text', nullable: true })
  legalRemarks?: string;

  @Column({ type: 'text', nullable: true })
  opsInstructions?: string;

  @Column({ type: 'longtext', nullable: true })
  creditSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  valuationSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  legalSnapshot?: string;

  @Column({ type: 'longtext', nullable: true })
  applicationSnapshot?: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  createdBy?: number;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  updatedBy?: number;

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

  @OneToOne(() => Application, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @ManyToOne(() => Partner, {
    nullable: false,
  })
  @JoinColumn({ name: 'partnerId' })
  partner: Partner;
}