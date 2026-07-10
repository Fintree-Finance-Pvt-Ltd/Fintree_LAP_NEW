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
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { WorkflowLog } from '../workflow/entities/workflow-log.entity';
import { WorkflowLogAction } from '../../common/enums/workflow-action.enum';
import {
  DOCUMENT_NAMES,
  DOCUMENT_SOURCE,
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
    residenceRemarks?: string;
    businessRemarks?: string;
    propertyRemarks?: string;

    formData?: Record<string, unknown>;

    latitude?: number;
    longitude?: number;
    locationAccuracy?: number;
    capturedAt?: string;
    deviceId?: string;

    [key: string]: unknown;
  };
};

@Injectable()
export class FieldVisitsService {
 constructor(
  private readonly dataSource: DataSource,

  @InjectRepository(Visit)
  private readonly visitRepository: Repository<Visit>,

  @InjectRepository(Document)
  private readonly documentRepository: Repository<Document>,

  @InjectRepository(Application)
  private readonly applicationRepository: Repository<Application>,

  @InjectRepository(WorkflowLog)
  private readonly workflowLogRepository: Repository<WorkflowLog>,
) {} 

  /* =====================================================
     GET CURRENT VISITS
  ===================================================== */

  async getCurrentVisits(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const visits = await this.visitRepository.find({
      where: {
        applicationId,
      },

      order: {
        updatedAt: "DESC",
      },
    });

    const documents = await this.getFieldVisitDocuments(
      this.dataSource.manager,
      applicationId,
    );

    /*
     * The unique database index should ensure
     * one row per applicationId + visitType.
     *
     * This Map also protects old data that may
     * already contain duplicate rows.
     */
    const latestByType = new Map<string, Visit>();

    for (const visit of visits) {
      if (!latestByType.has(visit.visitType)) {
        latestByType.set(visit.visitType, visit);
      }
    }

    const currentVisits = Array.from(latestByType.values()).map((visit) =>
      this.serializeVisit(visit, documents),
    );


    const completionStatus = await this.getCompletionStatus(applicationId);

    return {
      success: true,

      message: "Field visits fetched successfully.",

      data: {
        applicationId,

        propertyCategory: completionStatus.propertyCategory,

        visits: currentVisits,

        completionStatus,
      },
    };
  }

  /* =====================================================
     SAVE ONE VISIT AS DRAFT
  ===================================================== */

  async saveVisit(applicationId: number, body: SaveVisitBody, userId?: number) {
    const propertyCategory = normalizePropertyCategory(body?.propertyCategory);

    if (!propertyCategory) {
      throw new BadRequestException(
        "propertyCategory must be Residential, Commercial, Industrial or Land / Plot.",
      );
    }

    if (
      !body?.visit ||
      typeof body.visit !== "object" ||
      Array.isArray(body.visit)
    ) {
      throw new BadRequestException("visit object is required.");
    }

    const input = body.visit as Record<string, any>;

    const visitType = normalizeVisitType(input.visitType);

    if (!visitType) {
      throw new BadRequestException(
        `Invalid visit type: ${input.visitType || "Empty"}.`,
      );
    }

    const requiredVisitTypes = getRequiredVisitTypes(propertyCategory);

    if (!requiredVisitTypes.includes(visitType)) {
      throw new BadRequestException(
        `${visitType} is not applicable for ${propertyCategory}. Required visits: ${requiredVisitTypes.join(
          ", ",
        )}.`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      await this.assertApplicationExists(manager, applicationId);

      const visitRepository = manager.getRepository(Visit);

      /*
       * One record per:
       *
       * applicationId + visitType
       */
      let visit = await visitRepository.findOne({
        where: {
          applicationId,
          visitType,
        },

        order: {
          updatedAt: "DESC",
        },
      });

      if (visit?.visitStatus === VISIT_STATUS.COMPLETED) {
        throw new BadRequestException(
          `${this.formatVisitTypeLabel(
            visitType,
          )} Visit has already been completed and cannot be modified.`,
        );
      }

      if (!visit) {
        visit = visitRepository.create({
          applicationId,
          visitType,

          visitStatus: VISIT_STATUS.DRAFT,

          createdBy: userId,
        });
      }

      this.applyVisitData({
        visit,
        applicationId,
        propertyCategory,
        visitType,
        input,
        body: body as Record<string, any>,
        userId,
      });

      visit.visitStatus = VISIT_STATUS.DRAFT;

      const savedVisit = await visitRepository.save(visit);

      const visitWorkflowAction =
        visitType === VISIT_TYPE.CUSTOMER_RESIDENCE
          ? WorkflowLogAction.CUSTOMER_VISIT_DONE
          : visitType === VISIT_TYPE.BUSINESS_OFFICE
          ? WorkflowLogAction.BUSINESS_VISIT_DONE
          : PROPERTY_VISIT_VISIT_TYPES.includes(visitType as any)
          ? WorkflowLogAction.PROPERTY_VISIT_DONE
          : null;

    if (visitWorkflowAction) {
  const workflowLogRepository = manager.getRepository(WorkflowLog);

  const existingWorkflowLog = await workflowLogRepository.findOne({
    where: {
      applicationId,
      action: visitWorkflowAction,
    },
  });

  if (!existingWorkflowLog) {
    await workflowLogRepository.save(
      workflowLogRepository.create({
        applicationId,
        action: visitWorkflowAction,
        remarks: `${this.formatVisitTypeLabel(
          visitType,
        )} visit saved successfully.`,
        createdBy: userId,
        updatedBy: userId,
      }),
    );
  }
}

const isPropertyVisit = PROPERTY_VISIT_VISIT_TYPES.includes(
  visitType as any,
);

let applicationStatus: ApplicationStatus | null = null;
let nextRoute: string | null = null;

if (isPropertyVisit) {
  const applicationRepository = manager.getRepository(Application);

  const application = await applicationRepository.findOne({
    where: {
      id: applicationId,
    },
  });

  if (!application) {
    throw new NotFoundException(
      `Application ${applicationId} was not found.`,
    );
  }

  application.status = ApplicationStatus.IN_PROGRESS;
  application.updatedBy = userId;

  await applicationRepository.save(application);

  applicationStatus = ApplicationStatus.IN_PROGRESS;
  nextRoute = `/geo-verification/${applicationId}`;
}

  return {
  success: true,

  message: `${this.formatVisitTypeLabel(
    visitType,
  )} Visit saved successfully.`,

  data: {
    visitId: Number(savedVisit.id),

    applicationId,

    visitType: savedVisit.visitType,

    visitStatus: savedVisit.visitStatus,

    propertyCategory: savedVisit.propertyCategory,

    applicationStatus,

    geoVerificationReady: isPropertyVisit,

    nextRoute,

    updatedAt: savedVisit.updatedAt,
  },
};
    });
  }

  /* =====================================================
     COMPLETE ALL VISITS
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
          `Invalid visit type: ${input?.visitType}.`,
        );
      }

      if (!requiredVisitTypes.includes(visitType)) {
        throw new BadRequestException(
          `${visitType} is not applicable for ${propertyCategory}.`,
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
        where: {
          applicationId,
        },

        order: {
          updatedAt: "DESC",
        },
      });

      const existingByType = new Map<string, Visit>();

      for (const visit of existingVisits) {
        if (!existingByType.has(visit.visitType)) {
          existingByType.set(visit.visitType, visit);
        }
      }

      const alreadyCompleted = requiredVisitTypes.every(
        (visitType) =>
          existingByType.get(visitType)?.visitStatus === VISIT_STATUS.COMPLETED,
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
              existingByType.get(requiredVisitTypes[0])?.updatedAt ||
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

      const savedVisits: Visit[] = [];

      /*
       * Update the same draft rows.
       * No new duplicate rows are created.
       */
      for (const visitType of requiredVisitTypes) {
        const input = inputByType.get(visitType)!;

        let visit = existingByType.get(visitType);

        if (!visit) {
          visit = visitRepository.create({
            applicationId,
            visitType,

            visitStatus: VISIT_STATUS.DRAFT,

            createdBy: userId,
          });
        }

        this.applyVisitData({
          visit,
          applicationId,
          propertyCategory,
          visitType,
          input,
          body,
          userId,
        });

        visit.visitStatus = VISIT_STATUS.DRAFT;

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
  visit.visitStatus =
    VISIT_STATUS.COMPLETED;

  visit.updatedBy =
    userId;

  completedVisits.push(
    await visitRepository.save(
      visit,
    ),
  );
}

const applicationRepository =
  manager.getRepository(
    Application,
  );

const workflowLogRepository =
  manager.getRepository(
    WorkflowLog,
  );

const application =
  await applicationRepository.findOne({
    where: {
      id: applicationId,
    },
  });

if (!application) {
  throw new NotFoundException(
    `Application ${applicationId} was not found.`,
  );
}

application.status =
  ApplicationStatus.IN_PROGRESS;

application.updatedBy =
  userId;

await applicationRepository.save(
  application,
);

const existingWorkflowLog =
  await workflowLogRepository.findOne({
    where: {
      applicationId,
      action:
        WorkflowLogAction.CUSTOMER_VISIT_DONE,
    },
  });

if (!existingWorkflowLog) {
  const workflowLog =
    workflowLogRepository.create({
      applicationId,

      action:
        WorkflowLogAction.CUSTOMER_VISIT_DONE,

      remarks:
        'Field visits completed successfully.',

      createdBy: userId,
      updatedBy: userId,
    });

  await workflowLogRepository.save(
    workflowLog,
  );
}

return {
  success: true,

  message:
    'Field visits completed successfully.',

  data: {
    applicationId,

    applicationStatus:
      ApplicationStatus.IN_PROGRESS,

    workflowAction:
      WorkflowLogAction.CUSTOMER_VISIT_DONE,

    customerVisit:
      true,

    propertyCategory,

    completedVisitTypes:
      completedVisits.map(
        (visit) =>
          visit.visitType,
      ),

    completedAt:
      new Date().toISOString(),
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

      order: {
        updatedAt: "DESC",
      },
    });

    const documents = await this.getFieldVisitDocuments(
      this.dataSource.manager,
      applicationId,
    );

    return {
      success: true,

      message: "Field visit history fetched successfully.",

      data: {
        applicationId,

        visits: visits.map((visit) => this.serializeVisit(visit, documents)),
      },
    };
  }

  /* =====================================================
     COMPLETION STATUS
  ===================================================== */

  async getCompletionStatus(applicationId: number) {
    await this.assertApplicationExists(this.dataSource.manager, applicationId);

    const visits = await this.visitRepository.find({
      where: {
        applicationId,
      },

      order: {
        updatedAt: "DESC",
      },
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

        savedVisitTypes: [],

        completedVisitTypes: [],

        savedCount: 0,

        completedCount: 0,

        requiredCount: 0,
      };
    }

    const requiredVisitTypes = getRequiredVisitTypes(propertyCategory);

    const savedVisitTypes = requiredVisitTypes.filter((visitType) =>
      Boolean(latestByType.get(visitType)),
    );

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

      savedVisitTypes,

      completedVisitTypes,

      savedCount: savedVisitTypes.length,

      completedCount: completedVisitTypes.length,

      requiredCount: requiredVisitTypes.length,
    };
  }

  /* =====================================================
     GET DOCUMENTS
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
     UPLOAD DOCUMENT
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
          `No document configuration found for ${visitType}.`,
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
          `${documentName} is not valid for ${visitType}. Allowed names: ${allowedDocumentNames.join(
            ", ",
          )}.`,
        );
      }

      const existingDocument = await this.documentRepository.findOne({
        where: {
          applicationId,

          documentName,

          documentSource: DOCUMENT_SOURCE.FIELD_VISIT,
        },
      });

      if (existingDocument) {
        throw new BadRequestException(
          `${documentName} has already been uploaded.`,
        );
      }

      const uploadedFileHash = this.createFileHash(file.path);

      const existingDocuments = await this.getFieldVisitDocuments(
        this.dataSource.manager,
        applicationId,
      );

      for (const document of existingDocuments) {
        const existingPath = this.resolveAbsolutePath(document.filePath);

        if (!existsSync(existingPath)) {
          continue;
        }

        const existingHash = this.createFileHash(existingPath);

        if (uploadedFileHash === existingHash) {
          throw new BadRequestException(
            `Duplicate field visit image detected: ${file.originalname}.`,
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
          // Keep original error.
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
     DELETE DOCUMENT
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
        `Unable to identify visit type from ${document.documentName}.`,
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
        // Database row is already deleted.
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

  /* =====================================================
     SHARED VISIT ASSIGNMENT
  ===================================================== */

  private applyVisitData({
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
    visit.applicationId = applicationId;

    visit.visitType = visitType;

    visit.propertyCategory = propertyCategory;

    visit.updatedBy = userId;

    if (!visit.createdBy && userId) {
      visit.createdBy = userId;
    }

    const visitDate = input.visitDate ?? body.visitDate;

    if (this.hasValue(visitDate)) {
      visit.visitDate = this.validateDate(visitDate, `${visitType}.visitDate`);
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
    }

    if (Object.prototype.hasOwnProperty.call(input, "propertyType")) {
      visit.propertyType = this.hasValue(input.propertyType)
        ? String(input.propertyType).trim().slice(0, 80)
        : (null as any);
    } else if (!PROPERTY_VISIT_VISIT_TYPES.includes(visitType as any)) {
      visit.propertyType = null as any;
    }

    const remarks =
      input.remarks ??
      input.residenceRemarks ??
      input.businessRemarks ??
      input.propertyRemarks;

    if (remarks !== undefined) {
      visit.remarks = this.validateRemarks(remarks);
    }

    /*
     * All card-specific frontend fields
     * are saved in formData.
     */
    const explicitFormData = this.parseObject(
      input.formData,
      `${visitType}.formData`,
      {},
    );

    visit.formData = {
      ...(visit.formData || {}),

      ...this.extractFormData(input),

      ...explicitFormData,
    };



    const latitude = input.latitude ?? body.latitude;

    const longitude = input.longitude ?? body.longitude;

    const locationAccuracy = input.locationAccuracy ?? body.locationAccuracy;

    const capturedAt = input.capturedAt ?? body.capturedAt;

    const deviceId = input.deviceId ?? body.deviceId;

    if (this.hasValue(latitude)) {
      visit.latitude = this.validateCoordinate(
        latitude,
        `${visitType}.latitude`,
        -90,
        90,
      );
    }

    if (this.hasValue(longitude)) {
      visit.longitude = this.validateCoordinate(
        longitude,
        `${visitType}.longitude`,
        -180,
        180,
      );
    }

    if (this.hasValue(locationAccuracy)) {
      visit.locationAccuracy = this.validatePositiveNumber(
        locationAccuracy,
        `${visitType}.locationAccuracy`,
      );
    }

    if (this.hasValue(capturedAt)) {
      visit.capturedAt = this.validateDateTime(
        capturedAt,
        `${visitType}.capturedAt`,
      );
    }

    if (this.hasValue(deviceId)) {
      visit.deviceId = String(deviceId).trim().slice(0, 120);
    }

    return visit;
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

      order: {
        createdAt: "ASC",
      },
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
    const expectedDocumentNames = DOCUMENT_NAMES[visit.visitType] || [];

    const visitDocuments = documents
      .filter((document) =>
        expectedDocumentNames.includes(document.documentName),
      )
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


      latitude: visit.latitude ? Number(visit.latitude) : null,

      longitude: visit.longitude ? Number(visit.longitude) : null,

      locationAccuracy: visit.locationAccuracy
        ? Number(visit.locationAccuracy)
        : null,

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


  private formatVisitTypeLabel(visitType: string) {
    return String(visitType)
      .toLowerCase()
      .split("_")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  /* =====================================================
     APPLICATION CHECK
  ===================================================== */

  private async assertApplicationExists(
    manager: EntityManager,
    applicationId: number,
  ) {
    const application = await manager.getRepository(Application).findOne({
      where: {
        id: applicationId,
      },

      select: {
        id: true,
      },
    });

    if (!application) {
      throw new NotFoundException(
        `Application ${applicationId} was not found.`,
      );
    }
  }
}
