import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  FileInterceptor,
} from '@nestjs/platform-express';

import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { extname, join } from 'path';
import { diskStorage } from 'multer';
import type { Request } from 'express';

import { FieldVisitsService } from './field-visits.service';

const allowedImageMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

const fieldVisitDocumentUpload = {
  storage: diskStorage({
    destination: (
      request: Request,
      _file: Express.Multer.File,
      callback: (
        error: Error | null,
        destination: string,
      ) => void,
    ) => {
      const applicationId = String(
        request.params?.applicationId || '',
      ).replace(/\D/g, '');

      if (!applicationId) {
        callback(
          new BadRequestException(
            'A valid application ID is required.',
          ),
          '',
        );

        return;
      }

      const uploadDirectory = join(
        process.cwd(),
        'uploads',
        'field-visits',
        applicationId,
      );

      mkdirSync(uploadDirectory, {
        recursive: true,
      });

      callback(null, uploadDirectory);
    },

    filename: (
      _request: Request,
      file: Express.Multer.File,
      callback: (
        error: Error | null,
        filename: string,
      ) => void,
    ) => {
      const extension =
        extname(file.originalname || '')
          .toLowerCase() || '.jpg';

      callback(
        null,
        `${Date.now()}-${randomUUID()}${extension}`,
      );
    },
  }),

  fileFilter: (
    _request: Request,
    file: Express.Multer.File,
    callback: (
      error: Error | null,
      acceptFile: boolean,
    ) => void,
  ) => {
    if (
      !allowedImageMimeTypes.has(
        file.mimetype,
      )
    ) {
      callback(
        new BadRequestException(
          `Unsupported image type: ${file.mimetype}`,
        ),
        false,
      );

      return;
    }

    callback(null, true);
  },

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
};

@Controller(
  'applications/:applicationId/field-visits',
)
export class FieldVisitsController {
  constructor(
    private readonly fieldVisitsService:
      FieldVisitsService,
  ) {}

  /*
   * GET /api/applications/:applicationId/field-visits
   */
  @Get()
  getFieldVisits(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.fieldVisitsService.getCurrentVisits(
      applicationId,
    );
  }

  /*
   * GET /api/applications/:applicationId/field-visits/documents
   */
  @Get('documents')
  getFieldVisitDocuments(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.fieldVisitsService.getDocuments(
      applicationId,
    );
  }

  /*
   * POST /api/applications/:applicationId/field-visits/documents
   *
   * multipart/form-data:
   * file
   * visitType
   * documentName
   */
  @Post('documents')
  @UseInterceptors(
    FileInterceptor(
      'file',
      fieldVisitDocumentUpload,
    ),
  )
  uploadFieldVisitDocument(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    request: Request & {
      user?: {
        id?: number;
        userId?: number;
        sub?: number;
      };

      body: {
        visitType?: string;
        documentName?: string;
        documentType?: string;
        documentSource?: string;
      };
    },
  ) {
    if (!file) {
      throw new BadRequestException(
        'Field visit photo is required.',
      );
    }

    return this.fieldVisitsService.uploadDocument(
      applicationId,
      request.body,
      file,
      this.getUserId(request),
    );
  }

  /*
   * DELETE /api/applications/:applicationId/field-visits/documents/:documentId
   */
  @Delete('documents/:documentId')
  deleteFieldVisitDocument(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,

    @Param(
      'documentId',
      ParseIntPipe,
    )
    documentId: number,
  ) {
    return this.fieldVisitsService.deleteDocument(
      applicationId,
      documentId,
    );
  }

  /*
   * GET /api/applications/:applicationId/field-visits/history
   */
  @Get('history')
  getHistory(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.fieldVisitsService.getVisitHistory(
      applicationId,
    );
  }

  /*
   * GET /api/applications/:applicationId/field-visits/status
   */
  @Get('status')
  getStatus(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.fieldVisitsService.getCompletionStatus(
      applicationId,
    );
  }

  private getUserId(
    request: Request & {
      user?: {
        id?: number;
        userId?: number;
        sub?: number;
      };
    },
  ) {
    const rawUserId =
      request.user?.id ??
      request.user?.userId ??
      request.user?.sub;

    if (
      rawUserId === undefined ||
      rawUserId === null
    ) {
      return undefined;
    }

    const userId = Number(rawUserId);

    return Number.isFinite(userId)
      ? userId
      : undefined;
  }
}