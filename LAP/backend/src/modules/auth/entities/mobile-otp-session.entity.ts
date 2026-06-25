import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('mobile_otp_sessions')
export class MobileOtpSession {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;

  @Index()
  @Column({ length: 20 }) mobile: string;

  @Index()
  @Column({ length: 32, unique: true }) verificationToken: string;

  @Column({ length: 6 }) otp: string;

  @Column({ type: 'timestamp', nullable: true }) verifiedAt?: Date;

  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}

