import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Hub } from './hub.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'varchar', length: 160 })
  name: string;

  @OneToMany(() => Hub, (hub) => hub.organization)
  hubs: Hub[];
}


