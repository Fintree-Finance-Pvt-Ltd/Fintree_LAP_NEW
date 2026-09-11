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
import { User } from '../../users/entities/user.entity';

export enum ClaimCategory {
  TRAVEL = 'TRAVEL',
  FUEL = 'FUEL',
  FOOD = 'FOOD',
  HOTEL = 'HOTEL',
  OFFICE_SUPPLIES = 'OFFICE_SUPPLIES',
  CLIENT_ENTERTAINMENT = 'CLIENT_ENTERTAINMENT',
  INTERNET_PHONE = 'INTERNET_PHONE',
  MEDICAL = 'MEDICAL',
  OTHER = 'OTHER',
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
}

@Entity('lap_claims')
@Index('idx_lap_claims_user_id', ['userId'])
@Index('idx_lap_claims_status', ['status'])
@Index('idx_lap_claims_category', ['category'])
@Index('idx_lap_claims_expense_date', ['expenseDate'])
@Index('idx_lap_claims_claim_number', ['claimNumber'], { unique: true })
export class LapClaim {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'claim_number', type: 'varchar', length: 50, unique: true })
  claimNumber: string;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'enum',
    enum: ClaimCategory,
    default: ClaimCategory.OTHER,
  })
  category: ClaimCategory;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({
    name: 'tax_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0.0,
  })
  taxAmount: number;

  @Column({ name: 'expense_date', type: 'varchar', length: 10 })
  expenseDate: string; // YYYY-MM-DD

  @Column({
    name: 'merchant_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  merchantName?: string;

  @Column({
    name: 'invoice_number',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  invoiceNumber?: string;

  @Column({ name: 'gst_number', type: 'varchar', length: 30, nullable: true })
  gstNumber?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'receipt_url', type: 'varchar', length: 500, nullable: true })
  receiptUrl?: string;

  @Column({
    name: 'receipt_original_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  receiptOriginalName?: string;

  @Column({
    name: 'receipt_mime_type',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  receiptMimeType?: string;

  @Column({ name: 'receipt_size', type: 'int', nullable: true })
  receiptSize?: number;

  @Column({ name: 'ocr_raw_text', type: 'longtext', nullable: true })
  ocrRawText?: string;

  @Column({
    type: 'enum',
    enum: ClaimStatus,
    default: ClaimStatus.PENDING,
  })
  status: ClaimStatus;

  @Column({ name: 'admin_remarks', type: 'text', nullable: true })
  adminRemarks?: string;

  @Column({
    name: 'approved_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  approvedBy?: number;

  @Column({ name: 'approved_at', type: 'datetime', precision: 6, nullable: true })
  approvedAt?: Date;

  @Column({
    name: 'rejected_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  rejectedBy?: number;

  @Column({ name: 'rejected_at', type: 'datetime', precision: 6, nullable: true })
  rejectedAt?: Date;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'payment_date',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  paymentDate?: string;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentReference?: string;

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

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;
}
