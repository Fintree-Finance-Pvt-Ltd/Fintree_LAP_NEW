import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";

import { FileInterceptor } from "@nestjs/platform-express";

import { randomUUID } from "crypto";

import { mkdirSync } from "fs";

import { extname, join } from "path";

import { diskStorage } from "multer";

import type { Request, Response } from "express";

import { FieldVisitsService } from "./field-visits.service";

type AuthenticatedRequest = Request & {
  user?: {
    id?: number;
    userId?: number;
    sub?: number;
  };
};

type SaveVisitBody = {
  propertyCategory?: string;

  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  capturedAt?: string;
  deviceId?: string;

  visit?: {
    visitType?: string;
    visitDate?: string;
    visitResult?: string;
    visitStatus?: string;

    propertyType?: string | null;

    remarks?: string;

    formData?: Record<string, unknown>;

    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    capturedAt?: string;
    deviceId?: string;

    [key: string]: unknown;
  };
};

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const fieldVisitDocumentUpload = {
  storage: diskStorage({
    destination: (
      request: Request,
      _file: Express.Multer.File,
      callback: (error: Error | null, destination: string) => void,
    ) => {
      const applicationId = String(request.params?.applicationId || "").replace(
        /\D/g,
        "",
      );

      if (!applicationId) {
        callback(
          new BadRequestException("A valid application ID is required."),
          "",
        );

        return;
      }

      const uploadDirectory = join(
        process.cwd(),
        "uploads",
        "field-visits",
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
      callback: (error: Error | null, filename: string) => void,
    ) => {
      const extension =
        extname(file.originalname || "").toLowerCase() || ".jpg";

      callback(null, `${Date.now()}-${randomUUID()}${extension}`);
    },
  }),

  fileFilter: (
    _request: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    if (!allowedImageMimeTypes.has(file.mimetype)) {
      callback(
        new BadRequestException(`Unsupported image type: ${file.mimetype}.`),
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

@Controller("applications/:applicationId/field-visits")
export class FieldVisitsController {
  constructor(private readonly fieldVisitsService: FieldVisitsService) {}

  /* =====================================================
     GET CURRENT VISITS
  ===================================================== */

  @Get()
  getFieldVisits(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,
  ) {
    return this.fieldVisitsService.getCurrentVisits(applicationId);
  }

  /* =====================================================
     SAVE ONE VISIT
  ===================================================== */

  @Post("save")
  saveVisit(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,

    /*
     * This @Body() decorator is mandatory.
     *
     * Without it, propertyCategory and visit
     * will be undefined.
     */
    @Body()
    body: SaveVisitBody,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.fieldVisitsService.saveVisit(
      applicationId,
      body,
      this.getUserId(request),
    );
  }

  /* =====================================================
     COMPLETE ALL VISITS
  ===================================================== */

  @Post("complete")
  completeVisits(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,

    @Body()
    body: Record<string, any>,

    @Req()
    request: AuthenticatedRequest,
  ) {
    return this.fieldVisitsService.completeVisits(
      applicationId,
      body,
      this.getUserId(request),
    );
  }

  /* =====================================================
     GET DOCUMENTS
  ===================================================== */

  @Get("documents")
  getFieldVisitDocuments(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,
  ) {
    return this.fieldVisitsService.getDocuments(applicationId);
  }

  /* =====================================================
     UPLOAD DOCUMENT
  ===================================================== */

  @Post("documents")
  @UseInterceptors(FileInterceptor("file", fieldVisitDocumentUpload))
  uploadFieldVisitDocument(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,

    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    request: AuthenticatedRequest & {
      body: {
        visitType?: string;

        documentName?: string;

        documentType?: string;

        documentSource?: string;
      };
    },
  ) {
    if (!file) {
      throw new BadRequestException("Field visit photo is required.");
    }

    return this.fieldVisitsService.uploadDocument(
      applicationId,
      request.body,
      file,
      this.getUserId(request),
    );
  }

  /* =====================================================
     VIEW DOCUMENT FILE
  ===================================================== */

  @Get("documents/:documentId/file")
  async getFieldVisitDocumentFile(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,

    @Param("documentId", ParseIntPipe)
    documentId: number,

    @Res()
    response: Response,
  ) {
    const { document, absolutePath } =
      await this.fieldVisitsService.getDocumentFile(applicationId, documentId);

    const safeFileName = String(
      document.fileName || `field-visit-${documentId}`,
    ).replace(/["\r\n]/g, "_");

    response.setHeader(
      "Content-Type",
      document.mimeType || "application/octet-stream",
    );

    response.setHeader(
      "Content-Disposition",
      `inline; filename="${safeFileName}"`,
    );

    return response.sendFile(absolutePath);
  }

  /* =====================================================
     DELETE DOCUMENT
  ===================================================== */

  @Delete("documents/:documentId")
  deleteFieldVisitDocument(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,

    @Param("documentId", ParseIntPipe)
    documentId: number,
  ) {
    return this.fieldVisitsService.deleteDocument(applicationId, documentId);
  }

  /* =====================================================
     VISIT HISTORY
  ===================================================== */

  @Get("history")
  getHistory(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,
  ) {
    return this.fieldVisitsService.getVisitHistory(applicationId);
  }

  /* =====================================================
     COMPLETION STATUS
  ===================================================== */

  @Get("status")
  getStatus(
    @Param("applicationId", ParseIntPipe)
    applicationId: number,
  ) {
    return this.fieldVisitsService.getCompletionStatus(applicationId);
  }

  /* =====================================================
     AUTH USER ID
  ===================================================== */

  private getUserId(request: AuthenticatedRequest) {
    const rawUserId =
      request.user?.id ?? request.user?.userId ?? request.user?.sub;

    if (rawUserId === undefined || rawUserId === null) {
      return undefined;
    }

    const userId = Number(rawUserId);

    return Number.isFinite(userId) ? userId : undefined;
  }
}
