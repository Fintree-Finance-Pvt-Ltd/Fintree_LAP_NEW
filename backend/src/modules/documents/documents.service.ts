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
  ) { }

  async upload(
    input: UploadDocumentInput,
    file: Express.Multer.File,
    actor: Actor,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Document file is required',
      );
    }

    const applicationId = Number(
      input.applicationId,
    );

    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      await this.removeUploadedFile(file.path);

      throw new BadRequestException(
        'Valid applicationId is required',
      );
    }

    const documentType = String(
      input.documentType || '',
    )
      .trim()
      .toUpperCase();

    const allowedDocumentTypes =
      Object.values(DocumentType);

    if (
      !allowedDocumentTypes.includes(
        documentType as DocumentType,
      )
    ) {
      await this.removeUploadedFile(file.path);

      throw new BadRequestException(
        `documentType must be one of: ${allowedDocumentTypes.join(', ')}`,
      );
    }

    const applicationExists =
      await this.applications.exist({
        where: {
          id: applicationId,
        },
      });

    if (!applicationExists) {
      await this.removeUploadedFile(file.path);

      throw new NotFoundException(
        'Application not found',
      );
    }

    try {
      const document = new Document();

      document.applicationId =
        applicationId;

      document.documentType =
        documentType as DocumentType;

      document.documentName =
        String(
          input.documentName ||
          documentType,
        ).trim();

      document.documentSource =
        String(
          input.documentSource ||
          'RM_PORTAL',
        )
          .trim()
          .toUpperCase();

      document.fileName =
        file.originalname;

      document.filePath =
        file.path.replace(/\\/g, '/');

      document.fileSize =
        file.size;

      document.mimeType =
        file.mimetype;

      const actorId = Number(actor?.id);

      if (
        Number.isInteger(actorId) &&
        actorId > 0
      ) {
        document.uploadedBy =
          actorId;

        document.createdBy =
          actorId;

        document.updatedBy =
          actorId;
      }

      const savedDocument =
        await this.documents.save(document);

      return {
        data: savedDocument,
        message:
          'Document uploaded successfully',
      };
    } catch (error) {
      await this.removeUploadedFile(file.path);

      console.error(
        'Document database save failed:',
        error,
      );

      throw error;
    }
  }

  async findByApplication(
    applicationId: number,
  ) {
    if (
      !Number.isInteger(applicationId) ||
      applicationId <= 0
    ) {
      throw new BadRequestException(
        'Valid applicationId is required',
      );
    }

    const applicationExists =
      await this.applications.exist({
        where: {
          id: applicationId,
        },
      });

    if (!applicationExists) {
      throw new NotFoundException(
        'Application not found',
      );
    }

    const documents =
      await this.documents.find({
        where: {
          applicationId,
        },
        order: {
          id: 'DESC',
        },
      });

    return {
      data: documents,
    };
  }

  async remove(id: number) {
    const document =
      await this.documents.findOne({
        where: {
          id,
        },
      });

    if (!document) {
      throw new NotFoundException(
        'Document not found',
      );
    }

    await this.documents.delete(id);

    await this.removeUploadedFile(
      document.filePath,
    );

    return {
      data: null,
      message: 'Document deleted',
    };
  }

  private async removeUploadedFile(
    filePath?: string,
  ) {
    if (!filePath) {
      return;
    }

    try {
      await unlink(filePath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.error(
          'Unable to delete uploaded file:',
          error,
        );
      }
    }
  }
}

