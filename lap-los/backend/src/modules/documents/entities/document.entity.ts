import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DocumentStatus } from '../../../common/enums/document-status.enum';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @Column({ name: 'document_type', length: 80 }) documentType: string;
  @Column({ name: 'file_name', length: 255 }) fileName: string;
  @Column({ name: 'file_path', length: 500 }) filePath: string;
  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.UPLOADED }) status: DocumentStatus;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true }) updatedBy?: number;
}
