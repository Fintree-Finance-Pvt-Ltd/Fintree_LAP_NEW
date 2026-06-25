// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from "@nestjs/common";
// import { DataSource } from "typeorm";

// const DEFAULT_CHECKLIST = [
//   {
//     code: "SOURCE_VERIFIED",
//     title: "Source and partner verified",
//     sortOrder: 1,
//   },
//   {
//     code: "APPLICANT_CONTACTED",
//     title: "Applicant contacted",
//     sortOrder: 2,
//   },
//   {
//     code: "DUPLICATE_CHECKED",
//     title: "Duplicate PAN/mobile checked",
//     sortOrder: 3,
//   },
//   {
//     code: "FIELD_VISIT_ACCEPTABLE",
//     title: "Field visit acceptable",
//     sortOrder: 4,
//   },
//   {
//     code: "GEO_WITHIN_RADIUS",
//     title: "Geo within permitted radius",
//     sortOrder: 5,
//   },
//   {
//     code: "DOCUMENTS_AVAILABLE",
//     title: "Minimum documents available",
//     sortOrder: 6,
//   },
//   {
//     code: "LOAN_PURPOSE_ACCEPTABLE",
//     title: "Loan purpose acceptable",
//     sortOrder: 7,
//   },
//   {
//     code: "NO_NEGATIVE_FINDING",
//     title: "No negative field finding",
//     sortOrder: 8,
//   },
// ];

// @Injectable()
// export class BmService {
//   constructor(
//     private readonly dataSource: DataSource,
//   ) {}

//   async getReview(applicationId: number) {
//     if (
//       !Number.isInteger(applicationId) ||
//       applicationId <= 0
//     ) {
//       throw new BadRequestException(
//         "A valid application ID is required.",
//       );
//     }

//     const applications =
//       await this.dataSource.query(
//         `
//           SELECT
//             la.id,
//             la.application_number,
//             la.customer_name,
//             la.requested_amount,
//             la.monthly_income,
//             la.foir,
//             la.indicative_ltv,
//             la.distance_km,
//             la.current_stage,

//             (
//               SELECT COUNT(*)
//               FROM loan_documents ld
//               WHERE ld.application_id = la.id
//                 AND ld.status IN (
//                   'UPLOADED',
//                   'VERIFIED'
//                 )
//             ) AS documents_uploaded,

//             COALESCE(
//               la.documents_required,
//               16
//             ) AS documents_required

//           FROM loan_applications la
//           WHERE la.id = ?
//           LIMIT 1
//         `,
//         [applicationId],
//       );

//     const application = applications[0];

//     if (!application) {
//       throw new NotFoundException(
//         `Application ${applicationId} was not found.`,
//       );
//     }

//     await this.ensureChecklistExists(
//       applicationId,
//     );

//     const checklist =
//       await this.dataSource.query(
//         `
//           SELECT
//             id,
//             item_code,
//             title,
//             checked,
//             sort_order
//           FROM bm_review_checklist
//           WHERE application_id = ?
//           ORDER BY sort_order ASC, id ASC
//         `,
//         [applicationId],
//       );

//     const reviews =
//       await this.dataSource.query(
//         `
//           SELECT
//             id,
//             sourcing_quality,
//             geo_decision,
//             preliminary_eligibility,
//             remarks,
//             status
//           FROM bm_reviews
//           WHERE application_id = ?
//           LIMIT 1
//         `,
//         [applicationId],
//       );

//     const review = reviews[0] ?? null;

//     return {
//       application: {
//         id: Number(application.id),

//         applicationNumber:
//           application.application_number,

//         customerName:
//           application.customer_name,

//         requestedAmount: Number(
//           application.requested_amount ?? 0,
//         ),

//         monthlyIncome: Number(
//           application.monthly_income ?? 0,
//         ),

//         foir: Number(application.foir ?? 0),

//         indicativeLtv: Number(
//           application.indicative_ltv ?? 0,
//         ),

//         distanceKm: Number(
//           application.distance_km ?? 0,
//         ),

//         documentsUploaded: Number(
//           application.documents_uploaded ?? 0,
//         ),

//         documentsRequired: Number(
//           application.documents_required ?? 0,
//         ),

//         currentStage:
//           application.current_stage ??
//           "BM_REVIEW",
//       },

//       stages: this.buildStages(
//         application.current_stage,
//       ),

//       checklist: checklist.map(
//         (item: Record<string, unknown>) => ({
//           id: Number(item.id),
//           code: String(item.item_code),
//           title: String(item.title),
//           checked: Boolean(item.checked),
//         }),
//       ),

//       review: {
//         sourcingQuality:
//           review?.sourcing_quality ?? "Good",

//         geoDecision:
//           review?.geo_decision ??
//           "Within Policy",

//         preliminaryEligibility:
//           review?.preliminary_eligibility ??
//           "Eligible",

//         remarks: review?.remarks ?? "",

//         status: review?.status ?? "DRAFT",
//       },
//     };
//   }

//   private async ensureChecklistExists(
//     applicationId: number,
//   ) {
//     const countResult =
//       await this.dataSource.query(
//         `
//           SELECT COUNT(*) AS total
//           FROM bm_review_checklist
//           WHERE application_id = ?
//         `,
//         [applicationId],
//       );

//     const total = Number(
//       countResult[0]?.total ?? 0,
//     );

//     if (total > 0) {
//       return;
//     }

//     await this.dataSource.transaction(
//       async (manager) => {
//         for (const item of DEFAULT_CHECKLIST) {
//           await manager.query(
//             `
//               INSERT INTO bm_review_checklist
//               (
//                 application_id,
//                 item_code,
//                 title,
//                 checked,
//                 sort_order
//               )
//               VALUES (?, ?, ?, 0, ?)
//             `,
//             [
//               applicationId,
//               item.code,
//               item.title,
//               item.sortOrder,
//             ],
//           );
//         }
//       },
//     );
//   }

//   private buildStages(
//     currentStage?: string,
//   ) {
//     const stages = [
//       {
//         key: "LEAD",
//         label: "Lead",
//       },
//       {
//         key: "FIELD_VERIFICATION",
//         label: "Field Verification",
//       },
//       {
//         key: "BM_REVIEW",
//         label: "BM Review",
//       },
//       {
//         key: "CM_SCREENING",
//         label: "CM Screening",
//       },
//       {
//         key: "CREDIT",
//         label: "Credit",
//       },
//       {
//         key: "LEGAL_VALUATION",
//         label: "Legal & Valuation",
//       },
//       {
//         key: "SANCTION",
//         label: "Sanction",
//       },
//     ];

//     const normalizedCurrentStage =
//       currentStage || "BM_REVIEW";

//     const currentIndex = stages.findIndex(
//       (stage) =>
//         stage.key === normalizedCurrentStage,
//     );

//     const effectiveIndex =
//       currentIndex >= 0 ? currentIndex : 2;

//     return stages.map((stage, index) => ({
//       ...stage,

//       status:
//         index < effectiveIndex
//           ? "completed"
//           : index === effectiveIndex
//             ? "current"
//             : "pending",
//     }));
//   }
// }



import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class BmReviewsService {
  private readonly logger = new Logger(
    BmReviewsService.name,
  );

  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get every case currently pending for BM review.
   *
   * stage  = BM
   * status = BM_PENDING
   */
  async getSubmittedToBmCases() {
    try {
      const rows =
        await this.dataSource.query(`
          SELECT
            a.id,
            a.application_number AS applicationNumber,
            a.customer_name AS customerName,
            a.mobile AS mobileNumber,
            a.pan AS panNumber,
            a.requested_amount AS requestedAmount,
            a.stage,
            a.status,
            a.version,
            a.assigned_to AS assignedTo,
            a.created_at AS createdAt,
            a.updated_at AS updatedAt
          FROM applications a
          WHERE
            a.stage = 'BM'
            AND a.status = 'BM_PENDING'
          ORDER BY a.updated_at DESC
        `);

      return rows.map(
        (row: Record<string, any>) => ({
          id: Number(row.id),

          applicationNumber:
            row.applicationNumber,

          customerName:
            row.customerName,

          mobileNumber:
            row.mobileNumber,

          panNumber:
            row.panNumber,

          requestedAmount: Number(
            row.requestedAmount ?? 0,
          ),

          stage: row.stage,

          status: row.status,

          version: Number(
            row.version ?? 0,
          ),

          assignedTo:
            row.assignedTo !== null
              ? Number(row.assignedTo)
              : null,

          createdAt:
            row.createdAt,

          updatedAt:
            row.updatedAt,
        }),
      );
    } catch (error) {
      this.logger.error(
        "Unable to fetch BM review queue",
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw new InternalServerErrorException(
        "Unable to fetch BM review queue.",
      );
    }
  }

  /**
   * Get one application for detailed BM review.
   */
  async getReview(applicationId: number) {
    try {
      const rows =
        await this.dataSource.query(
          `
            SELECT
              a.id,
              a.application_number AS applicationNumber,
              a.customer_name AS customerName,
              a.mobile AS mobileNumber,
              a.pan AS panNumber,
              a.requested_amount AS requestedAmount,
              a.stage,
              a.status,
              a.version,
              a.assigned_to AS assignedTo,
              a.created_at AS createdAt,
              a.updated_at AS updatedAt
            FROM applications a
            WHERE a.id = ?
            LIMIT 1
          `,
          [applicationId],
        );

      if (!rows.length) {
        throw new NotFoundException(
          `Application ${applicationId} was not found.`,
        );
      }

      const row = rows[0];

      const application = {
        id: Number(row.id),

        applicationNumber:
          row.applicationNumber,

        customerName:
          row.customerName,

        mobileNumber:
          row.mobileNumber,

        panNumber:
          row.panNumber,

        requestedAmount: Number(
          row.requestedAmount ?? 0,
        ),

        stage: row.stage,

        status: row.status,

        version: Number(
          row.version ?? 0,
        ),

        assignedTo:
          row.assignedTo !== null
            ? Number(row.assignedTo)
            : null,

        createdAt:
          row.createdAt,

        updatedAt:
          row.updatedAt,

        // These values are unavailable in the applications table.
        monthlyIncome: 0,
        foir: 0,
        indicativeLtv: 0,
        distanceKm: 0,
        documentsUploaded: 0,
        documentsRequired: 0,
      };

      return {
        application,

        stages: [
          {
            key: "LEAD",
            label: "Lead",
            status: "completed",
          },
          {
            key: "FIELD_VERIFICATION",
            label: "Field Verification",
            status: "completed",
          },
          {
            key: "BM_REVIEW",
            label: "BM Review",
            status: "current",
          },
          {
            key: "CM_SCREENING",
            label: "CM Screening",
            status: "pending",
          },
          {
            key: "CREDIT",
            label: "Credit",
            status: "pending",
          },
          {
            key: "LEGAL_VALUATION",
            label: "Legal & Valuation",
            status: "pending",
          },
          {
            key: "SANCTION",
            label: "Sanction",
            status: "pending",
          },
        ],

        checklist: [],

        review: {
          sourcingQuality: "Good",
          geoDecision: "Within Policy",
          preliminaryEligibility:
            "Eligible",
          remarks: "",
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        `Unable to fetch BM review for application ${applicationId}`,
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw new InternalServerErrorException(
        "Unable to fetch BM review details.",
      );
    }
  }
}