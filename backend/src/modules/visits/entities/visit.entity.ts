import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';

const jsonTransformer: ValueTransformer = {
  to: (value: Record<string, unknown> | null | undefined) => {
    if (value === undefined || value === null) {
      return null;
    }

    return JSON.stringify(value);
  },

  from: (value: unknown) => {
    if (!value) {
      return {};
    }

    if (typeof value === 'object') {
      return value;
    }

    try {
      return JSON.parse(String(value));
    } catch {
      return {};
    }
  },
};

@Entity('visits')
@Index(
  'uq_visits_application_type',
  [
    'applicationId',
    'visitType',
  ],
  {
    unique: true,
  },
)
@Index(
  'idx_visits_application_status',
  [
    'applicationId',
    'visitStatus',
  ],
)
export class Visit {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Index()
  @Column({
    name: 'application_id',
    type: 'bigint',
    unsigned: true,
  })
  applicationId: number;

  @Column({
    name: 'visit_type',
    length: 40,
  })
  visitType: string;

  @Column({
    name: 'visit_date',
    type: 'date',
    nullable: true,
  })
  visitDate?: string;

  @Column({
    name: 'visit_status',
    length: 40,
    default: 'DRAFT',
  })
  visitStatus: string;

  @Column({
    name: 'visit_result',
    length: 40,
    nullable: true,
  })
  visitResult?: string;

  @Column({
    name: 'property_category',
    length: 80,
    nullable: true,
  })
  propertyCategory?: string;

  @Column({
    name: 'property_type',
    length: 80,
    nullable: true,
  })
  propertyType?: string;

  @Column({
    name: 'form_data',
    type: 'longtext',
    nullable: true,
    transformer: jsonTransformer,
  })
  formData?: Record<string, unknown>;

  @Column({
    name: 'checklist_data',
    type: 'longtext',
    nullable: true,
    transformer: jsonTransformer,
  })
  checklistData?: Record<string, unknown>;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  latitude?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
    nullable: true,
  })
  longitude?: string;

  @Column({
    name: 'location_accuracy',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  locationAccuracy?: string;

  @Column({
    name: 'captured_at',
    type: 'datetime',
    precision: 6,
    nullable: true,
  })
  capturedAt?: Date;

  @Column({
    name: 'device_id',
    length: 120,
    nullable: true,
  })
  deviceId?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  remarks?: string;

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

  @CreateDateColumn({
    name: 'created_at',
    precision: 6,
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    precision: 6,
  })
  updatedAt: Date;
}