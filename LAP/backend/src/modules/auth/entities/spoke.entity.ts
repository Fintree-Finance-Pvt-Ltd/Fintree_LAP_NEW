import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Hub } from './hub.entity';

@Entity('spokes')
export class Spoke {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Hub, (hub) => hub.spokes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'hub_id' })
  hub: Hub;

  @Column({ type: 'varchar', length: 160 })
  name: string;
}


