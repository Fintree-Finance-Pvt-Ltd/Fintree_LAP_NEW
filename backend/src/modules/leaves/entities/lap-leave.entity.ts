import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum LeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  UNPAID = 'UNPAID',
  OTHER = 'OTHER',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum HalfDayType {
  FULL_DAY = 'FULL_DAY',
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF',
}

@Entity('lap_leaves')
export class LapLeave {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    name: 'leave_type',
    type: 'varchar',
    length: 30,
    default: LeaveType.CASUAL,
  })
  leaveType: string;

  @Column({ name: 'start_date', type: 'varchar', length: 10 })
  startDate: string;

  @Column({ name: 'end_date', type: 'varchar', length: 10 })
  endDate: string;

  @Column({ name: 'is_half_day', type: 'boolean', default: false })
  isHalfDay: boolean;

  @Column({
    name: 'half_day_type',
    type: 'varchar',
    length: 20,
    default: HalfDayType.FULL_DAY,
    nullable: true,
  })
  halfDayType: string | null;

  @Column({
    name: 'total_days',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1.0,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : 1.0),
    },
  })
  totalDays: number;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'varchar',
    length: 30,
    default: LeaveStatus.PENDING,
  })
  status: string;

  @Column({
    name: 'approved_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  approvedBy: number | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser?: User;

  @Column({
    name: 'approved_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  approvedAt: Date | null;

  @Column({ name: 'admin_remarks', type: 'text', nullable: true })
  adminRemarks: string | null;

  @Column({
    name: 'contact_number',
    type: 'varchar',
    length: 30,
    nullable: true,
  })
  contactNumber: string | null;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;

  @BeforeInsert()
  setTimestampsOnInsert() {
    const now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    this.updatedAt = now;
  }

  @BeforeUpdate()
  setTimestampsOnUpdate() {
    this.updatedAt = new Date();
  }

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy?: number | null;

  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy?: number | null;
}
