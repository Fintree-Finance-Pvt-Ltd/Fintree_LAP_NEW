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
@Index('idx_otp_lap_email_created', [
  'emailId',
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
    type: 'varchar',
    length: 15,
    nullable: true,
  })
  mobileNumber?: string | null;

  @Column({
    name: 'email_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  emailId?: string | null;

  @Column({
    type: 'varchar',
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
  consentText?: string | null;

  @Column({
    name: 'consent_at',
    type: 'datetime',
    nullable: true,
  })
  consentAt?: Date | null;

  @Column({
    name: 'application_id',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  applicationId?: number | null;

  @CreateDateColumn({
    name: 'created_at',
    type: 'datetime',
  })
  createdAt: Date;
}