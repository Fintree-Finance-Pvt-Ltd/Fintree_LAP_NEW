import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Application } from '../../applications/entities/application.entity';

@Entity('contact_persons')
export class ContactPerson {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @ManyToOne(() => Application, (application) => application.contactPersons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
  @Column({ length: 140 }) name: string;
  @Column({ length: 20 }) mobile: string;
  @Column({ length: 180, nullable: true }) email?: string;
  @Column({ length: 120, nullable: true }) designation?: string;
  @Column({ length: 80 }) relationship: string;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
