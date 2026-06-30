import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum GeoLocationType {
  RESIDENCE = 'RESIDENCE',
  BUSINESS = 'BUSINESS',
  PROPERTY = 'PROPERTY',
}

@Entity('application_geo_locations')
@Index(
  'application_geo_type',
  ['applicationId', 'locationType'],
  { unique: true },
)
@Index('geo_application', ['applicationId'])
@Index('geo_location_type', ['locationType'])
export class ApplicationGeoLocation {
  @PrimaryGeneratedColumn({
    type: 'bigint',
    unsigned: true,
  })
  id: number;

  @Column({
    name: 'application_id',
    type: 'bigint',
    unsigned: true,
  })
  applicationId: number;

  @Column({
    name: 'location_type',
    type: 'enum',
    enum: GeoLocationType,
  })
  locationType: GeoLocationType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  latitude: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 7,
  })
  longitude: string;

  @Column({
    name: 'accuracy_meters',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  accuracyMeters?: string | null;

  @Column({
    name: 'gps_address',
    type: 'text',
    nullable: true,
  })
  gpsAddress?: string | null;

  @Column({
    name: 'captured_at',
    type: 'datetime',
  })
  capturedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;
}
