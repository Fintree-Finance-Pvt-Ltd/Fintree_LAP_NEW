import React, { useEffect, useState } from "react";
import axios from "axios";


/* =========================================================
   JOURNEY STEPS
   Field Verification removed.
   Remaining stages renumbered from 1 to 10.
========================================================= */

const journeySteps = [
  {
    number: 1,
    name: "Lead",
    status: "Current",
  },
  {
    number: 2,
    name: "BM Review",
    status: "Pending",
  },
  {
    number: 3,
    name: "CM Screening",
    status: "Pending",
  },
  {
    number: 4,
    name: "Credit",
    status: "Pending",
  },
  {
    number: 5,
    name: "Legal & Valuation",
    status: "Pending",
  },
  {
    number: 6,
    name: "Sanction",
    status: "Pending",
  },
  {
    number: 7,
    name: "Documentation",
    status: "Pending",
  },
  {
    number: 8,
    name: "Disbursement",
    status: "Pending",
  },
  {
    number: 9,
    name: "Active Loan",
    status: "Pending",
  },
  {
    number: 10,
    name: "Collections",
    status: "Pending",
  },
];



/* =========================================================
   RESPONSIVE VIEWPORT HOOK
========================================================= */

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return width;
}

/* =========================================================
   COMMON ACTION BUTTON
========================================================= */

function ActionButton({
  children,
  onClick,
  transparent = false,
  compact = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        height: compact ? "38px" : "44px",
        padding: compact ? "0 15px" : "0 20px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        color: transparent ? "#ffffff" : "#1b3359",
        fontFamily: "inherit",
        fontSize: compact ? "12px" : "13px",
        fontWeight: 800,
        whiteSpace: "nowrap",
        cursor: "pointer",
        outline: "none",
        border: transparent
          ? "1px solid rgba(255,255,255,0.32)"
          : "1px solid #d7e0ef",
        borderRadius: "12px",
        background: transparent
          ? "rgba(255,255,255,0.14)"
          : "rgba(255,255,255,0.97)",
        boxShadow: transparent
          ? "inset 0 1px 0 rgba(255,255,255,0.13)"
          : "0 4px 12px rgba(30,55,95,0.05)",
        backdropFilter: transparent ? "blur(8px)" : "none",
        WebkitBackdropFilter: transparent ? "blur(8px)" : "none",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";

        if (!transparent) {
          event.currentTarget.style.borderColor = "#bdcce3";
          event.currentTarget.style.boxShadow =
            "0 7px 17px rgba(30,55,95,0.09)";
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";

        if (!transparent) {
          event.currentTarget.style.borderColor = "#d7e0ef";
          event.currentTarget.style.boxShadow =
            "0 4px 12px rgba(30,55,95,0.05)";
        }
      }}
    >
      {children}
    </button>
  );
}


/* =========================================================
   EXISTING BANNER
========================================================= */

function HeroBanner({ compact, mobile }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: mobile ? "190px" : compact ? "130px" : "150px",
        padding: mobile
          ? "24px 20px"
          : compact
            ? "25px 26px"
            : "31px 32px",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        alignItems: mobile ? "flex-start" : "center",
        justifyContent: "space-between",
        flexDirection: mobile ? "column" : "row",
        gap: mobile ? "22px" : "24px",
        color: "#ffffff",
        borderRadius: mobile ? "19px" : "24px",
        background:
          "linear-gradient(105deg, #4e50da 0%, #4360d3 42%, #3378cc 69%, #35aed1 100%)",
        boxShadow: "0 17px 34px rgba(48,88,190,0.17)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-85px",
          left: "-13px",
          width: "280px",
          height: "280px",
          borderRadius: "50%",
          background: "rgba(31,221,203,0.58)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "-50px",
          left: "34px",
          width: "270px",
          height: "270px",
          borderRadius: "50%",
          background: "rgba(55,67,221,0.42)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-52px",
          bottom: "-113px",
          width: "235px",
          height: "235px",
          borderRadius: "50%",
          background: "rgba(124,218,225,0.17)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: mobile ? "13px" : "17px",
        }}
      >
        <div
          style={{
            width: mobile ? "46px" : "52px",
            height: mobile ? "46px" : "52px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: mobile ? "21px" : "25px",
            border: "1px solid rgba(255,255,255,0.36)",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.13)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          ✦
        </div>

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: mobile ? "24px" : compact ? "28px" : "34px",
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: mobile ? "-0.7px" : "-1.2px",
            }}
          >
            Legal Officer Dashboard
          </h1>

          <p
            style={{
              margin: "12px 0 0",
              color: "rgba(255,255,255,0.93)",
              fontSize: compact ? "12px" : "14px",
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            Welcome Leena Gupta. Operational view for Delhi Hub.
          </p>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: mobile ? "100%" : "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: mobile ? "flex-start" : "flex-end",
          flexWrap: "wrap",
          gap: "9px",
        }}
      >
        <ActionButton transparent onClick={() => window.print()}>
          Print
        </ActionButton>

        <ActionButton transparent>View Journey</ActionButton>
      </div>
    </section>
  );
}

/* =========================================================
   SECTION TITLE
========================================================= */

function SectionTitle({ children }) {
  return (
    <div>
      <h2
        style={{
          margin: 0,
          color: "#142e59",
          fontSize: "18px",
          lineHeight: 1.3,
          fontWeight: 800,
          letterSpacing: "-0.3px",
        }}
      >
        {children}
      </h2>

      <div
        style={{
          width: "38px",
          height: "3px",
          marginTop: "9px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, #4166e6 0%, #12a6d4 100%)",
        }}
      />
    </div>
  );
}

/* =========================================================
   STATUS PILL
========================================================= */

function StatusPill({ type, children }) {
  const palettes = {
    blue: {
      color: "#3558ca",
      background: "#edf3ff",
      border: "#d2dfff",
    },
    orange: {
      color: "#995d00",
      background: "#fff0d2",
      border: "#f0dab1",
    },
    green: {
      color: "#087653",
      background: "#ddf5e9",
      border: "#bee7d6",
    },
  };

  const palette = palettes[type] || palettes.blue;

  return (
    <span
      style={{
        maxWidth: "100%",
        padding: "6px 11px",
        boxSizing: "border-box",
        display: "inline-flex",
        alignItems: "center",
        color: palette.color,
        fontSize: "10px",
        lineHeight: 1.2,
        fontWeight: 900,
        whiteSpace: "nowrap",
        border: `1px solid ${palette.border}`,
        borderRadius: "20px",
        background: palette.background,
        boxShadow: "0 2px 5px rgba(33,54,88,0.04)",
      }}
    >
      {children}
    </span>
  );
}

function formatAmount(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatText(value) {
  if (!value) {
    return "—";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getStatusType(status) {
  const normalized = String(
    status || "",
  ).toUpperCase();

  if (
    normalized.includes("APPROVED") ||
    normalized.includes("POSITIVE") ||
    normalized.includes("COMPLETED")
  ) {
    return "green";
  }

  if (
    normalized.includes("PENDING") ||
    normalized.includes("QUERY") ||
    normalized.includes("LEGAL") ||
    normalized.includes("VALUATION")
  ) {
    return "orange";
  }

  return "blue";
}

function extractLegalCases(responseData) {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (Array.isArray(responseData?.data)) {
    return responseData.data;
  }

  if (
    Array.isArray(
      responseData?.data?.data,
    )
  ) {
    return responseData.data.data;
  }

  return [];
}

function mapLegalCase(application) {
  const status = application.status || "";

  return {
    id:
      application.id ??
      application.application_id,

    caseId:
      application.application_number ??
      application.applicationNumber ??
      "—",

    applicant:
      application.customer_name ??
      application.customerName ??
      "—",

    amount: formatAmount(
      application.requested_amount ??
      application.requestedAmount,
    ),

    stage: formatText(application.stage),

    status: formatText(status),

    owner:
      application.owner ??
      application.assigned_to ??
      application.assignedTo ??
      "—",

    statusType: getStatusType(status),
  };
}

/* =========================================================
   MOBILE CASE CARD
========================================================= */

function MobileCaseCard({ row }) {
  const detailRows = [
    {
      label: "Applicant",
      value: row.applicant,
    },
    {
      label: "Amount",
      value: row.amount,
    },
    {
      label: "Stage",
      value: row.stage,
    },
    {
      label: "Owner",
      value: row.owner,
    },
  ];

  return (
    <article
      style={{
        padding: "17px",
        border: "1px solid #dbe4f0",
        borderRadius: "15px",
        background: "#ffffff",
        boxShadow: "0 6px 16px rgba(34,55,87,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div
          style={{
            minWidth: 0,
            color: "#253a5d",
            fontSize: "12px",
            lineHeight: 1.45,
            fontWeight: 900,
            overflowWrap: "anywhere",
          }}
        >
          {row.caseId}
        </div>

        <StatusPill type={row.statusType}>{row.status}</StatusPill>
      </div>

      <div
        style={{
          marginTop: "15px",
          display: "grid",
          gap: "10px",
        }}
      >
        {detailRows.map((detail) => (
          <div
            key={detail.label}
            style={{
              display: "grid",
              gridTemplateColumns: "88px minmax(0, 1fr)",
              alignItems: "start",
              gap: "10px",
            }}
          >
            <span
              style={{
                color: "#7b899f",
                fontSize: "11px",
                lineHeight: 1.45,
                fontWeight: 600,
              }}
            >
              {detail.label}
            </span>

            <strong
              style={{
                minWidth: 0,
                color: "#405575",
                fontSize: "11px",
                lineHeight: 1.45,
                fontWeight: 800,
                textAlign: "right",
                overflowWrap: "anywhere",
              }}
            >
              {detail.value}
            </strong>
          </div>
        ))}
      </div>
    </article>
  );
}

/* =========================================================
   FULL-WIDTH CASES TABLE
========================================================= */

function CasesTable({
  compact,
  mobile,
  cases,
  loading,
  error,
}) {
  const columns = [
    "CASE",
    "APPLICANT",
    "AMOUNT",
    "STAGE",
    "STATUS",
    "OWNER",
  ];
  const renderMessage = (message) => (
    <div
      style={{
        minHeight: "90px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        color: error
          ? "#b42318"
          : "#66758d",
        fontSize: "12px",
        fontWeight: 700,
        textAlign: "center",
        border: "1px solid #d4dfee",
        borderRadius: "14px",
        background: "#ffffff",
      }}
    >
      {message}
    </div>
  );

  return (
    <section
      style={{
        width: "100%",
        minWidth: 0,
        padding: mobile
          ? "20px 15px"
          : compact
            ? "24px 18px"
            : "28px 22px 30px",
        boxSizing: "border-box",
        border: "1px solid #bdd0f5",
        borderRadius: mobile ? "17px" : "21px",
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 14px 31px rgba(35,56,88,0.05)",
      }}
    >
      <div
        style={{
          marginBottom: mobile ? "19px" : "25px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "15px",
        }}
      >
        <SectionTitle>Cases requiring attention</SectionTitle>

        <ActionButton compact>View all</ActionButton>
      </div>

      {mobile ? (
        <div
          style={{
            width: "100%",
            display: "grid",
            gap: "12px",
          }}
        >
          {loading
            ? renderMessage("Loading legal cases...")
            : error
              ? renderMessage(error)
              : cases.length === 0
                ? renderMessage(
                  "No Legal cases requiring attention found.",
                )
                : cases.map((row) => (
                  <MobileCaseCard
                    key={row.id ?? row.caseId}
                    row={row}
                  />
                ))}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            minWidth: 0,
            overflow: "hidden",
            border: "1px solid #d4dfee",
            borderRadius: "16px",
            background: "#ffffff",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              tableLayout: "fixed",
              color: "#304566",
              fontSize: compact ? "11px" : "12px",
            }}
          >
            <colgroup>
              <col style={{ width: compact ? "18%" : "17%" }} />
              <col style={{ width: compact ? "17%" : "18%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "13%" }} />
            </colgroup>

            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    style={{
                      height: compact ? "39px" : "41px",
                      padding: compact ? "0 9px" : "0 14px",
                      color: "#3c56ad",
                      fontSize: compact ? "9px" : "10px",
                      lineHeight: 1.25,
                      fontWeight: 900,
                      letterSpacing: "0.65px",
                      textAlign: "left",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      borderBottom: "2px solid #bacaf5",
                      background: "#eef3ff",
                    }}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      height: "90px",
                      textAlign: "center",
                      color: "#66758d",
                      fontWeight: 700,
                    }}
                  >
                    Loading legal cases...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      height: "90px",
                      textAlign: "center",
                      color: "#b42318",
                      fontWeight: 700,
                    }}
                  >
                    {error}
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      height: "90px",
                      textAlign: "center",
                      color: "#66758d",
                      fontWeight: 700,
                    }}
                  >
                    No Legal cases requiring attention found.
                  </td>
                </tr>
              ) : (
                cases.map((row, rowIndex) => {
                  const borderBottom =
                    rowIndex === cases.length - 1
                      ? "none"
                      : "1px solid #dce4ee";

                  const background =
                    rowIndex % 2 === 0
                      ? "#ffffff"
                      : "#f9fbfd";

                  const baseCellStyle = {
                    height: compact ? "57px" : "54px",
                    padding: compact
                      ? "7px 9px"
                      : "0 14px",
                    boxSizing: "border-box",
                    overflow: "hidden",
                    lineHeight: 1.4,
                    borderBottom,
                    background,
                  };

                  return (
                    <tr key={row.id ?? row.caseId}>
                      <td
                        title={row.caseId}
                        style={{
                          ...baseCellStyle,
                          color: "#253a5d",
                          fontWeight: 900,
                          whiteSpace: compact
                            ? "normal"
                            : "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.caseId}
                      </td>

                      <td
                        title={row.applicant}
                        style={{
                          ...baseCellStyle,
                          color: "#455978",
                          fontWeight: 500,
                          whiteSpace: compact
                            ? "normal"
                            : "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.applicant}
                      </td>

                      <td
                        title={row.amount}
                        style={{
                          ...baseCellStyle,
                          color: "#455978",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.amount}
                      </td>

                      <td
                        title={row.stage}
                        style={{
                          ...baseCellStyle,
                          color: "#455978",
                          fontWeight: 500,
                          whiteSpace: compact
                            ? "normal"
                            : "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.stage}
                      </td>

                      <td
                        style={{
                          ...baseCellStyle,
                          whiteSpace: "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <StatusPill
                          type={row.statusType}
                        >
                          {row.status}
                        </StatusPill>
                      </td>

                      <td
                        title={row.owner}
                        style={{
                          ...baseCellStyle,
                          color: "#455978",
                          fontWeight: 500,
                          whiteSpace: compact
                            ? "normal"
                            : "nowrap",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.owner}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   LEGAL DASHBOARD
========================================================= */

export default function LegalDashboard() {
  const viewportWidth = useViewportWidth();

  const [legalCases, setLegalCases] = useState([]);
  const [legalCasesLoading, setLegalCasesLoading] =
    useState(true);
  const [legalCasesError, setLegalCasesError] =
    useState("");

  useEffect(() => {
    const controller = new AbortController();

    const loadLegalCases = async () => {
      try {
        setLegalCasesLoading(true);
        setLegalCasesError("");

        const response = await axios.get(
          "/api/legal/cases-requiring-attention",
          {
            signal: controller.signal,
          },
        );

        const applications = extractLegalCases(
          response.data,
        );

        const mappedCases = applications
          .filter((application) => {
            const stage = String(
              application?.stage || "",
            ).toUpperCase();

            return (
              stage === "LEGAL" ||
              stage === "LEGAL_VALUATION"
            );
          })
          .map(mapLegalCase);

        setLegalCases(mappedCases);
      } catch (error) {
        if (
          error?.code === "ERR_CANCELED" ||
          axios.isCancel(error)
        ) {
          return;
        }

        console.error(
          "Unable to load Legal cases:",
          error?.response?.data ||
            error?.message ||
            error,
        );

        const apiMessage =
          error?.response?.data?.message ||
          error?.message ||
          "Unable to load Legal cases.";

        setLegalCasesError(
          Array.isArray(apiMessage)
            ? apiMessage.join(", ")
            : String(apiMessage),
        );
      } finally {
        if (!controller.signal.aborted) {
          setLegalCasesLoading(false);
        }
      }
    };

    loadLegalCases();

    return () => {
      controller.abort();
    };
  }, []);

  const mobileHeader = viewportWidth < 700;
  const compactHero = viewportWidth < 1050;
  const mobileLayout = viewportWidth < 700;
  const compactTable = viewportWidth < 1100;
  const mobileTable = viewportWidth < 760;

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        minHeight: "100%",
        boxSizing: "border-box",
        overflowX: "hidden",
        color: "#23395e",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background:
          "radial-gradient(circle at 42% 4%, rgba(90,113,227,0.08), transparent 27%), linear-gradient(180deg, #f3f7fc 0%, #f7f9fc 100%)",
      }}
    >


      <main
        style={{
          width: "100%",
          minWidth: 0,
          padding: mobileLayout
            ? "17px 13px 34px"
            : viewportWidth < 1200
              ? "22px 20px 44px"
              : "26px 28px 48px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            minWidth: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: mobileLayout ? "16px" : "20px",
          }}
        >
          <HeroBanner
            compact={compactHero}
            mobile={mobileLayout}
          />
          
          <CasesTable
            compact={compactTable}
            mobile={mobileTable}
            cases={legalCases}
            loading={legalCasesLoading}
            error={legalCasesError}
          />
        </div>
      </main>
    </div>
  );
}