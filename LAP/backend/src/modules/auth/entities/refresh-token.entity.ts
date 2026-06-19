import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'user_id', type: 'bigint', unsigned: true }) userId: number;
  @Column({ name: 'token_hash', length: 255 }) tokenHash: string;
  @Column({ name: 'expires_at', type: 'datetime', precision: 6 }) expiresAt: Date;
  @Column({ name: 'revoked_at', type: 'datetime', precision: 6, nullable: true }) revokedAt?: Date;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
}
