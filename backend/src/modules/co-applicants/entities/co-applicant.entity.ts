import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Application } from '../../applications/entities/application.entity';

@Entity('co_applicants')
export class CoApplicant {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @ManyToOne(() => Application, (application) => application.coApplicants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
  @Column({ length: 140 }) name: string;
  @Column({ length: 20 }) mobile: string;
  @Column({ length: 180, nullable: true }) email?: string;
  @Column({ name: 'pan_number', length: 10, nullable: true }) panNumber?: string;
  @Column({ name: 'aadhaar_number', length: 12, nullable: true }) aadhaarNumber?: string;
  @Column({ length: 80 }) relationship: string;
  @Column({ length: 120, nullable: true }) occupation?: string;
  @Column({ name: 'monthly_income', type: 'decimal', precision: 15, scale: 2, nullable: true }) monthlyIncome?: string;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
