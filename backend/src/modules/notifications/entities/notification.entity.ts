import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'user_id', type: 'bigint', unsigned: true, nullable: true }) userId?: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true, nullable: true }) applicationId?: number;
  @Column({ length: 180 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ name: 'is_read', default: false }) isRead: boolean;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
