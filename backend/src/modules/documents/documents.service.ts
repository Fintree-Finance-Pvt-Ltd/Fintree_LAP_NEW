import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { unlink } from 'fs/promises';
import { Repository } from 'typeorm';

import { DocumentType } from '../../common/enums/document-type.enum';
import { Application } from '../applications/entities/application.entity';
import type { Actor } from '../applications/applications.service';
import { Document } from './entities/document.entity';

type UploadDocumentInput = {
  applicationId: string | number;
  documentType: string;
  documentName?: string;
  documentSource?: string;
};

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documents: Repository<Document>,

    @InjectRepository(Application)
    private readonly applications: Repository<Application>,
  ) {}

  async upload(
    input: UploadDocumentInput,
    file: Express.Multer.File,
    actor: Actor,
  ) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    const applicationId = Number(input.applicationId);

    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      await this.removeUploadedFile(file.path);

      throw new BadRequestException('Valid applicationId is required');
    }

    const documentType = String(input.documentType || '')
      .trim()
      .toUpperCase();

    const allowedDocumentTypes = Object.values(DocumentType);

    if (!allowedDocumentTypes.includes(documentType as DocumentType)) {
      await this.removeUploadedFile(file.path);

      throw new BadRequestException(
        `documentType must be one of: ${allowedDocumentTypes.join(', ')}`,
      );
    }

    const applicationExists = await this.applications.exist({
      where: {
        id: applicationId,
      },
    });

    if (!applicationExists) {
      await this.removeUploadedFile(file.path);

      throw new NotFoundException('Application not found');
    }

    try {
      const savedFileName = file.filename || file.originalname;

      const document = new Document();

      document.applicationId = applicationId;

      document.documentType = documentType as DocumentType;

      document.documentName = String(input.documentName || documentType).trim();

      document.documentSource = String(input.documentSource || 'RM_PORTAL')
        .trim()
        .toUpperCase();

      document.fileName = file.originalname;

      // Important: store public relative path, not full Windows path
      document.filePath = `uploads/documents/${savedFileName}`;

      document.fileSize = file.size;

      document.mimeType = file.mimetype;

      const actorId = Number(actor?.id);

      if (Number.isInteger(actorId) && actorId > 0) {
        document.uploadedBy = actorId;
        document.createdBy = actorId;
        document.updatedBy = actorId;
      }

      const savedDocument = await this.documents.save(document);

      return {
        data: this.formatDocumentResponse(savedDocument),
        message: 'Document uploaded successfully',
      };
    } catch (error) {
      await this.removeUploadedFile(file.path);

      console.error('Document database save failed:', error);

      throw error;
    }
  }

  async findAllByApplication(applicationId: number) {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      throw new BadRequestException('Valid applicationId is required');
    }

    const applicationExists = await this.applications.exist({
      where: {
        id: applicationId,
      },
    });

    if (!applicationExists) {
      throw new NotFoundException('Application not found');
    }

    const documents = await this.documents.find({
      where: {
        applicationId,
      },
      order: {
        id: 'DESC',
      },
    });

    return {
      data: documents.map((document) =>
        this.formatDocumentResponse(document),
      ),
      message: 'Documents fetched successfully',
    };
  }

  async findCustomerPhoto(applicationId: number) {
    if (!Number.isInteger(applicationId) || applicationId <= 0) {
      throw new BadRequestException('Valid applicationId is required');
    }

    const document = await this.documents
      .createQueryBuilder('document')
      .where('document.applicationId = :applicationId', {
        applicationId,
      })
      .andWhere(
        `
          (
            LOWER(TRIM(document.documentName)) = :customerPhoto
            OR LOWER(TRIM(document.documentName)) = :applicantPhoto
            OR document.documentType = :photoType
          )
        `,
        {
          customerPhoto: 'customer photo',
          applicantPhoto: 'applicant photo',
          photoType: DocumentType.PHOTO,
        },
      )
      .orderBy('document.id', 'DESC')
      .getOne();

    return {
      data: document ? this.formatDocumentResponse(document) : null,
      message: document
        ? 'Customer photo fetched successfully'
        : 'Customer photo not found',
    };
  }

  async remove(id: number) {
    const document = await this.documents.findOne({
      where: {
        id,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.documents.delete(id);

    await this.removeUploadedFile(document.filePath);

    return {
      data: null,
      message: 'Document deleted',
    };
  }

  private formatDocumentResponse(document: Document) {
    const filePath = this.normalizePublicFilePath(document.filePath);

    return {
      id: Number(document.id),
      applicationId: Number(document.applicationId),

      documentType: document.documentType,
      documentName: document.documentName,
      documentSource: document.documentSource,

      fileName: document.fileName,
      filePath,
      fileUrl: this.buildFileUrl(filePath),

      fileSize: Number(document.fileSize),
      mimeType: document.mimeType,

      uploadedBy: document.uploadedBy ? Number(document.uploadedBy) : null,
      status: document.status,

      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      createdBy: document.createdBy ? Number(document.createdBy) : null,
      updatedBy: document.updatedBy ? Number(document.updatedBy) : null,

      // also giving snake_case for old frontend compatibility
      document_name: document.documentName,
      document_type: document.documentType,
      file_name: document.fileName,
      file_path: filePath,
      file_url: this.buildFileUrl(filePath),
    };
  }

  private normalizePublicFilePath(filePath?: string) {
    if (!filePath) {
      return '';
    }

    const normalizedPath = String(filePath).replace(/\\/g, '/');

    const uploadsIndex = normalizedPath.toLowerCase().indexOf('uploads/');

    if (uploadsIndex >= 0) {
      return normalizedPath.slice(uploadsIndex);
    }

    return normalizedPath.replace(/^\/+/, '');
  }

  private buildFileUrl(filePath?: string) {
    const normalizedPath = this.normalizePublicFilePath(filePath);

    if (!normalizedPath) {
      return '';
    }

    const baseUrl =
      process.env.PUBLIC_API_BASE_URL ||
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 9000}`;

    return `${baseUrl.replace(/\/+$/, '')}/${normalizedPath.replace(/^\/+/, '')}`;
  }

  private async removeUploadedFile(filePath?: string) {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.error('Unable to delete uploaded file:', error);
      }
    }
  }
}