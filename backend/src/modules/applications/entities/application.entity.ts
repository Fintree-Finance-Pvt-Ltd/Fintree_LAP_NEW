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
} from "typeorm";

import { ApplicationStage } from "../../../common/enums/application-stage.enum";
import { ApplicationStatus } from "../../../common/enums/application-status.enum";
import { CoApplicant } from "../../co-applicants/entities/co-applicant.entity";
import { ContactPerson } from "../../contact-persons/entities/contact-person.entity";
import { CustomerProfile } from "../../customer-profiles/entities/customer-profile.entity";
import { Document } from "../../documents/entities/document.entity";
import { Workflow } from "../../workflow/entities/workflow.entity";
import { ChargesReceipt } from "../../charges-receipts/entities/charges-receipt.entity";
import { KycVerificationStatus } from "../../varification/entities/kyc-verification-status.entity";
import { Constitution, CustomerType, Gender, MaritalStatus } from "../../../common/enums/customer-profile.enum";

@Entity("applications")
export class Application {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Index()
  @Column({ name: "application_number", length: 40, unique: true })
  applicationNumber: string;

  @Column({
    name: "customer_type",
    type: "enum",
    enum: CustomerType,
    nullable: true,
  })
  customerType?: CustomerType;

  @Column({
    name: "constitution",
    type: "enum",
    enum: Constitution,
    nullable: true,
  })
  constitution?: Constitution;

  @Column({ name: "customer_name", length: 160 })
  customerName: string;

  @Column({ type: "date", nullable: true })
  dob?: string;

  @Column({
    type: "enum",
    enum: Gender,
    nullable: true,
  })
  gender?: Gender;

  @Column({
    name: "marital_status",
    type: "enum",
    enum: MaritalStatus,
    nullable: true,
  })
  maritalStatus?: MaritalStatus;

  @Column({ name: "nationality", length: 50, nullable: true, default: "INDIAN" })
  nationality?: string;

  @Column({ length: 20 })
  mobile: string;

  @Column({ length: 10, nullable: true })
  pan?: string;

  @Column({ name: "pan_verified", default: false })
  panVerified: boolean;

  @Column({
    name: "requested_amount",
    type: "decimal",
    precision: 15,
    scale: 2,
    default: 0,
  })
  requestedAmount: string;

  @Index()
  @Column({
    type: "enum",
    enum: ApplicationStage,
    default: ApplicationStage.RM,
  })
  stage: ApplicationStage;

  @Index()
  @Column({
    type: "enum",
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Column({
    name: "assigned_to",
    type: "bigint",
    unsigned: true,
    nullable: true,
  })
  assignedTo?: number;

  @Column({ name: "next_follow_up_date", length: 30, nullable: true })
  nextFollowUpDate?: string;

  @Column({ name: "nature_of_business", length: 150, nullable: true })
  natureOfBusiness?: string;

  @Column({ name: "business_vintage", length: 80, nullable: true })
  businessVintage?: string;

  @Column({ name: "business_address", type: "text", nullable: true })
  businessAddress?: string;

  @Column({ name: "udyam_number", length: 50, nullable: true })
  udyamNumber?: string;

  @Column({
    name: "monthly_income",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  monthlyIncome?: string;

  @Column({
    name: "monthly_sales",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  monthlySales?: string;

  @Column({
    name: "monthly_profit",
    type: "decimal",
    precision: 15,
    scale: 2,
    nullable: true,
  })
  monthlyProfit?: string;

  @Column({ name: "residence_address_line1", length: 255, nullable: true })
  residenceAddressLine1?: string;

  @Column({ name: "residence_address_line2", length: 255, nullable: true })
  residenceAddressLine2?: string;

  @Column({ name: "residence_landmark", length: 150, nullable: true })
  residenceLandmark?: string;

  @Column({ name: "residence_city", length: 100, nullable: true })
  residenceCity?: string;

  @Column({ name: "residence_district", length: 100, nullable: true })
  residenceDistrict?: string;

  @Column({ name: "residence_state", length: 100, nullable: true })
  residenceState?: string;

  @Column({ name: "residence_pincode", length: 10, nullable: true })
  residencePincode?: string;

  @Column({ name: "gram_panchayat_or_corporation", length: 100, nullable: true })
  gramPanchayatOrCorporation?: string;

  @Column({ name: "residence_type", length: 50, nullable: true })
  residenceType?: string;

  @VersionColumn()
  version: number;

  @CreateDateColumn({ name: "created_at", precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", precision: 6 })
  updatedAt: Date;

  @Column({
    name: "created_by",
    type: "bigint",
    unsigned: true,
    nullable: true,
  })
  createdBy?: number;

  @Column({
    name: "updated_by",
    type: "bigint",
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

  @OneToMany(
    () => ChargesReceipt,
    (chargesReceipt) => chargesReceipt.application,
  )
  chargesReceipts?: ChargesReceipt[];

  @OneToMany(
    () => KycVerificationStatus,
    (kycVerificationStatus) => kycVerificationStatus.application,
  )
  kycVerificationStatuses?: KycVerificationStatus[];
  email: string | undefined;
  marketValue: any;
  propertyValue: any;
}
