import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PartnerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('partners')
@Index('uk_partners_code', ['code'], { unique: true })
@Index('uk_partners_lan_prefix', ['lanPrefix'], { unique: true })
export class Partner {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 30 })
  code: string;

  @Column({ type: 'varchar', length: 20 })
  lanPrefix: string;

  @Column({
    type: 'bigint',
    unsigned: true,
    default: 0,
  })
  currentLanSequence: number;

  @Column({
    type: 'enum',
    enum: PartnerStatus,
    default: PartnerStatus.ACTIVE,
  })
  status: PartnerStatus;

  @CreateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'datetime',
    precision: 6,
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  updatedAt: Date;
}