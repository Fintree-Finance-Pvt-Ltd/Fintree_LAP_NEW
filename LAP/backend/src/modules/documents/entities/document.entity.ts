import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { DocumentType } from '../../../common/enums/document-type.enum';
import { DocumentStatus } from '../../../common/enums/document-status.enum';
import { Application } from '../../applications/entities/application.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true }) id: number;
  @Column({ name: 'application_id', type: 'bigint', unsigned: true }) applicationId: number;
  @ManyToOne(() => Application, (application) => application.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'application_id' })
  application: Application;
  @Column({ name: 'document_type', type: 'enum', enum: DocumentType }) documentType: DocumentType;
  @Column({ name: 'document_name', length: 160 }) documentName: string;
  @Column({ name: 'document_source', length: 40, nullable: true, default: 'OTHER' }) documentSource?: string;
  @Column({ name: 'file_name', length: 255 }) fileName: string;
  @Column({ name: 'file_path', length: 500 }) filePath: string;
  @Column({ name: 'file_size', type: 'bigint', unsigned: true }) fileSize: number;
  @Column({ name: 'mime_type', length: 120 }) mimeType: string;
  @Column({ name: 'uploaded_by', type: 'bigint', unsigned: true, nullable: true }) uploadedBy?: number;
  @Column({ type: 'enum', enum: DocumentStatus, default: DocumentStatus.UPLOADED }) status: DocumentStatus;
  @CreateDateColumn({ name: 'created_at', precision: 6 }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', precision: 6 }) updatedAt: Date;
  @Column({ name: 'created_by', type: 'bigint', unsigned: true, nullable: true }) createdBy?: number;
  @Column({ name: 'updated_by', type: 'bigint', unsigned: true, nullable: true }) updatedBy?: number;
}
