import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('lap_attendance')
export class LapAttendance {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ type: 'varchar', length: 10 })
  date: string;

  @Column({ name: 'start_time', type: 'datetime', precision: 6 })
  startTime: Date;

  @Column({ name: 'start_location', type: 'varchar', length: 255, nullable: true })
  startLocation: string | null;

  @Column({
    name: 'start_latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  startLatitude: number | null;

  @Column({
    name: 'start_longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  startLongitude: number | null;

  @Column({ name: 'end_time', type: 'datetime', precision: 6, nullable: true })
  endTime: Date | null;

  @Column({ name: 'end_location', type: 'varchar', length: 255, nullable: true })
  endLocation: string | null;

  @Column({
    name: 'end_latitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  endLatitude: number | null;

  @Column({
    name: 'end_longitude',
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  endLongitude: number | null;

  @Column({ name: 'total_hours', type: 'varchar', length: 50, nullable: true })
  totalHours: string | null;

  @Column({ name: 'total_minutes', type: 'int', unsigned: true, nullable: true })
  totalMinutes: number | null;

  @Column({ type: 'varchar', length: 40, default: 'IN_PROGRESS' })
  status: string;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;

  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true })
  createdBy?: number | null;

  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true })
  updatedBy?: number | null;
}
