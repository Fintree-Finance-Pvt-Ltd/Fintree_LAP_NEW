import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { LapAttendance } from './lap-attendance.entity';

@Entity('lap_attendance_locations')
export class LapAttendanceLocation {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ name: 'attendance_id', type: 'bigint', unsigned: true })
  attendanceId: number;

  @ManyToOne(() => LapAttendance, (att) => att.locations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attendance_id' })
  attendance: LapAttendance;

  @Column({ name: 'user_id', type: 'bigint', unsigned: true })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  latitude: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    transformer: {
      to: (value?: number | null) => value,
      from: (value?: string | null) => (value ? parseFloat(value) : null),
    },
  })
  longitude: number;

  @Column({ type: 'float', nullable: true })
  accuracy: number | null;

  @Column({ type: 'float', nullable: true })
  speed: number | null;

  @Column({ type: 'float', nullable: true })
  heading: number | null;

  @Column({ name: 'location_name', type: 'varchar', length: 255, nullable: true })
  locationName: string | null;

  @Column({ name: 'recorded_at', type: 'datetime', precision: 6 })
  recordedAt: Date;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;
}
