import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { BureauStatus, CustomerType, Gender, MaritalStatus, OccupationType } from '../../../common/enums/customer-profile.enum';
import { Application } from '../../applications/entities/application.entity';

@Entity('customer_profiles')
export class CustomerProfile {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true, unique: true }) applicationId: number;
  @OneToOne(() => Application, (application) => application.customerProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
@Column({
  name: 'customer_type',
  type: 'enum',
  enum: CustomerType,
  nullable: true,
})
customerType?: CustomerType;
  @Column({ name: 'first_name', length: 80 }) firstName: string;
  @Column({ name: 'middle_name', length: 80, nullable: true }) middleName?: string;
  @Column({ name: 'last_name', length: 80 }) lastName: string;
  @Column({ length: 20 })mobile: string;
  @Column({ name: 'mobile_verified', default: false })mobileVerified: boolean;
 @Column({ length: 180, nullable: true })email?: string;
@Column({ name: 'email_verified', default: false })emailVerified: boolean;
  @Column({ type: 'date', nullable: true }) dob?: string;
  

  @Column({ type: 'enum', enum: Gender, nullable: true }) gender?: Gender;
  @Column({ name: 'marital_status', type: 'enum', enum: MaritalStatus, nullable: true }) maritalStatus?: MaritalStatus;
  @Column({ length: 120, nullable: true }) education?: string;
  @Column({ name: 'occupation_type', type: 'enum', enum: OccupationType, nullable: true }) occupationType?: OccupationType;
  @Column({ name: 'business_name', length: 180, nullable: true }) businessName?: string;
  @Column({ length: 120, nullable: true }) designation?: string;
  @Column({ name: 'monthly_income', type: 'decimal', precision: 15, scale: 2, nullable: true }) monthlyIncome?: string;
  @Column({ name: 'annual_income', type: 'decimal', precision: 15, scale: 2, nullable: true }) annualIncome?: string;
  @Column({ name: 'pan_number', length: 10, nullable: true }) panNumber?: string;
  @Column({ name: 'pan_verified', default: false }) panVerified: boolean;
  @Column({ name: 'aadhaar_number', length: 12, nullable: true }) aadhaarNumber?: string;
  @Column({ name: 'aadhaar_verified', default: false }) aadhaarVerified: boolean;
  @Column({ name: 'ckyc_number', length: 40, nullable: true }) ckycNumber?: string;
  @Column({ name: 'ckyc_verified', default: false }) ckycVerified: boolean;
  @Column({ name: 'bureau_score', type: 'int', nullable: true }) bureauScore?: number;
  @Column({ name: 'bureau_status', type: 'enum', enum: BureauStatus, default: BureauStatus.NOT_PULLED }) bureauStatus: BureauStatus;
  @Column({ name: 'current_address', type: 'text', nullable: true }) currentAddress?: string;
  @Column({ name: 'current_city', length: 100, nullable: true }) currentCity?: string;
  @Column({ name: 'current_state', length: 100, nullable: true }) currentState?: string;
  @Column({ name: 'current_pincode', length: 6, nullable: true }) currentPincode?: string;
  @Column({ name: 'permanent_address', type: 'text', nullable: true }) permanentAddress?: string;
  @Column({ name: 'permanent_city', length: 100, nullable: true }) permanentCity?: string;
  @Column({ name: 'permanent_state', length: 100, nullable: true }) permanentState?: string;
  @Column({ name: 'permanent_pincode', length: 6, nullable: true }) permanentPincode?: string;
  @Column({ name: 'property_category', length: 80, nullable: true }) propertyCategory?: string;
  @Column({ name: 'property_type', length: 80, nullable: true }) propertyType?: string;
  @Column({ name: 'property_address', type: 'text', nullable: true }) propertyAddress?: string;
  @Column({ name: 'property_city', length: 100, nullable: true }) propertyCity?: string;
  @Column({ name: 'property_state', length: 100, nullable: true }) propertyState?: string;
  @Column({ name: 'property_pincode', length: 6, nullable: true }) propertyPincode?: string;
  @Column({ name: 'ownership_type', length: 80, nullable: true }) ownershipType?: string;
  @Column({ name: 'market_value', type: 'decimal', precision: 15, scale: 2, nullable: true }) marketValue?: string;
  @Column({ name: 'distress_value', type: 'decimal', precision: 15, scale: 2, nullable: true }) distressValue?: string;
  @Column({ name: 'bank_name', length: 140, nullable: true }) bankName?: string;
  @Column({ name: 'gst_number', length: 20, nullable: true })gstNumber?: string;
  @Column({ name: 'account_number', length: 40, nullable: true }) accountNumber?: string;
  @Column({ length: 11, nullable: true }) ifsc?: string;
  @Column({ name: 'branch_name', length: 140, nullable: true }) branchName?: string;
  @Column({ name: 'average_balance', type: 'decimal', precision: 15, scale: 2, nullable: true }) averageBalance?: string;
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true }) foir?: string;
  @Column({ name: 'eligible_amount', type: 'decimal', precision: 15, scale: 2, nullable: true }) eligibleAmount?: string;
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true }) roi?: string;
  @Column({ type: 'int', nullable: true }) tenure?: number;
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true }) emi?: string;
  @Column({ name: 'recommended_amount', type: 'decimal', precision: 15, scale: 2, nullable: true }) recommendedAmount?: string;
  @Column({ name: 'recommended_roi', type: 'decimal', precision: 6, scale: 2, nullable: true }) recommendedRoi?: string;
  @Column({ name: 'recommended_tenure', type: 'int', nullable: true }) recommendedTenure?: number;
  @Column({ name: 'rm_recommendation', type: 'text', nullable: true }) rmRecommendation?: string;
  @Column({ type: 'text', nullable: true }) remarks?: string;
  @Column({ name: 'current_workflow_stage', length: 50, nullable: true }) currentWorkflowStage?: string;
  @Column({ name: 'current_workflow_status', length: 80, nullable: true }) currentWorkflowStatus?: string;
  @Column({ name: 'last_workflow_action', length: 100, nullable: true }) lastWorkflowAction?: string;
  @Column({ name: 'last_workflow_updated_at', type: 'datetime', precision: 6, nullable: true }) lastWorkflowUpdatedAt?: Date;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
}
