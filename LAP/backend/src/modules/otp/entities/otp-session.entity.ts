import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('otp_sessions_lap')
@Index('idx_otp_lap_mobile_created', [
  'mobileNumber',
  'createdAt',
])
@Index('idx_otp_lap_application', [
  'applicationId',
])
export class OtpSession {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'mobile_number',
    length: 15,
  })
  mobileNumber: string;

  @Column({
    length: 6,
  })
  otp: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  verified: boolean;

  @Column({
    type: 'int',
    unsigned: true,
    default: 0,
  })
  attempts: number;

  @Column({
    name: 'expires_at',
    type: 'datetime',
  })
  expiresAt: Date;

  @Column({
    name: 'last_sent_at',
    type: 'datetime',
  })
  lastSentAt: Date;

  @Column({
    name: 'consent_given',
    type: 'boolean',
    default: false,
  })
  consentGiven: boolean;

  @Column({
    name: 'consent_text',
    type: 'text',
    nullable: true,
  })
  consentText?: string;

  @Column({
    name: 'consent_at',
    type: 'datetime',
    nullable: true,
  })
  consentAt?: Date;

  @Column({
    name: 'application_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  applicationId?: number;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}