import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../../applications/entities/application.entity';

export enum CollectionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIAL = 'partial',
  WAIVED = 'waived',
  REFUNDED = 'refunded',
}

export enum ScheduleStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('charges_receipts')
export class ChargesReceipt {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'application_id', type: 'bigint', unsigned: true })
  applicationId: number;

  @ManyToOne(() => Application, (application) => application.chargesReceipts, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'application_id' })
  application: Application;

  @Column({ name: 'charge_name', type: 'varchar', length: 200 })
  name: string;

  @Column({ name: 'sub_text', type: 'text', nullable: true })
  sub: string;

  @Column({ name: 'required_stage', type: 'varchar', length: 150 })
  stage: string;

  @Column({
    name: 'base_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  base: number;

  @Column({
    name: 'gst_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 18,
  })
  gstRate: number;

  @Column({
    name: 'gst_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  gstAmount: number;

  @Column({
    name: 'gross_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  grossAmount: number;

  @Column({
    name: 'paid_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  paidAmount: number;

  @Column({
    name: 'waiver_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  waiverAmount: number;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
  })
  refundAmount: number;

  @Column({
    name: 'collection_status',
    type: 'enum',
    enum: CollectionStatus,
    default: CollectionStatus.PENDING,
  })
  collectionStatus: CollectionStatus;

  @Column({
    name: 'schedule_status',
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.DRAFT,
  })
  scheduleStatus: ScheduleStatus;

  @Column({
    name: 'payment_reference',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  paymentReference: string;

  @Column({
    name: 'payment_mode',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  paymentMode: string;

  @Column({
    name: 'receipt_no',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  receiptNo: string;

  @Column({ name: 'no_link', type: 'boolean', default: false })
  noLink: boolean;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;
}