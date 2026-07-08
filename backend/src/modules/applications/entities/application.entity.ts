import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { ApplicationStage } from '../../../common/enums/application-stage.enum';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';
import { CoApplicant } from '../../co-applicants/entities/co-applicant.entity';
import { ContactPerson } from '../../contact-persons/entities/contact-person.entity';
import { CustomerProfile } from '../../customer-profiles/entities/customer-profile.entity';
import { Document } from '../../documents/entities/document.entity';
import { Workflow } from '../../workflow/entities/workflow.entity';
import { ChargesReceipt } from '../../charges-receipts/entities/charges-receipt.entity';

@Entity('applications')
export class Application {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Index()
  @Column({ name: 'application_number', length: 40, unique: true })
  applicationNumber: string;

  @Column({ name: 'customer_name', length: 160 })
  customerName: string;

  @Column({ length: 20 })
  mobile: string;

  @Column({ length: 10, nullable: true })
  pan?: string;

  @Column({ name: 'pan_verified', default: false })
  panVerified: boolean;

  @Column({
    name: 'requested_amount',
    type: 'decimal',
    precision: 15,
    scale: 2,
    default: 0,
  })
  requestedAmount: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ApplicationStage,
    default: ApplicationStage.RM,
  })
  stage: ApplicationStage;

  @Index()
  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({
    name: 'assigned_to',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  assignedTo?: number;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: 'created_at', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', precision: 6 })
  updatedAt: Date;

  @Column({
    name: 'created_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  createdBy?: number;

  @Column({
    name: 'updated_by',
    type: 'bigint',
    unsigned: true,
    nullable: true,
  })
  updatedBy?: number;

  @OneToOne(() => CustomerProfile, (profile) => profile.application)
  customerProfile?: CustomerProfile;

  @OneToMany(() => ContactPerson, (contact) => contact.application)
  contactPersons?: ContactPerson[];

  @OneToMany(() => CoApplicant, (coApplicant) => coApplicant.application)
  coApplicants?: CoApplicant[];

  @OneToMany(() => Document, (document) => document.application)
  documents?: Document[];

  @OneToOne(() => Workflow, (workflow) => workflow.application)
  workflow?: Workflow;

  @OneToMany(() => ChargesReceipt, (chargesReceipt) => chargesReceipt.application)
  chargesReceipts?: ChargesReceipt[];
}