

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
  // async getReview(applicationId: number) {
  //   try {
  //     const rows =
  //       await this.dataSource.query(
  //         `
  //           SELECT
  //             a.id,
  //             a.application_number AS applicationNumber,
  //             a.customer_name AS customerName,
  //             a.mobile AS mobileNumber,
  //             a.pan AS panNumber,
  //             a.requested_amount AS requestedAmount,
  //             a.stage,
  //             a.status,
  //             a.version,
  //             a.assigned_to AS assignedTo,
  //             a.created_at AS createdAt,
  //             a.updated_at AS updatedAt
  //           FROM applications a
  //           WHERE a.id = ?
  //           LIMIT 1
  //         `,
  //         [applicationId],
  //       );

  //     if (!rows.length) {
  //       throw new NotFoundException(
  //         `Application ${applicationId} was not found.`,
  //       );
  //     }

  //     const row = rows[0];

  //     const application = {
  //       id: Number(row.id),

  //       applicationNumber:
  //         row.applicationNumber,

  //       customerName:
  //         row.customerName,

  //       mobileNumber:
  //         row.mobileNumber,

  //       panNumber:
  //         row.panNumber,

  //       requestedAmount: Number(
  //         row.requestedAmount ?? 0,
  //       ),

  //       stage: row.stage,

  //       status: row.status,

  //       version: Number(
  //         row.version ?? 0,
  //       ),

  //       assignedTo:
  //         row.assignedTo !== null
  //           ? Number(row.assignedTo)
  //           : null,

  //       createdAt:
  //         row.createdAt,

  //       updatedAt:
  //         row.updatedAt,

  //       // These values are unavailable in the applications table.
  //       monthlyIncome: 0,
  //       foir: 0,
  //       indicativeLtv: 0,
  //       distanceKm: 0,
  //       documentsUploaded: 0,
  //       documentsRequired: 0,
  //     };

  //     return {
  //       application,

  //       stages: [
  //         {
  //           key: "LEAD",
  //           label: "Lead",
  //           status: "completed",
  //         },
  //         {
  //           key: "FIELD_VERIFICATION",
  //           label: "Field Verification",
  //           status: "completed",
  //         },
  //         {
  //           key: "BM_REVIEW",
  //           label: "BM Review",
  //           status: "current",
  //         },
  //         {
  //           key: "CM_SCREENING",
  //           label: "CM Screening",
  //           status: "pending",
  //         },
  //         {
  //           key: "CREDIT",
  //           label: "Credit",
  //           status: "pending",
  //         },
  //         {
  //           key: "LEGAL_VALUATION",
  //           label: "Legal & Valuation",
  //           status: "pending",
  //         },
  //         {
  //           key: "SANCTION",
  //           label: "Sanction",
  //           status: "pending",
  //         },
  //       ],

  //       checklist: [],

  //       review: {
  //         sourcingQuality: "Good",
  //         geoDecision: "Within Policy",
  //         preliminaryEligibility:
  //           "Eligible",
  //         remarks: "",
  //       },
  //     };
  //   } catch (error) {
  //     if (
  //       error instanceof NotFoundException
  //     ) {
  //       throw error;
  //     }

  //     this.logger.error(
  //       `Unable to fetch BM review for application ${applicationId}`,
  //       error instanceof Error
  //         ? error.stack
  //         : String(error),
  //     );

  //     throw new InternalServerErrorException(
  //       "Unable to fetch BM review details.",
  //     );
  //   }
  // }



  async getReview(applicationId: number) {
  try {
    const rows = await this.dataSource.query(
      `
        SELECT
          /* Application */
          a.id,
          a.application_number AS applicationNumber,
          a.customer_name AS applicationCustomerName,
          a.mobile AS applicationMobile,
          a.pan AS applicationPan,
          a.requested_amount AS requestedAmount,
          a.stage,
          a.status,
          a.version,
          a.assigned_to AS assignedTo,
          a.created_at AS applicationCreatedAt,
          a.updated_at AS applicationUpdatedAt,

          /* Customer profile */
          cp.customer_type AS customerType,
          cp.first_name AS firstName,
          cp.middle_name AS middleName,
          cp.last_name AS lastName,
          cp.mobile AS customerMobile,
          cp.email,
          cp.dob,
          cp.gender,
          cp.marital_status AS maritalStatus,
          cp.education,
          cp.occupation_type AS occupationType,
          cp.business_name AS businessName,
          cp.designation,

          /* Income */
          cp.monthly_income AS monthlyIncome,
          cp.annual_income AS annualIncome,

          /* KYC */
          cp.pan_number AS customerPan,
          cp.pan_verified AS panVerified,
          cp.aadhaar_number AS aadhaarNumber,
          cp.aadhaar_verified AS aadhaarVerified,
          cp.ckyc_number AS ckycNumber,
          cp.ckyc_verified AS ckycVerified,

          /* Bureau */
          cp.bureau_score AS bureauScore,
          cp.bureau_status AS bureauStatus,

          /* Current address */
          cp.current_address AS currentAddress,
          cp.current_city AS currentCity,
          cp.current_state AS currentState,
          cp.current_pincode AS currentPincode,

          /* Permanent address */
          cp.permanent_address AS permanentAddress,
          cp.permanent_city AS permanentCity,
          cp.permanent_state AS permanentState,
          cp.permanent_pincode AS permanentPincode,

          /* Property */
          cp.property_type AS propertyType,
          cp.property_address AS propertyAddress,
          cp.property_city AS propertyCity,
          cp.property_state AS propertyState,
          cp.property_pincode AS propertyPincode,
          cp.ownership_type AS ownershipType,
          cp.market_value AS marketValue,
          cp.distress_value AS distressValue,

          /* Banking */
          cp.bank_name AS bankName,
          cp.account_number AS accountNumber,
          cp.ifsc,
          cp.branch_name AS branchName,
          cp.average_balance AS averageBalance,

          /* Eligibility */
          cp.foir,
          cp.eligible_amount AS eligibleAmount,
          cp.roi,
          cp.tenure,
          cp.emi,

          /* RM recommendation */
          cp.recommended_amount AS recommendedAmount,
          cp.recommended_roi AS recommendedRoi,
          cp.recommended_tenure AS recommendedTenure,
          cp.rm_recommendation AS rmRecommendation,
          cp.remarks AS rmRemarks

        FROM applications a

        LEFT JOIN customer_profiles cp
          ON cp.application_id = a.id

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

    const toNumberOrNull = (
      value: unknown,
    ): number | null => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const numberValue = Number(value);

      return Number.isFinite(numberValue)
        ? numberValue
        : null;
    };

    const requestedAmount =
      toNumberOrNull(row.requestedAmount);

    const marketValue =
      toNumberOrNull(row.marketValue);

    const distressValue =
      toNumberOrNull(row.distressValue);

    const indicativeLtv =
      requestedAmount !== null &&
      marketValue !== null &&
      marketValue > 0
        ? Number(
            (
              (requestedAmount / marketValue) *
              100
            ).toFixed(2),
          )
        : null;

    const distressLtv =
      requestedAmount !== null &&
      distressValue !== null &&
      distressValue > 0
        ? Number(
            (
              (requestedAmount / distressValue) *
              100
            ).toFixed(2),
          )
        : null;

    const fullName = [
      row.firstName,
      row.middleName,
      row.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return {
      application: {
        id: Number(row.id),

        applicationNumber:
          row.applicationNumber,

        customerName:
          fullName ||
          row.applicationCustomerName,

        mobileNumber:
          row.customerMobile ||
          row.applicationMobile,

        panNumber:
          row.customerPan ||
          row.applicationPan,

        requestedAmount,

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
          row.applicationCreatedAt,

        updatedAt:
          row.applicationUpdatedAt,
      },

      applicant: {
        fullName,

        customerType:
          row.customerType,

        firstName:
          row.firstName,

        middleName:
          row.middleName,

        lastName:
          row.lastName,

        mobile:
          row.customerMobile ||
          row.applicationMobile,

        email:
          row.email,

        dob:
          row.dob,

        gender:
          row.gender,

        maritalStatus:
          row.maritalStatus,

        education:
          row.education,

        occupationType:
          row.occupationType,

        businessName:
          row.businessName,

        designation:
          row.designation,
      },

      kycSummary: {
        panNumber:
          row.customerPan ||
          row.applicationPan,

        panVerified:
          Boolean(
            Number(row.panVerified ?? 0),
          ),

        aadhaarNumber:
          row.aadhaarNumber,

        aadhaarVerified:
          Boolean(
            Number(
              row.aadhaarVerified ?? 0,
            ),
          ),

        ckycNumber:
          row.ckycNumber,

        ckycVerified:
          Boolean(
            Number(row.ckycVerified ?? 0),
          ),
      },

      bureauSummary: {
        score:
          toNumberOrNull(row.bureauScore),

        status:
          row.bureauStatus ??
          "NOT_PULLED",
      },

      addressSummary: {
        current: {
          address:
            row.currentAddress,

          city:
            row.currentCity,

          state:
            row.currentState,

          pincode:
            row.currentPincode,
        },

        permanent: {
          address:
            row.permanentAddress,

          city:
            row.permanentCity,

          state:
            row.permanentState,

          pincode:
            row.permanentPincode,
        },
      },

      propertySummary: {
        type:
          row.propertyType,

        address:
          row.propertyAddress,

        city:
          row.propertyCity,

        state:
          row.propertyState,

        pincode:
          row.propertyPincode,

        ownershipType:
          row.ownershipType,

        marketValue,
        distressValue,
        indicativeLtv,
        distressLtv,
      },

      financialSummary: {
        monthlyIncome:
          toNumberOrNull(
            row.monthlyIncome,
          ),

        annualIncome:
          toNumberOrNull(
            row.annualIncome,
          ),

        averageBalance:
          toNumberOrNull(
            row.averageBalance,
          ),

        foir:
          toNumberOrNull(row.foir),

        eligibleAmount:
          toNumberOrNull(
            row.eligibleAmount,
          ),

        roi:
          toNumberOrNull(row.roi),

        tenure:
          toNumberOrNull(row.tenure),

        emi:
          toNumberOrNull(row.emi),
      },

      bankSummary: {
        bankName:
          row.bankName,

        accountNumber:
          row.accountNumber,

        ifsc:
          row.ifsc,

        branchName:
          row.branchName,

        averageBalance:
          toNumberOrNull(
            row.averageBalance,
          ),
      },

      rmRecommendation: {
        recommendedAmount:
          toNumberOrNull(
            row.recommendedAmount,
          ),

        recommendedRoi:
          toNumberOrNull(
            row.recommendedRoi,
          ),

        recommendedTenure:
          toNumberOrNull(
            row.recommendedTenure,
          ),

        recommendation:
          row.rmRecommendation,

        remarks:
          row.rmRemarks,
      },

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

      checklist: [
        {
          id: 1,
          code: "APPLICANT_REVIEWED",
          title:
            "Applicant details reviewed",
          checked: false,
        },
        {
          id: 2,
          code: "KYC_REVIEWED",
          title:
            "KYC verification reviewed",
          checked: false,
        },
        {
          id: 3,
          code: "BUREAU_REVIEWED",
          title:
            "Bureau score and status reviewed",
          checked: false,
        },
        {
          id: 4,
          code: "PROPERTY_REVIEWED",
          title:
            "Property and ownership details reviewed",
          checked: false,
        },
        {
          id: 5,
          code: "FINANCIAL_REVIEWED",
          title:
            "Income, FOIR and eligibility reviewed",
          checked: false,
        },
        {
          id: 6,
          code: "BANKING_REVIEWED",
          title:
            "Banking information reviewed",
          checked: false,
        },
        {
          id: 7,
          code:
            "RM_RECOMMENDATION_REVIEWED",
          title:
            "RM recommendation reviewed",
          checked: false,
        },
        {
          id: 8,
          code: "NO_MAJOR_NEGATIVE",
          title:
            "No unresolved major negative finding",
          checked: false,
        },
      ],

      review: {
        sourcingQuality:
          "Good",

        geoDecision:
          "Within Policy",

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