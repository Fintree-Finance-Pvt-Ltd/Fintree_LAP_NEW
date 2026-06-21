import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';
import { Spoke } from './spoke.entity';

@Entity('hubs')
export class Hub {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => Organization, (org) => org.hubs, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @OneToMany(() => Spoke, (spoke) => spoke.hub)
  spokes: Spoke[];

  @Column({ type: 'varchar', length: 160 })
  name: string;
}


