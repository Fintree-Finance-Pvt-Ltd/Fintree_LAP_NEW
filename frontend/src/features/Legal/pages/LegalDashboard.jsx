import React, { useEffect, useState } from "react";

/* =========================================================
   STATIC DATA
   Replace these arrays with API responses later.
========================================================= */

const statistics = [
  {
    title: "LEGAL QUEUE",
    value: "8",
    accent: "#4f67e8",
    border: "#b9c8ff",
    background: "#f7f8ff",
    circle: "rgba(93, 112, 235, 0.09)",
  },
  {
    title: "POSITIVE",
    value: "4",
    accent: "#109f8e",
    border: "#a8ded6",
    background: "#f5fcfb",
    circle: "rgba(16, 159, 142, 0.09)",
  },
  {
    title: "QUERIES",
    value: "3",
    accent: "#d24978",
    border: "#e9bfd0",
    background: "#fff8fb",
    circle: "rgba(210, 73, 120, 0.09)",
  },
  {
    title: "AVG TAT",
    value: "2.1 days",
    accent: "#df7d0a",
    border: "#f1cfaa",
    background: "#fffaf4",
    circle: "rgba(223, 125, 10, 0.08)",
  },
];

const journeySteps = [
  { number: 1, name: "Lead", status: "Current" },
  { number: 2, name: "Field Verification", status: "Pending" },
  { number: 3, name: "BM Review", status: "Pending" },
  { number: 4, name: "CM Screening", status: "Pending" },
  { number: 5, name: "Credit", status: "Pending" },
  { number: 6, name: "Legal & Valuation", status: "Pending" },
  { number: 7, name: "Sanction", status: "Pending" },
  { number: 8, name: "Documentation", status: "Pending" },
  { number: 9, name: "Disbursement", status: "Pending" },
  { number: 10, name: "Active Loan", status: "Pending" },
];

const caseRows = [
  {
    caseId: "FTLIP-2026-0001",
    applicant: "Aarav Sharma",
    amount: "₹65,00,000",
    stage: "Lead",
    status: "New",
    owner: "Rohit Mehta",
    statusType: "blue",
  },
  {
    caseId: "FTLIP-2026-0002",
    applicant: "Meera Iyer",
    amount: "₹80,00,000",
    stage: "BM Review",
    status: "Submitted to BM",
    owner: "Rohit Mehta",
    statusType: "blue",
  },
  {
    caseId: "FTLIP-2026-0003",
    applicant: "Rajesh Traders",
    amount: "₹1,20,00,000",
    stage: "Credit",
    status: "Credit Underwriting",
    owner: "Chirag Mishra",
    statusType: "orange",
  },
  {
    caseId: "FTLIP-2026-0004",
    applicant: "Neha Kapoor",
    amount: "₹90,00,000",
    stage: "Legal & Valuation",
    status: "Legal & Valuation",
    owner: "Kavita Rao",
    statusType: "orange",
  },
  {
    caseId: "FTLIP-2026-0005",
    applicant: "Siddharth Jain",
    amount: "₹1,50,00,000",
    stage: "Documentation",
    status: "Documentation Pending",
    owner: "Sameer Khanna",
    statusType: "orange",
  },
  {
    caseId: "FTLIP-2026-0006",
    applicant: "Prakash Verma",
    amount: "₹72,00,000",
    stage: "Active Loan",
    status: "Active",
    owner: "Ojas Batra",
    statusType: "green",
  },
  {
    caseId: "FTLIP-2026-0007",
    applicant: "Sunita Enterprises",
    amount: "₹60,00,000",
    stage: "Collections",
    status: "37 DPD",
    owner: "Chetan Yadav",
    statusType: "green",
  },
];

const selectedCaseDetails = [
  { label: "Applicant", value: "Aarav Sharma" },
  { label: "Requested", value: "₹65,00,000" },
  { label: "FOIR", value: "22.70%" },
  { label: "Indicative LTV", value: "61.90%" },
  { label: "Bureau", value: "742" },
  { label: "Last Action", value: "Lead created" },
];

const alerts = [
  {
    type: "success",
    text: (
      <>
        Geo distance: <strong>18 KM.</strong> Within approved{" "}
        <strong>50 KM</strong> sourcing radius.
      </>
    ),
  },
  {
    type: "warning",
    text: (
      <>
        Documents: <strong>5/16</strong> verified.
      </>
    ),
  },
];

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

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
          background: "linear-gradient(90deg, #4166e6 0%, #12a6d4 100%)",
        }}
      />
    </div>
  );
}

function ActionButton({ children, onClick, transparent = false, compact = false }) {
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
        transition: "transform 180ms ease, box-shadow 180ms ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

function LegalToolbar({ compact }) {
  return (
    <section
      style={{
        width: "100%",
        minHeight: compact ? "68px" : "72px",
        padding: compact ? "10px 14px" : "11px 18px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
        border: "1px solid #dce4ef",
        borderRadius: "16px",
        background: "rgba(255,255,255,0.97)",
        boxShadow: "0 8px 20px rgba(24,46,79,0.05)",
      }}
    >
      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: "13px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "36px",
            flexShrink: 0,
            borderRadius: "999px",
            background: "linear-gradient(180deg, #4969ed 0%, #21a7d4 100%)",
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              color: "#17335d",
              fontSize: compact ? "13px" : "15px",
              fontWeight: 900,
              whiteSpace: "nowrap",
            }}
          >
            LAP Operations Workspace
          </div>

          {!compact && (
            <div
              style={{
                marginTop: "3px",
                color: "#7c8aa2",
                fontSize: "10px",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              Legal Officer · Delhi Hub · Dashboard
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "10px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: compact ? "290px" : "370px",
            minWidth: compact ? "250px" : "320px",
          }}
        >
          <select
            defaultValue="FTLIP-2026-0001"
            style={{
              width: "100%",
              height: "46px",
              padding: "0 42px 0 16px",
              color: "#17335d",
              fontFamily: "inherit",
              fontSize: "13px",
              fontWeight: 800,
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              outline: "none",
              border: "1px solid #d4deed",
              borderRadius: "12px",
              background: "#ffffff",
            }}
          >
            <option value="FTLIP-2026-0001">
              FTLIP-2026-0001 · Aarav Sharma
            </option>
            <option value="FTLIP-2026-0002">
              FTLIP-2026-0002 · Meera Iyer
            </option>
          </select>

          <span
            style={{
              position: "absolute",
              top: "50%",
              right: "16px",
              width: "8px",
              height: "8px",
              pointerEvents: "none",
              borderRight: "2px solid #17335d",
              borderBottom: "2px solid #17335d",
              transform: "translateY(-70%) rotate(45deg)",
            }}
          />
        </div>

        <div
          style={{
            height: "31px",
            padding: "0 13px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#385ad3",
            fontSize: "11px",
            fontWeight: 900,
            border: "1px solid #dce5ff",
            borderRadius: "20px",
            background: "#edf3ff",
          }}
        >
          New
        </div>

        {!compact && <ActionButton compact>Journey map</ActionButton>}
      </div>
    </section>
  );
}

function HeroBanner({ compact }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: compact ? "130px" : "150px",
        padding: compact ? "25px 26px" : "31px 32px",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "24px",
        color: "#ffffff",
        borderRadius: "24px",
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
          display: "flex",
          alignItems: "center",
          gap: "17px",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontSize: "25px",
            border: "1px solid rgba(255,255,255,0.36)",
            borderRadius: "14px",
            background: "rgba(255,255,255,0.13)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
          }}
        >
          ✦
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: compact ? "28px" : "34px",
              lineHeight: 1.12,
              fontWeight: 900,
              letterSpacing: "-1.2px",
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
          display: "flex",
          alignItems: "center",
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

function StatsCards({ columns }) {
  return (
    <section
      style={{
        width: "100%",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: "17px",
      }}
    >
      {statistics.map((stat) => (
        <article
          key={stat.title}
          style={{
            position: "relative",
            minHeight: "150px",
            padding: "27px 21px 20px",
            boxSizing: "border-box",
            overflow: "hidden",
            border: `1px solid ${stat.border}`,
            borderTop: `4px solid ${stat.accent}`,
            borderRadius: "19px",
            background: stat.background,
            boxShadow: "0 11px 23px rgba(37,58,92,0.045)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-50px",
              right: "-39px",
              width: "137px",
              height: "137px",
              borderRadius: "50%",
              background: stat.circle,
            }}
          />

          <div
            style={{
              position: "absolute",
              top: "-31px",
              right: "-19px",
              width: "93px",
              height: "93px",
              borderRadius: "50%",
              background: stat.circle,
            }}
          />

          <div style={{ position: "relative", zIndex: 2 }}>
            <div
              style={{
                color: "#74849e",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: "0.75px",
              }}
            >
              {stat.title}
            </div>

            <div
              style={{
                marginTop: "17px",
                color: stat.accent,
                fontSize: stat.value.includes("days") ? "29px" : "31px",
                lineHeight: 1,
                fontWeight: 900,
                letterSpacing: "-0.7px",
              }}
            >
              {stat.value}
            </div>

            <div
              style={{
                width: "fit-content",
                marginTop: "14px",
                padding: "5px 8px",
                color: "#118159",
                fontSize: "10px",
                fontWeight: 500,
                borderRadius: "20px",
                background: "#e5f7ee",
              }}
            >
              Live prototype indicator
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}

function JourneyProgress() {
  return (
    <section
      style={{
        width: "100%",
        padding: "30px 27px 24px",
        boxSizing: "border-box",
        overflow: "hidden",
        border: "1px solid #d6e0ee",
        borderRadius: "21px",
        background: "rgba(255,255,255,0.9)",
        boxShadow: "0 13px 27px rgba(34,55,87,0.045)",
      }}
    >
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "5px",
        }}
      >
        <div
          style={{
            position: "relative",
            minWidth: "1180px",
            padding: "0 4px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "42px",
              right: "42px",
              height: "2px",
              background:
                "linear-gradient(90deg, #9db6ff 0%, #cad6f7 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "grid",
              gridTemplateColumns: `repeat(${journeySteps.length}, minmax(105px, 1fr))`,
              columnGap: "10px",
            }}
          >
            {journeySteps.map((step, index) => {
              const active = index === 0;

              return (
                <div
                  key={step.number}
                  style={{
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: active ? "47px" : "42px",
                      height: active ? "47px" : "42px",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: active ? "#ffffff" : "#7c899f",
                      fontSize: active ? "14px" : "13px",
                      fontWeight: 900,
                      border: active
                        ? "7px solid #e7edff"
                        : "6px solid #f0f3f8",
                      borderRadius: "50%",
                      background: active
                        ? "linear-gradient(145deg, #4774eb, #1ea5d4)"
                        : "#e2e8f0",
                      boxShadow: active
                        ? "0 0 0 3px #cbd8ff, 0 10px 23px rgba(59,98,220,0.22)"
                        : "0 2px 7px rgba(38,58,89,0.05)",
                    }}
                  >
                    {step.number}
                  </div>

                  <div
                    style={{
                      marginTop: "12px",
                      color: active ? "#3f5fe0" : "#263b5e",
                      fontSize: "12px",
                      fontWeight: active ? 900 : 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.name}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      color: "#7e8ba2",
                      fontSize: "10px",
                      fontWeight: 500,
                    }}
                  >
                    {step.status}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "relative",
              height: "8px",
              margin: "24px 9px 0",
              borderRadius: "999px",
              background: "#eef2f7",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "5px",
                right: "245px",
                borderRadius: "999px",
                background: "#acbdd6",
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

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

function CasesTable() {
  return (
    <section
      style={{
        minWidth: 0,
        minHeight: "485px",
        padding: "28px 22px 30px",
        boxSizing: "border-box",
        border: "1px solid #bdd0f5",
        borderRadius: "21px",
        background: "rgba(255,255,255,0.94)",
        boxShadow: "0 14px 31px rgba(35,56,88,0.05)",
      }}
    >
      <div
        style={{
          marginBottom: "25px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "20px",
        }}
      >
        <SectionTitle>Cases requiring attention</SectionTitle>
        <ActionButton compact>View all</ActionButton>
      </div>

      <div
        style={{
          width: "100%",
          overflowX: "auto",
          border: "1px solid #d4dfee",
          borderRadius: "16px",
          background: "#ffffff",
        }}
      >
        <table
          style={{
            width: "100%",
            minWidth: "900px",
            borderCollapse: "separate",
            borderSpacing: 0,
            tableLayout: "fixed",
            color: "#304566",
            fontSize: "12px",
          }}
        >
          <colgroup>
            <col style={{ width: "17%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "13%" }} />
            <col style={{ width: "17%" }} />
            <col style={{ width: "24%" }} />
            <col style={{ width: "15%" }} />
          </colgroup>

          <thead>
            <tr>
              {["CASE", "APPLICANT", "AMOUNT", "STAGE", "STATUS", "OWNER"].map(
                (column) => (
                  <th
                    key={column}
                    style={{
                      height: "41px",
                      padding: "0 14px",
                      color: "#3c56ad",
                      fontSize: "10px",
                      fontWeight: 900,
                      letterSpacing: "0.65px",
                      textAlign: "left",
                      borderBottom: "2px solid #bacaf5",
                      background: "#eef3ff",
                    }}
                  >
                    {column}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {caseRows.map((row, rowIndex) => {
              const borderBottom =
                rowIndex === caseRows.length - 1
                  ? "none"
                  : "1px solid #dce4ee";

              const background =
                rowIndex % 2 === 0 ? "#ffffff" : "#f9fbfd";

              return (
                <tr key={row.caseId}>
                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      color: "#253a5d",
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    {row.caseId}
                  </td>

                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      color: "#455978",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    {row.applicant}
                  </td>

                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      color: "#455978",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    {row.amount}
                  </td>

                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      color: "#455978",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    {row.stage}
                  </td>

                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    <StatusPill type={row.statusType}>
                      {row.status}
                    </StatusPill>
                  </td>

                  <td
                    style={{
                      height: "54px",
                      padding: "0 14px",
                      color: "#455978",
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      borderBottom,
                      background,
                    }}
                  >
                    {row.owner}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SelectedCaseCard() {
  return (
    <section
      style={{
        padding: "27px 22px 22px",
        border: "1px solid #d3deec",
        borderRadius: "21px",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 14px 28px rgba(35,57,89,0.055)",
      }}
    >
      <SectionTitle>Selected case</SectionTitle>

      <div style={{ marginTop: "18px" }}>
        {selectedCaseDetails.map((detail, index) => (
          <div
            key={detail.label}
            style={{
              minHeight: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "18px",
              borderBottom:
                index === selectedCaseDetails.length - 1
                  ? "none"
                  : "1px solid #e1e7ef",
            }}
          >
            <span
              style={{
                color: "#7888a2",
                fontSize: "12px",
                fontWeight: 500,
              }}
            >
              {detail.label}
            </span>

            <strong
              style={{
                color: "#173464",
                fontSize: "12px",
                fontWeight: 900,
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {detail.value}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function ControlAlertsCard() {
  return (
    <section
      style={{
        padding: "27px 22px 28px",
        border: "1px solid #d3deec",
        borderRadius: "21px",
        background: "rgba(255,255,255,0.95)",
        boxShadow: "0 14px 28px rgba(35,57,89,0.055)",
      }}
    >
      <SectionTitle>Control alerts</SectionTitle>

      <div
        style={{
          marginTop: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
        }}
      >
        {alerts.map((alert, index) => {
          const success = alert.type === "success";

          return (
            <div
              key={`${alert.type}-${index}`}
              style={{
                position: "relative",
                minHeight: success ? "76px" : "54px",
                padding: success
                  ? "15px 21px 14px 18px"
                  : "13px 21px 13px 18px",
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                color: success ? "#34735f" : "#8b6728",
                fontSize: "13px",
                lineHeight: 1.65,
                fontWeight: 500,
                border: `1px solid ${
                  success ? "#b7e0ce" : "#f0d29c"
                }`,
                borderLeft: `4px solid ${
                  success ? "#18a574" : "#e69313"
                }`,
                borderRadius: "14px",
                background: success ? "#f4fbf8" : "#fff8eb",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "-35px",
                  right: "-25px",
                  width: "93px",
                  height: "93px",
                  borderRadius: "50%",
                  background: "rgba(83,101,220,0.17)",
                }}
              />

              <div style={{ position: "relative", zIndex: 2 }}>
                {alert.text}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function LegalDashboard() {
  const viewportWidth = useViewportWidth();

  const compactToolbar = viewportWidth < 1250;
  const compactHero = viewportWidth < 1050;
  const stackBottom = viewportWidth < 1180;

  const statsColumns =
    viewportWidth < 900 ? 1 : viewportWidth < 1200 ? 2 : 4;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100%",
        boxSizing: "border-box",
        color: "#23395e",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background:
          "radial-gradient(circle at 42% 4%, rgba(90,113,227,0.08), transparent 27%), linear-gradient(180deg, #f3f7fc 0%, #f7f9fc 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          padding:
            viewportWidth < 1200
              ? "22px 20px 44px"
              : "26px 28px 48px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "none",
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <LegalToolbar compact={compactToolbar} />

          <HeroBanner compact={compactHero} />

          <StatsCards columns={statsColumns} />

          <JourneyProgress />

          <div
            style={{
              width: "100%",
              display: "grid",
              gridTemplateColumns: stackBottom
                ? "minmax(0, 1fr)"
                : "minmax(0, 1fr) 340px",
              alignItems: "start",
              gap: "18px",
            }}
          >
            <CasesTable />

            <div
              style={{
                minWidth: 0,
                display: "flex",
                flexDirection: stackBottom ? "row" : "column",
                alignItems: "stretch",
                gap: "18px",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  flex: stackBottom ? 1 : "initial",
                }}
              >
                <SelectedCaseCard />
              </div>

              <div
                style={{
                  minWidth: 0,
                  flex: stackBottom ? 1 : "initial",
                }}
              >
                <ControlAlertsCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}