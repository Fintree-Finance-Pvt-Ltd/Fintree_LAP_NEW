import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { isAbsolute, join, relative } from "path";
import { DataSource, EntityManager, Repository } from "typeorm";

import { DocumentStatus } from "../../common/enums/document-status.enum";
import { DocumentType } from "../../common/enums/document-type.enum";
import { Application } from "../applications/entities/application.entity";
import { Document } from "../documents/entities/document.entity";
import {
  DOCUMENT_NAMES,
  DOCUMENT_SOURCE,
  FIELD_VISIT_CHECKLIST_KEYS,
  getRequiredVisitTypes,
  getVisitTypeFromDocumentName,
  normalizePropertyCategory,
  normalizeVisitResult,
  normalizeVisitType,
  PROPERTY_VISIT_VISIT_TYPES,
  UPLOAD_BASE_URL,
  VISIT_RESULT,
  VISIT_STATUS,
  VISIT_TYPE,
} from "./field-visits.constants";
import { Visit } from "./entities/visit.entity";

@Injectable()
export class FieldVisitsService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Visit)
    private readonly visitRepository: Repository<Visit>,

    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
  ) {}

private formatVisitTypeLabel(
  visitType: string,
) {
  return String(visitType)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(' ');
}

  private applyVisitDraftData({
  visit,
  applicationId,
  propertyCategory,
  visitType,
  input,
  body,
  userId,
}: {
  visit: Visit;
  applicationId: number;
  propertyCategory: string;
  visitType: string;
  input: Record<string, any>;
  body: Record<string, any>;
  userId?: number;
}) {
  visit.applicationId =
    applicationId;

  visit.visitType =
    visitType;

  visit.visitStatus =
    VISIT_STATUS.DRAFT;

  visit.propertyCategory =
    propertyCategory;

  visit.updatedBy =
    userId;

  /*
   * Keep createdBy only for new records.
   */
  if (
    !visit.createdBy &&
    userId
  ) {
    visit.createdBy =
      userId;
  }

  const visitDate =
    input.visitDate ??
    body.visitDate;

  visit.visitDate =
    this.hasValue(visitDate)
      ? this.validateDate(
          visitDate,
          `${visitType}.visitDate`,
        )
      : undefined;

  const rawVisitResult =
    input.visitResult ??
    input.visitStatus;

  if (
    this.hasValue(
      rawVisitResult,
    )
  ) {
    const visitResult =
      normalizeVisitResult(
        rawVisitResult,
      );

    if (!visitResult) {
      throw new BadRequestException(
        `${visitType}: visitResult must be Positive, Negative or Refer.`,
      );
    }

    visit.visitResult =
      visitResult;
  } else {
    visit.visitResult =
      undefined;
  }

  visit.propertyType =
    this.hasValue(
      input.propertyType,
    )
      ? String(
          input.propertyType,
        )
          .trim()
          .slice(0, 80)
      : undefined;

  const remarks =
    input.remarks ??
    input.residenceRemarks ??
    input.businessRemarks ??
    input.propertyRemarks;

  visit.remarks =
    this.validateRemarks(
      remarks,
    );

  const explicitFormData =
    this.parseObject(
      input.formData,
      `${visitType}.formData`,
      {},
    );

  visit.formData = {
    ...this.extractFormData(
      input,
    ),

    ...explicitFormData,
  };

  const commonChecklist =
    this.parseObject(
      body.checklistData,
      'checklistData',
      {},
    );

  const visitChecklist =
    this.parseObject(
      input.checklistData,
      `${visitType}.checklistData`,
      {},
    );

  visit.checklistData = {
    ...commonChecklist,
    ...visitChecklist,
  };

  const latitude =
    input.latitude ??
    body.latitude;

  const longitude =
    input.longitude ??
    body.longitude;

  const locationAccuracy =
    input.locationAccuracy ??
    body.locationAccuracy;

  const capturedAt =
    input.capturedAt ??
    body.capturedAt;

  const deviceId =
    input.deviceId ??
    body.deviceId;

  visit.latitude =
    this.hasValue(latitude)
      ? this.validateCoordinate(
          latitude,
          `${visitType}.latitude`,
          -90,
          90,
        )
      : undefined;

  visit.longitude =
    this.hasValue(longitude)
      ? this.validateCoordinate(
          longitude,
          `${visitType}.longitude`,
          -180,
          180,
        )
      : undefined;

  visit.locationAccuracy =
    this.hasValue(
      locationAccuracy,
    )
      ? this.validatePositiveNumber(
          locationAccuracy,
          `${visitType}.locationAccuracy`,
        )
      : undefined;

  visit.capturedAt =
    this.hasValue(capturedAt)
      ? this.validateDateTime(
          capturedAt,
          `${visitType}.capturedAt`,
        )
      : undefined;

  visit.deviceId =
    this.hasValue(deviceId)
      ? String(deviceId)
          .trim()
          .slice(0, 120)
      : undefined;

  return visit;
}
  /* =====================================================
     GET CURRENT VISITS
  ===================================================== */

  async getCurrentVisits(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const visits = await this.visitRepository.find({
      where: { applicationId },
      order: { updatedAt: "DESC" },
    });

    const documents = await this.getFieldVisitDocuments(
      this.dataSource.manager,
      applicationId,
    );

    const latestByType = new Map<string, Visit>();

    for (const visit of visits) {
      if (!latestByType.has(visit.visitType)) {
        latestByType.set(visit.visitType, visit);
      }
    }

    const currentVisits = Array.from(latestByType.values()).map((visit) =>
      this.serializeVisit(visit, documents),
    );

    const checklistData =
      currentVisits.find(
        (visit) =>
          visit.checklistData && Object.keys(visit.checklistData).length > 0,
      )?.checklistData || {};

    const completionStatus = await this.getCompletionStatus(applicationId);

    return {
      success: true,
      data: {
        applicationId,
        propertyCategory: completionStatus.propertyCategory,
        visits: currentVisits,
        checklistData,
        completionStatus,
      },
    };
  }
  async saveVisit(
  applicationId: number,

  body: {
    propertyCategory?: string;

    checklistData?: Record<
      string,
      unknown
    >;

    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    capturedAt?: string;
    deviceId?: string;

    visit?: Record<string, any>;
  },

  userId?: number,
) {
  const propertyCategory =
    normalizePropertyCategory(
      body?.propertyCategory,
    );

  if (!propertyCategory) {
    throw new BadRequestException(
      'propertyCategory must be Residential, Commercial, Industrial or Land / Plot.',
    );
  }

  if (
    !body?.visit ||
    typeof body.visit !== 'object' ||
    Array.isArray(body.visit)
  ) {
    throw new BadRequestException(
      'visit object is required.',
    );
  }

  const input =
    body.visit;

  const visitType =
    normalizeVisitType(
      input.visitType,
    );

  if (!visitType) {
    throw new BadRequestException(
      `Invalid visit type: ${input.visitType || 'Empty'}`,
    );
  }

  const requiredVisitTypes =
    getRequiredVisitTypes(
      propertyCategory,
    );

  if (
    !requiredVisitTypes.includes(
      visitType,
    )
  ) {
    throw new BadRequestException(
      `${visitType} is not applicable for ${propertyCategory}.`,
    );
  }

  return this.dataSource.transaction(
    async (manager) => {
      await this.assertApplicationExists(
        manager,
        applicationId,
      );

      const visitRepository =
        manager.getRepository(Visit);

      /*
       * Find existing visit using:
       *
       * applicationId + visitType
       */
      let visit =
        await visitRepository.findOne({
          where: {
            applicationId,
            visitType,
          },

          order: {
            updatedAt: 'DESC',
          },
        });

      /*
       * Do not allow completed visits
       * to be converted back to DRAFT.
       */
      if (
        visit?.visitStatus ===
        VISIT_STATUS.COMPLETED
      ) {
        throw new BadRequestException(
          `${this.formatVisitTypeLabel(
            visitType,
          )} Visit is already completed.`,
        );
      }

      if (!visit) {
        visit =
          visitRepository.create({
            applicationId,
            visitType,

            visitStatus:
              VISIT_STATUS.DRAFT,

            createdBy:
              userId,
          });
      }

      visit =
        this.applyVisitDraftData({
          visit,
          applicationId,
          propertyCategory,
          visitType,
          input,
          body,
          userId,
        });

      const savedVisit =
        await visitRepository.save(
          visit,
        );

      return {
        success: true,

        message:
          `${this.formatVisitTypeLabel(
            visitType,
          )} Visit saved successfully.`,

        data: {
          visitId:
            Number(savedVisit.id),

          applicationId,

          visitType:
            savedVisit.visitType,

          visitStatus:
            savedVisit.visitStatus,
        },
      };
    },
  );
}

  /* =====================================================
     COMPLETE VISITS

     saveDraft() is removed. This method now:
     1. Creates or updates the required visit rows.
     2. Saves form, checklist and location data.
     3. Validates documents and mandatory fields.
     4. Marks all required visits as COMPLETED.
  ===================================================== */

  async completeVisits(
    applicationId: number,
    body: Record<string, any>,
    userId?: number,
  ) {
    const propertyCategory = normalizePropertyCategory(body?.propertyCategory);

    if (!propertyCategory) {
      throw new BadRequestException(
        "propertyCategory must be Residential, Commercial, Industrial or Land / Plot.",
      );
    }

    const requiredVisitTypes = getRequiredVisitTypes(propertyCategory);

    if (!requiredVisitTypes.length) {
      throw new BadRequestException(
        `No field visit configuration found for ${propertyCategory}.`,
      );
    }

    const visitInputs = this.parseArray(body?.visits, "visits");

    const normalizedInputs = visitInputs.map((input) => {
      const visitType = normalizeVisitType(input?.visitType);

      if (!visitType) {
        throw new BadRequestException(
          `Invalid visit type: ${input?.visitType}`,
        );
      }

      if (!requiredVisitTypes.includes(visitType)) {
        throw new BadRequestException(
          `${visitType} is not applicable for ${propertyCategory}. Required visits: ${requiredVisitTypes.join(", ")}.`,
        );
      }

      return {
        ...input,
        visitType,
      };
    });

    const duplicateVisitTypes = normalizedInputs
      .map((visit) => visit.visitType)
      .filter(
        (visitType, index, allVisitTypes) =>
          allVisitTypes.indexOf(visitType) !== index,
      );

    if (duplicateVisitTypes.length) {
      throw new BadRequestException(
        `Duplicate visit types received: ${[
          ...new Set(duplicateVisitTypes),
        ].join(", ")}.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await this.assertApplicationExists(manager, applicationId);

      const visitRepository = manager.getRepository(Visit);

      const existingVisits = await visitRepository.find({
        where: { applicationId },
        order: { updatedAt: "DESC" },
      });

      const latestExistingByType = new Map<string, Visit>();

      for (const visit of existingVisits) {
        if (!latestExistingByType.has(visit.visitType)) {
          latestExistingByType.set(visit.visitType, visit);
        }
      }

      const alreadyCompleted = requiredVisitTypes.every(
        (visitType) =>
          latestExistingByType.get(visitType)?.visitStatus ===
          VISIT_STATUS.COMPLETED,
      );

      if (alreadyCompleted) {
        return {
          success: true,
          message: "Field visits were already completed.",
          data: {
            applicationId,
            propertyCategory,
            completedVisitTypes: requiredVisitTypes,
            completedAt:
              latestExistingByType.get(requiredVisitTypes[0])?.updatedAt ||
              new Date(),
          },
        };
      }

      if (!normalizedInputs.length) {
        throw new BadRequestException(
          "visits must contain all required field visit records.",
        );
      }

      const inputByType = new Map<string, Record<string, any>>();

      for (const input of normalizedInputs) {
        inputByType.set(input.visitType, input);
      }

      const missingInputTypes = requiredVisitTypes.filter(
        (visitType) => !inputByType.has(visitType),
      );

      if (missingInputTypes.length) {
        throw new BadRequestException({
          success: false,
          errorCode: "FIELD_VISITS_MISSING",
          message:
            "All required field visits must be submitted before completion.",
          missingVisitTypes: missingInputTypes,
        });
      }

      const commonChecklist = this.parseObject(
        body?.checklistData,
        "checklistData",
        {},
      );

      const savedVisits: Visit[] = [];

      for (const visitType of requiredVisitTypes) {
        const input = inputByType.get(visitType)!;

        let visit = latestExistingByType.get(visitType);

        if (!visit || visit.visitStatus === VISIT_STATUS.COMPLETED) {
          visit = visitRepository.create({
            applicationId,
            visitType,
            visitStatus: VISIT_STATUS.DRAFT,
            createdBy: userId,
          });
        }

        visit.applicationId = applicationId;
        visit.visitType = visitType;
        visit.visitStatus = VISIT_STATUS.DRAFT;
        visit.propertyCategory = propertyCategory;
        visit.updatedBy = userId;

        const visitDate = input.visitDate ?? body.visitDate;

        if (this.hasValue(visitDate)) {
          visit.visitDate = this.validateDate(
            visitDate,
            `${visitType}.visitDate`,
          );
        } else {
          visit.visitDate = undefined;
        }

        const rawVisitResult = input.visitResult ?? input.visitStatus;

        if (this.hasValue(rawVisitResult)) {
          const visitResult = normalizeVisitResult(rawVisitResult);

          if (!visitResult) {
            throw new BadRequestException(
              `${visitType}: visitResult must be Positive, Negative or Refer.`,
            );
          }

          visit.visitResult = visitResult;
        } else {
          visit.visitResult = undefined;
        }

        if (this.hasValue(input.propertyType)) {
          visit.propertyType = String(input.propertyType).trim().slice(0, 80);
        } else if (PROPERTY_VISIT_VISIT_TYPES.includes(visitType as any)) {
          visit.propertyType = undefined;
        }

        const remarks =
          input.remarks ??
          input.residenceRemarks ??
          input.businessRemarks ??
          input.propertyRemarks;

        visit.remarks = this.validateRemarks(remarks);

        const explicitFormData = this.parseObject(
          input.formData,
          `${visitType}.formData`,
          {},
        );

        visit.formData = {
          ...this.extractFormData(input),
          ...explicitFormData,
        };

        const visitChecklist = this.parseObject(
          input.checklistData,
          `${visitType}.checklistData`,
          {},
        );

        visit.checklistData = {
          ...commonChecklist,
          ...visitChecklist,
        };

        const latitude = input.latitude ?? body.latitude;
        const longitude = input.longitude ?? body.longitude;
        const locationAccuracy =
          input.locationAccuracy ?? body.locationAccuracy;
        const capturedAt = input.capturedAt ?? body.capturedAt;
        const deviceId = input.deviceId ?? body.deviceId;

        visit.latitude = this.hasValue(latitude)
          ? this.validateCoordinate(latitude, `${visitType}.latitude`, -90, 90)
          : undefined;

        visit.longitude = this.hasValue(longitude)
          ? this.validateCoordinate(
              longitude,
              `${visitType}.longitude`,
              -180,
              180,
            )
          : undefined;

        visit.locationAccuracy = this.hasValue(locationAccuracy)
          ? this.validatePositiveNumber(
              locationAccuracy,
              `${visitType}.locationAccuracy`,
            )
          : undefined;

        visit.capturedAt = this.hasValue(capturedAt)
          ? this.validateDateTime(capturedAt, `${visitType}.capturedAt`)
          : undefined;

        visit.deviceId = this.hasValue(deviceId)
          ? String(deviceId).trim().slice(0, 120)
          : undefined;

        savedVisits.push(await visitRepository.save(visit));
      }

      const documents = await this.getFieldVisitDocuments(
        manager,
        applicationId,
      );

      const errors: string[] = [];

      for (const visit of savedVisits) {
        this.validateVisitForCompletion(visit, documents, errors);
      }

      this.validateChecklist(savedVisits, errors);

      if (errors.length) {
        throw new BadRequestException({
          success: false,
          errorCode: "FIELD_VISIT_VALIDATION_ERROR",
          message: errors,
          errors,
        });
      }

      const completedVisits: Visit[] = [];

      for (const visit of savedVisits) {
        visit.visitStatus = VISIT_STATUS.COMPLETED;
        visit.updatedBy = userId;
        completedVisits.push(await visitRepository.save(visit));
      }

      return {
        success: true,
        message: "Field visits completed successfully.",
        data: {
          applicationId,
          propertyCategory,
          completedVisitTypes: completedVisits.map((visit) => visit.visitType),
          completedAt: new Date().toISOString(),
        },
      };
    });
  }

  /* =====================================================
     VISIT HISTORY
  ===================================================== */

  async getVisitHistory(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const visits = await this.visitRepository.find({
      where: {
        applicationId,
        visitStatus: VISIT_STATUS.COMPLETED,
      },
      order: { updatedAt: "DESC" },
    });

    const documents = await this.getFieldVisitDocuments(
      this.dataSource.manager,
      applicationId,
    );

    return {
      success: true,
      data: visits.map((visit) => this.serializeVisit(visit, documents)),
    };
  }

  /* =====================================================
     COMPLETION STATUS
  ===================================================== */

  async getCompletionStatus(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const visits = await this.visitRepository.find({
      where: { applicationId },
      order: { updatedAt: "DESC" },
    });

    const latestByType = new Map<string, Visit>();

    for (const visit of visits) {
      if (!latestByType.has(visit.visitType)) {
        latestByType.set(visit.visitType, visit);
      }
    }

    const propertyCategory =
      Array.from(latestByType.values()).find((visit) => visit.propertyCategory)
        ?.propertyCategory || null;

    if (!propertyCategory) {
      return {
        completed: false,
        propertyCategory: null,
        requiredVisitTypes: [],
        completedVisitTypes: [],
        completedCount: 0,
        requiredCount: 0,
      };
    }

    const requiredVisitTypes = getRequiredVisitTypes(propertyCategory);

    const completedVisitTypes = requiredVisitTypes.filter(
      (visitType) =>
        latestByType.get(visitType)?.visitStatus === VISIT_STATUS.COMPLETED,
    );

    return {
      completed:
        requiredVisitTypes.length > 0 &&
        completedVisitTypes.length === requiredVisitTypes.length,
      propertyCategory,
      requiredVisitTypes,
      completedVisitTypes,
      completedCount: completedVisitTypes.length,
      requiredCount: requiredVisitTypes.length,
    };
  }

  /* =====================================================
     GET FIELD VISIT DOCUMENTS
  ===================================================== */

  async getDocuments(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const documents = await this.getFieldVisitDocuments(
      this.dataSource.manager,
      applicationId,
    );

    return {
      success: true,
      message: "Field visit documents fetched successfully.",
      data: {
        applicationId,
        documents: documents.map((document) =>
          this.serializeDocument(document),
        ),
      },
    };
  }

  /* =====================================================
     UPLOAD FIELD VISIT DOCUMENT
  ===================================================== */

  async uploadDocument(
    applicationId: number,
    body: Record<string, any>,
    file: Express.Multer.File,
    userId?: number,
  ) {
    try {
      await this.assertApplicationExists(
        this.dataSource.manager,
        applicationId,
      );

      if (!file) {
        throw new BadRequestException("Field visit photo is required.");
      }

      const visitType = normalizeVisitType(body?.visitType);

      if (!visitType) {
        throw new BadRequestException("A valid visitType is required.");
      }

      const allowedDocumentNames = DOCUMENT_NAMES[visitType];

      if (!allowedDocumentNames) {
        throw new BadRequestException(
          `No document configuration found for visit type ${visitType}.`,
        );
      }

      const documentName = String(body?.documentName || "")
        .trim()
        .toUpperCase();

      if (!documentName) {
        throw new BadRequestException("documentName is required.");
      }

      if (!allowedDocumentNames.includes(documentName)) {
        throw new BadRequestException(
          `${documentName} is not valid for ${visitType}. Allowed document names: ${allowedDocumentNames.join(", ")}.`,
        );
      }

      const existingDocumentByName = await this.documentRepository.findOne({
        where: {
          applicationId,
          documentName,
          documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
        },
      });

      if (existingDocumentByName) {
        throw new BadRequestException(
          `${documentName} has already been uploaded for this application.`,
        );
      }

      const uploadedFileHash = this.createFileHash(file.path);

      const existingDocuments = await this.getFieldVisitDocuments(
        this.dataSource.manager,
        applicationId,
      );

      for (const existingDocument of existingDocuments) {
        const existingAbsolutePath = this.resolveAbsolutePath(
          existingDocument.filePath,
        );

        if (!existsSync(existingAbsolutePath)) {
          continue;
        }

        const existingFileHash = this.createFileHash(existingAbsolutePath);

        if (uploadedFileHash === existingFileHash) {
          throw new BadRequestException(
            `Duplicate field visit image detected: ${file.originalname}`,
          );
        }
      }

      const relativeFilePath = relative(process.cwd(), file.path).replace(
        /\\/g,
        "/",
      );

      const document = this.documentRepository.create({
        applicationId,
        documentType: DocumentType.PHOTO,
        documentName,
        documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
        fileName: file.originalname,
        filePath: relativeFilePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: userId,
        createdBy: userId,
        updatedBy: userId,
        status: DocumentStatus.UPLOADED,
      });

      const savedDocument = await this.documentRepository.save(document);

      return {
        success: true,
        message: "Field visit document uploaded successfully.",
        data: this.serializeDocument(savedDocument),
      };
    } catch (error) {
      if (file?.path && existsSync(file.path)) {
        try {
          unlinkSync(file.path);
        } catch {
          // Preserve the original request error.
        }
      }

      throw error;
    }
  }

  /* =====================================================
     GET DOCUMENT FILE
  ===================================================== */

  async getDocumentFile(applicationId: number, documentId: number) {
    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        applicationId,
        documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
      },
    });

    if (!document) {
      throw new NotFoundException("Field visit document was not found.");
    }

    const absolutePath = this.resolveAbsolutePath(document.filePath);

    if (!existsSync(absolutePath)) {
      throw new NotFoundException(
        "Field visit file does not exist on the server.",
      );
    }

    return {
      document,
      absolutePath,
    };
  }

  /* =====================================================
     DELETE FIELD VISIT DOCUMENT
  ===================================================== */

  async deleteDocument(applicationId: number, documentId: number) {
    const document = await this.documentRepository.findOne({
      where: {
        id: documentId,
        applicationId,
        documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
      },
    });

    if (!document) {
      throw new NotFoundException("Field visit document was not found.");
    }

    const visitType = getVisitTypeFromDocumentName(document.documentName);

    if (!visitType) {
      throw new BadRequestException(
        `Unable to identify visit type from document name ${document.documentName}.`,
      );
    }

    const completedVisit = await this.visitRepository.findOne({
      where: {
        applicationId,
        visitType,
        visitStatus: VISIT_STATUS.COMPLETED,
      },
    });

    if (completedVisit) {
      throw new BadRequestException(
        "Documents belonging to completed field visits cannot be deleted.",
      );
    }

    const absolutePath = this.resolveAbsolutePath(document.filePath);

    await this.documentRepository.remove(document);

    if (existsSync(absolutePath)) {
      try {
        unlinkSync(absolutePath);
      } catch {
        // The database row is already removed. Do not fail the request.
      }
    }

    return {
      success: true,
      message: "Field visit document deleted successfully.",
      data: {
        applicationId,
        documentId,
        documentName: document.documentName,
        visitType,
      },
    };
  }

  /* Temporary compatibility with an older controller method name. */
  async deleteDraftDocument(applicationId: number, documentId: number) {
    return this.deleteDocument(applicationId, documentId);
  }

  /* =====================================================
     COMPLETION VALIDATION
  ===================================================== */

  private validateVisitForCompletion(
    visit: Visit,
    documents: Document[],
    errors: string[],
  ) {
    if (!visit.visitDate) {
      errors.push(`${visit.visitType}: visit date is required.`);
    }

    if (
      !visit.visitResult ||
      ![
        VISIT_RESULT.POSITIVE,
        VISIT_RESULT.NEGATIVE,
        VISIT_RESULT.REFER,
      ].includes(visit.visitResult as any)
    ) {
      errors.push(`${visit.visitType}: valid visit result is required.`);
    }

    if (!visit.remarks || !visit.remarks.trim()) {
      errors.push(`${visit.visitType}: remarks are required.`);
    }

    const expectedDocumentNames = DOCUMENT_NAMES[visit.visitType] || [];

    const visitDocuments = documents.filter((document) =>
      expectedDocumentNames.includes(document.documentName),
    );

    if (!visitDocuments.length) {
      errors.push(`${visit.visitType}: at least one photo is required.`);
    }

    if (visit.visitType === VISIT_TYPE.CUSTOMER_RESIDENCE) {
      this.requireFormFields(
        visit,
        ["customerName", "personMet", "residenceAddress", "residenceType"],
        errors,
      );
    }

    if (visit.visitType === VISIT_TYPE.BUSINESS_OFFICE) {
      this.requireFormFields(
        visit,
        [
          "occupationType",
          "businessName",
          "businessVintage",
          "businessActivity",
          "employeeCount",
          "stockOfficeSetup",
        ],
        errors,
      );
    }

    if (PROPERTY_VISIT_VISIT_TYPES.includes(visit.visitType as any)) {
      if (!visit.propertyType) {
        errors.push(`${visit.visitType}: propertyType is required.`);
      }

      this.requireFormFields(
        visit,
        [
          "propertyAddress",
          "ownership",
          "usage",
          "area",
          "propertyCondition",
          "nearbyLandmark",
          "marketValue",
        ],
        errors,
      );
    }

    if (
      visit.visitType !== VISIT_TYPE.LAND_PLOT &&
      PROPERTY_VISIT_VISIT_TYPES.includes(visit.visitType as any)
    ) {
      this.requireFormFields(visit, ["occupancy"], errors);
    }

    if (visit.visitType === VISIT_TYPE.INDUSTRIAL_PROPERTY) {
      this.requireFormFields(
        visit,
        ["approachRoad", "machineryAvailable"],
        errors,
      );
    }

    if (visit.visitType === VISIT_TYPE.LAND_PLOT) {
      this.requireFormFields(
        visit,
        ["boundaryAvailable", "surveyNumber"],
        errors,
      );
    }
  }

  private validateChecklist(visits: Visit[], errors: string[]) {
    const combinedChecklist: Record<string, unknown> = {};

    for (const visit of visits) {
      Object.assign(combinedChecklist, visit.checklistData || {});
    }

    for (const key of FIELD_VISIT_CHECKLIST_KEYS) {
      if (!this.toBoolean(combinedChecklist[key])) {
        errors.push(`Checklist item "${key}" must be confirmed.`);
      }
    }
  }

  private requireFormFields(visit: Visit, fields: string[], errors: string[]) {
    const formData = visit.formData || {};

    for (const field of fields) {
      if (!this.hasValue(formData[field])) {
        errors.push(`${visit.visitType}: ${field} is required.`);
      }
    }
  }

  /* =====================================================
     DOCUMENT HELPERS
  ===================================================== */

  private async getFieldVisitDocuments(
    manager: EntityManager,
    applicationId: number,
  ) {
    return manager.getRepository(Document).find({
      where: {
        applicationId,
        documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
        status: DocumentStatus.UPLOADED,
      },
      order: { createdAt: "ASC" },
    });
  }

  private serializeDocument(document: Document) {
    return {
      id: Number(document.id),
      applicationId: Number(document.applicationId),
      documentType: document.documentType,
      documentName: document.documentName,
      documentSource: document.documentSource,
      fileName: document.fileName,
      fileSize: Number(document.fileSize),
      mimeType: document.mimeType,
      status: document.status,
      fileUrl:
        `${UPLOAD_BASE_URL}/api/applications/` +
        `${document.applicationId}/field-visits/documents/` +
        `${document.id}/file`,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private serializeVisit(visit: Visit, documents: Document[]) {
    const visitDocumentNames = DOCUMENT_NAMES[visit.visitType] || [];

    const visitDocuments = documents
      .filter((document) => visitDocumentNames.includes(document.documentName))
      .map((document) => this.serializeDocument(document));

    return {
      id: Number(visit.id),
      applicationId: Number(visit.applicationId),
      visitType: visit.visitType,
      visitDate: visit.visitDate,
      visitStatus: visit.visitStatus,
      visitResult: visit.visitResult,
      propertyCategory: visit.propertyCategory,
      propertyType: visit.propertyType,
      formData: visit.formData || {},
      checklistData: visit.checklistData || {},
      latitude: visit.latitude,
      longitude: visit.longitude,
      locationAccuracy: visit.locationAccuracy,
      capturedAt: visit.capturedAt,
      deviceId: visit.deviceId,
      remarks: visit.remarks,
      documents: visitDocuments,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    };
  }

  private createFileHash(filePath: string) {
    return createHash("sha256").update(readFileSync(filePath)).digest("hex");
  }

  private resolveAbsolutePath(filePath: string) {
    if (isAbsolute(filePath)) {
      return filePath;
    }

    return join(process.cwd(), filePath);
  }

  /* =====================================================
     PARSING AND VALIDATION
  ===================================================== */

  private parseArray(value: unknown, fieldName: string): Record<string, any>[] {
    if (!value) {
      return [];
    }

    let parsed = value;

    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new BadRequestException(`${fieldName} must contain valid JSON.`);
      }
    }

    if (!Array.isArray(parsed)) {
      throw new BadRequestException(`${fieldName} must be an array.`);
    }

    return parsed;
  }

  private parseObject(
    value: unknown,
    fieldName: string,
    defaultValue: Record<string, any> = {},
  ) {
    if (value === undefined || value === null || value === "") {
      return defaultValue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, any>;
    }

    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error();
        }

        return parsed;
      } catch {
        throw new BadRequestException(
          `${fieldName} must contain a valid JSON object.`,
        );
      }
    }

    throw new BadRequestException(`${fieldName} must be an object.`);
  }

  private extractFormData(input: Record<string, any>) {
    const excludedFields = new Set([
      "visitType",
      "visitDate",
      "visitStatus",
      "visitResult",
      "propertyCategory",
      "propertyType",
      "formData",
      "checklistData",
      "latitude",
      "longitude",
      "locationAccuracy",
      "capturedAt",
      "deviceId",
      "remarks",
      "residenceRemarks",
      "businessRemarks",
      "propertyRemarks",
    ]);

    const formData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
      if (!excludedFields.has(key) && value !== undefined) {
        formData[key] = value;
      }
    }

    return formData;
  }

  private validateDate(value: unknown, fieldName: string) {
    const date = String(value || "").trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        `${fieldName} must be in YYYY-MM-DD format.`,
      );
    }

    const parsedDate = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException(`${fieldName} is not a valid date.`);
    }

    return date;
  }

  private validateDateTime(value: unknown, fieldName: string) {
    const date = new Date(String(value));

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        `${fieldName} must be a valid date and time.`,
      );
    }

    return date;
  }

  private validateCoordinate(
    value: unknown,
    fieldName: string,
    minimum: number,
    maximum: number,
  ) {
    const coordinate = Number(value);

    if (
      !Number.isFinite(coordinate) ||
      coordinate < minimum ||
      coordinate > maximum
    ) {
      throw new BadRequestException(
        `${fieldName} must be between ${minimum} and ${maximum}.`,
      );
    }

    return coordinate.toFixed(7);
  }

  private validatePositiveNumber(value: unknown, fieldName: string) {
    const number = Number(value);

    if (!Number.isFinite(number) || number < 0) {
      throw new BadRequestException(
        `${fieldName} must be a valid positive number.`,
      );
    }

    return number.toFixed(2);
  }

  private validateRemarks(value: unknown) {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (typeof value !== "string") {
      throw new BadRequestException("remarks must be a string.");
    }

    const remarks = value.trim();

    if (remarks.length > 500) {
      throw new BadRequestException("remarks must not exceed 500 characters.");
    }

    return remarks;
  }

  private hasValue(value: unknown) {
    if (value === undefined || value === null) {
      return false;
    }

    if (typeof value === "string") {
      return value.trim() !== "";
    }

    return true;
  }

  private toBoolean(value: unknown) {
    return (
      value === true ||
      value === 1 ||
      value === "1" ||
      String(value).toLowerCase() === "true"
    );
  }

  /* =====================================================
     APPLICATION CHECK
  ===================================================== */

  private async assertApplicationExists(
    manager: EntityManager,
    applicationId: number,
  ) {
    const application = await manager.getRepository(Application).findOne({
      where: { id: applicationId },
      select: { id: true },
    });

    if (!application) {
      throw new NotFoundException(
        `Application ${applicationId} was not found.`,
      );
    }
  }
}
