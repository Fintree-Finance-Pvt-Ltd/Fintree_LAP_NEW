import React, { useEffect, useMemo, useState } from "react";

/* =========================================================
   STATIC DATA
   Replace these arrays with API responses later.
========================================================= */

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
  { number: 11, name: "Collections", status: "Pending" },
];

const propertyFields = [
  {
    label: "Property Address",
    type: "text",
    value: "Sector 18, Noida, Uttar Pradesh 201301",
  },
  {
    label: "Property Type",
    type: "select",
    value: "Commercial Shop",
    options: [
      "Commercial Shop",
      "Residential Flat",
      "Independent House",
      "Plot",
    ],
  },
  {
    label: "Current Owner",
    type: "text",
    value: "Aarav Sharma",
  },
  {
    label: "Law Firm / Advocate",
    type: "text",
    value: "Lex & Title Associates",
  },
  {
    label: "Assignment Date",
    type: "date",
    value: "2026-06-18",
  },
  {
    label: "Mortgage Method",
    type: "select",
    value: "Equitable Mortgage / MODT",
    options: [
      "Equitable Mortgage / MODT",
      "Registered Mortgage",
      "Simple Mortgage",
    ],
  },
];

const titleChain = [
  {
    year: "2004",
    title: "First registered conveyance",
    subtitle: "Seller A → Buyer B",
  },
  {
    year: "2011",
    title: "Sale deed",
    subtitle: "Buyer B → Buyer C",
  },
  {
    year: "2018",
    title: "Present acquisition",
    subtitle: "Buyer C → Current owner",
  },
  {
    year: "2026",
    title: "Proposed mortgage",
    subtitle: "Current owner → Fintree Finance",
  },
];

const checklistSeed = [
  {
    id: "inventory",
    title: "Document inventory complete",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "ownership",
    title: "Ownership matches applicant/co-owner",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "title-chain",
    title: "Title chain verified for policy period",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "encumbrance",
    title: "Encumbrance certificate checked",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "land-record",
    title: "Sub-registrar / land record checked",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "municipal",
    title: "Municipal approvals reviewed",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "litigation",
    title: "Litigation search completed",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "charge",
    title: "Existing charge / lender identified",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "cersai",
    title: "CERSAI search completed",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "mortgage",
    title: "Mortgage creation is feasible",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "tax",
    title: "Property tax / dues reviewed",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
  {
    id: "original",
    title: "Original document availability confirmed",
    subtitle: "Legal evidence linked to report",
    checked: true,
  },
];

const legalOpinionSeed = {
  titleStatus: "Clear",
  encumbranceStatus: "No adverse encumbrance",
  cersaiResult: "No active charge",
  finalStatus: "Positive",
  conditions:
    "Original title documents to be deposited before disbursement. Updated property tax receipt required.",
  summary:
    "Title appears clear and marketable, subject to stated conditions and completion of mortgage documentation.",
};

/* =========================================================
   RESPONSIVE HOOK
========================================================= */

function useViewportWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, []);

  return width;
}

/* =========================================================
   ICONS
========================================================= */

function ScaleIcon({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <path d="M12 3v18" />
      <path d="M6 6h12" />
      <path d="M8 6 4 13h8L8 6Z" />
      <path d="m16 6-4 7h8l-4-7Z" />
      <path d="M8 18h8" />
    </svg>
  );
}

function DocumentIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v5h4" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function ChevronDownIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/* =========================================================
   SHARED UI
========================================================= */

function SectionTitle({ children }) {
  return (
    <div>
      <h2
        style={{
          margin: 0,
          color: "#152f59",
          fontSize: "16px",
          lineHeight: 1.3,
          fontWeight: 900,
          letterSpacing: "-0.25px",
        }}
      >
        {children}
      </h2>

      <div
        style={{
          width: "33px",
          height: "3px",
          marginTop: "8px",
          borderRadius: "999px",
          background:
            "linear-gradient(90deg, #4166e6 0%, #9650c8 100%)",
        }}
      />
    </div>
  );
}

function Button({
  children,
  onClick,
  variant = "default",
  disabled = false,
  compact = false,
}) {
  const variants = {
    default: {
      color: "#4f32b0",
      background: "#ffffff",
      border: "1px solid rgba(255,255,255,0.5)",
      shadow: "0 6px 16px rgba(44, 28, 117, 0.14)",
    },
    outline: {
      color: "#5c35bb",
      background: "#f8f4ff",
      border: "1px solid #cbbcf2",
      shadow: "0 4px 12px rgba(79, 46, 166, 0.06)",
    },
    neutral: {
      color: "#243858",
      background: "#ffffff",
      border: "1px solid #d4deed",
      shadow: "0 4px 12px rgba(30, 52, 84, 0.05)",
    },
  };

  const palette = variants[variant] || variants.default;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        height: compact ? "34px" : "42px",
        padding: compact ? "0 13px" : "0 17px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: palette.color,
        fontFamily: "inherit",
        fontSize: compact ? "11px" : "12px",
        fontWeight: 900,
        whiteSpace: "nowrap",
        cursor: disabled ? "not-allowed" : "pointer",
        outline: "none",
        border: palette.border,
        borderRadius: "11px",
        background: palette.background,
        boxShadow: palette.shadow,
        opacity: disabled ? 0.55 : 1,
        transition:
          "transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease",
      }}
      onMouseEnter={(event) => {
        if (!disabled) {
          event.currentTarget.style.transform = "translateY(-1px)";
          event.currentTarget.style.boxShadow =
            "0 8px 20px rgba(56, 37, 117, 0.15)";
        }
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = palette.shadow;
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return (
    <section
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: "1px solid #d5deed",
        borderRadius: "18px",
        background: "rgba(255,255,255,0.96)",
        boxShadow: "0 12px 28px rgba(36, 55, 88, 0.05)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}

function FieldLabel({ children }) {
  return (
    <label
      style={{
        display: "block",
        marginBottom: "7px",
        color: "#3e506e",
        fontSize: "11px",
        fontWeight: 900,
        letterSpacing: "0.05px",
      }}
    >
      {children}
    </label>
  );
}

function TextInput({ value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        height: "41px",
        padding: "0 13px",
        boxSizing: "border-box",
        color: "#314865",
        fontFamily: "inherit",
        fontSize: "12px",
        fontWeight: 500,
        outline: "none",
        border: "1px solid #ccd8e8",
        borderRadius: "10px",
        background: "#fbfcfe",
        transition: "border-color 160ms ease, box-shadow 160ms ease",
      }}
      onFocus={(event) => {
        event.currentTarget.style.borderColor = "#8f75db";
        event.currentTarget.style.boxShadow =
          "0 0 0 3px rgba(112,84,203,0.1)";
      }}
      onBlur={(event) => {
        event.currentTarget.style.borderColor = "#ccd8e8";
        event.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function SelectInput({ value, options, onChange }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={onChange}
        style={{
          width: "100%",
          height: "41px",
          padding: "0 38px 0 13px",
          boxSizing: "border-box",
          color: "#314865",
          fontFamily: "inherit",
          fontSize: "12px",
          fontWeight: 500,
          cursor: "pointer",
          appearance: "none",
          WebkitAppearance: "none",
          outline: "none",
          border: "1px solid #ccd8e8",
          borderRadius: "10px",
          background: "#fbfcfe",
        }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <span
        style={{
          position: "absolute",
          top: "50%",
          right: "12px",
          color: "#233c61",
          pointerEvents: "none",
          transform: "translateY(-50%)",
        }}
      >
        <ChevronDownIcon size={15} />
      </span>
    </div>
  );
}

function TextArea({ value, onChange, minHeight = 94 }) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        minHeight,
        padding: "12px 13px",
        boxSizing: "border-box",
        resize: "vertical",
        color: "#314865",
        fontFamily: "inherit",
        fontSize: "12px",
        lineHeight: 1.55,
        fontWeight: 500,
        outline: "none",
        border: "1px solid #b9a9ef",
        borderRadius: "10px",
        background: "#ffffff",
      }}
    />
  );
}

/* =========================================================
   LEGAL QUEUE TOP TOOLBAR
========================================================= */

function LegalQueueToolbar({ compact }) {
  const standardButtonStyle = {
    height: "40px",
    padding: "0 16px",
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#374151",
    fontFamily: "inherit",
    fontSize: "11px",
    fontWeight: 700,
    whiteSpace: "nowrap",
    cursor: "pointer",
    outline: "none",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    background: "#FFFFFF",
    boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
    transition:
      "transform 180ms ease, border-color 180ms ease, background-color 180ms ease, color 180ms ease, box-shadow 180ms ease",
  };

  const handleButtonEnter = (event) => {
    event.currentTarget.style.transform = "translateY(-1px)";
    event.currentTarget.style.borderColor = "#BFDBFE";
    event.currentTarget.style.background = "#F8FAFC";
    event.currentTarget.style.boxShadow =
      "0 6px 16px rgba(15, 23, 42, 0.08)";
  };

  const handleButtonLeave = (event) => {
    event.currentTarget.style.transform = "translateY(0)";
    event.currentTarget.style.borderColor = "#E5E7EB";
    event.currentTarget.style.background = "#FFFFFF";
    event.currentTarget.style.boxShadow =
      "0 1px 2px rgba(15, 23, 42, 0.03)";
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        width: "100%",
        height: "72px",
        minHeight: "72px",
        padding: compact ? "0 18px" : "0 26px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: compact ? "16px" : "24px",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        border: "none",
        borderBottom: "1px solid #E5E7EB",
        background: "#FFFFFF",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.03)",
      }}
    >
      {/* Left Section */}
      <div
        style={{
          minWidth: 0,
          flexShrink: 0,
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
            background: "#2563EB",
            boxShadow: "0 3px 8px rgba(37, 99, 235, 0.22)",
          }}
        />

        <div
          style={{
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              color: "#111827",
              fontSize: compact ? "14px" : "16px",
              lineHeight: 1.25,
              fontWeight: 800,
              letterSpacing: "-0.3px",
              whiteSpace: "nowrap",
            }}
          >
            LAP Operations Workspace
          </div>

          {!compact && (
            <div
              style={{
                marginTop: "4px",
                color: "#6B7280",
                fontSize: "10px",
                lineHeight: 1.2,
                fontWeight: 500,
                letterSpacing: "0.05px",
                whiteSpace: "nowrap",
              }}
            >
              Legal Officer · Delhi Hub · Queue
            </div>
          )}
        </div>
      </div>

      {/* Center and Right Section */}
      <div
        style={{
          minWidth: 0,
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: compact ? "8px" : "11px",
        }}
      >
        {/* Loan Selector */}
        <div
          style={{
            position: "relative",
            width: compact ? "300px" : "360px",
            minWidth: compact ? "250px" : "320px",
          }}
        >
          <select
            defaultValue="FTLIP-2026-0001"
            style={{
              width: "100%",
              height: "44px",
              padding: "0 42px 0 17px",
              boxSizing: "border-box",
              color: "#111827",
              fontFamily: "inherit",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              outline: "none",
              border: "1px solid #E5E7EB",
              borderRadius: "14px",
              background: "#FFFFFF",
              boxShadow:
                "0 1px 2px rgba(15, 23, 42, 0.03), inset 0 1px 0 rgba(255,255,255,0.8)",
              transition:
                "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = "#BFDBFE";
              event.currentTarget.style.background = "#F8FAFC";
            }}
            onMouseLeave={(event) => {
              if (document.activeElement !== event.currentTarget) {
                event.currentTarget.style.borderColor = "#E5E7EB";
                event.currentTarget.style.background = "#FFFFFF";
              }
            }}
            onFocus={(event) => {
              event.currentTarget.style.borderColor = "#2563EB";
              event.currentTarget.style.background = "#FFFFFF";
              event.currentTarget.style.boxShadow =
                "0 0 0 4px rgba(37, 99, 235, 0.10)";
            }}
            onBlur={(event) => {
              event.currentTarget.style.borderColor = "#E5E7EB";
              event.currentTarget.style.background = "#FFFFFF";
              event.currentTarget.style.boxShadow =
                "0 1px 2px rgba(15, 23, 42, 0.03)";
            }}
          >
            <option value="FTLIP-2026-0001">
              FTLIP-2026-0001 · Aarav Sharma
            </option>

            <option value="FTLIP-2026-0002">
              FTLIP-2026-0002 · Meera Iyer
            </option>

            <option value="FTLIP-2026-0003">
              FTLIP-2026-0003 · Rajesh Traders
            </option>
          </select>

          <span
            style={{
              position: "absolute",
              top: "50%",
              right: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#475569",
              pointerEvents: "none",
              transform: "translateY(-50%)",
            }}
          >
            <ChevronDownIcon size={15} />
          </span>
        </div>

        {/* New Status */}
        <div
          style={{
            height: "32px",
            padding: "0 13px",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2563EB",
            fontSize: "10px",
            fontWeight: 800,
            whiteSpace: "nowrap",
            border: "1px solid #DBEAFE",
            borderRadius: "999px",
            background: "#EFF6FF",
          }}
        >
          New
        </div>

        {/* Journey Map */}
        {!compact && (
          <button
            type="button"
            style={standardButtonStyle}
            onMouseEnter={handleButtonEnter}
            onMouseLeave={handleButtonLeave}
          >
            Journey map
          </button>
        )}

        {/* User Profile */}
        <div
          style={{
            height: "48px",
            padding: compact ? "4px" : "4px 13px 4px 5px",
            boxSizing: "border-box",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
            border: "1px solid #E5E7EB",
            borderRadius: "999px",
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
            transition:
              "transform 180ms ease, border-color 180ms ease, background-color 180ms ease, box-shadow 180ms ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-1px)";
            event.currentTarget.style.borderColor = "#BFDBFE";
            event.currentTarget.style.background = "#F8FAFC";
            event.currentTarget.style.boxShadow =
              "0 7px 18px rgba(15, 23, 42, 0.08)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.borderColor = "#E5E7EB";
            event.currentTarget.style.background = "#FFFFFF";
            event.currentTarget.style.boxShadow =
              "0 2px 8px rgba(15, 23, 42, 0.04)";
          }}
        >
          <div
            style={{
              width: "38px",
              height: "38px",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.1px",
              borderRadius: "50%",
              background:
                "linear-gradient(145deg, #2563EB 0%, #4F46E5 100%)",
              boxShadow: "0 4px 10px rgba(37, 99, 235, 0.24)",
            }}
          >
            LG
          </div>

          {!compact && (
            <div
              style={{
                minWidth: 0,
                paddingRight: "2px",
              }}
            >
              <div
                style={{
                  color: "#111827",
                  fontSize: "11px",
                  lineHeight: 1.25,
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                }}
              >
                Leena Gupta
              </div>

              <div
                style={{
                  marginTop: "3px",
                  color: "#6B7280",
                  fontSize: "8px",
                  lineHeight: 1.2,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                }}
              >
                Legal Officer · Delhi Hub
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={() =>
            window.alert("Connect this button with your logout handler.")
          }
          style={standardButtonStyle}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-1px)";
            event.currentTarget.style.color = "#1D4ED8";
            event.currentTarget.style.borderColor = "#93C5FD";
            event.currentTarget.style.background = "#EFF6FF";
            event.currentTarget.style.boxShadow =
              "0 6px 16px rgba(37, 99, 235, 0.10)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.color = "#374151";
            event.currentTarget.style.borderColor = "#E5E7EB";
            event.currentTarget.style.background = "#FFFFFF";
            event.currentTarget.style.boxShadow =
              "0 1px 2px rgba(15, 23, 42, 0.03)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

/* =========================================================
   PAYMENT GATE
========================================================= */

function PaymentGateBanner({ compact, onCreateLink }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "68px",
        padding: compact ? "14px 15px" : "14px 18px",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "18px",
        border: "1px solid #efd49a",
        borderLeft: "4px solid #df8a08",
        borderRadius: "14px",
        background: "#fffaf0",
        boxShadow: "0 7px 18px rgba(117, 76, 9, 0.04)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-46px",
          right: "-24px",
          width: "104px",
          height: "104px",
          borderRadius: "50%",
          background: "rgba(119, 81, 214, 0.12)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            color: "#8b6220",
            fontSize: "12px",
            lineHeight: 1.5,
            fontWeight: 600,
          }}
        >
          <strong style={{ fontWeight: 900 }}>
            Legal initiation payment gate:
          </strong>{" "}
          Legal Verification Fee ₹8,850
        </div>

        <div
          style={{
            marginTop: "3px",
            color: "#956f36",
            fontSize: "10px",
            fontWeight: 500,
          }}
        >
          Create and send an approved payment link before the stage is
          completed.
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 2 }}>
        <Button
          variant="outline"
          compact={compact}
          onClick={onCreateLink}
        >
          Create payment link
        </Button>
      </div>
    </section>
  );
}

/* =========================================================
   HERO
========================================================= */

function LegalQueueHero({ compact, outcome, onOutcomeChange }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: compact ? "118px" : "126px",
        padding: compact ? "23px 22px" : "25px 28px",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "20px",
        color: "#ffffff",
        borderRadius: "21px",
        background:
          "linear-gradient(105deg, #5348d5 0%, #5c45b4 45%, #9e55bd 100%)",
        boxShadow: "0 16px 34px rgba(82, 56, 166, 0.18)",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-85px",
          left: "-13px",
          width: "240px",
          height: "240px",
          borderRadius: "50%",
          background: "rgba(22, 218, 210, 0.62)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "-53px",
          left: "32px",
          width: "238px",
          height: "238px",
          borderRadius: "50%",
          background: "rgba(58, 69, 220, 0.48)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "-49px",
          bottom: "-110px",
          width: "205px",
          height: "205px",
          borderRadius: "50%",
          background: "rgba(222, 170, 229, 0.17)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          gap: "15px",
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            border: "1px solid rgba(255,255,255,0.34)",
            borderRadius: "13px",
            background: "rgba(255,255,255,0.13)",
          }}
        >
          <ScaleIcon size={24} />
        </div>

        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              color: "#ffffff",
              fontSize: compact ? "25px" : "28px",
              lineHeight: 1.15,
              fontWeight: 900,
              letterSpacing: "-0.7px",
            }}
          >
            Legal &amp; Title Due Diligence
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "rgba(255,255,255,0.9)",
              fontSize: "11px",
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            FTLIP-2026-0001 · Title chain, ownership, encumbrance,
            CERSAI and mortgage feasibility.
          </p>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "9px",
        }}
      >
        <Button
          onClick={() =>
            window.alert("Legal query action opened.")
          }
        >
          Raise Legal Query
        </Button>

        <Button
          onClick={() => onOutcomeChange("Negative")}
          variant={outcome === "Negative" ? "outline" : "default"}
        >
          Mark Negative
        </Button>

        <Button
          onClick={() => onOutcomeChange("Positive")}
          variant={outcome === "Positive" ? "outline" : "default"}
        >
          Mark Positive
        </Button>
      </div>
    </section>
  );
}

/* =========================================================
   JOURNEY
========================================================= */

function JourneyProgress() {
  return (
    <Card
      style={{
        padding: "28px 24px 22px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          paddingBottom: "4px",
        }}
      >
        <div
          style={{
            position: "relative",
            minWidth: "1320px",
            padding: "0 3px",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "45px",
              right: "45px",
              height: "2px",
              background:
                "linear-gradient(90deg, #a6b9f0 0%, #d3dbf0 100%)",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "grid",
              gridTemplateColumns: `repeat(${journeySteps.length}, minmax(104px, 1fr))`,
              columnGap: "11px",
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
                      width: active ? "46px" : "42px",
                      height: active ? "46px" : "42px",
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: active ? "#ffffff" : "#7c899f",
                      fontSize: active ? "14px" : "12px",
                      fontWeight: 900,
                      border: active
                        ? "7px solid #eee8fb"
                        : "6px solid #f2f4f8",
                      borderRadius: "50%",
                      background: active
                        ? "linear-gradient(145deg, #6b46c5, #9650c8)"
                        : "#e2e8f0",
                      boxShadow: active
                        ? "0 0 0 3px #d7c7f5, 0 8px 20px rgba(107,70,197,0.2)"
                        : "0 2px 7px rgba(38,58,89,0.05)",
                    }}
                  >
                    {step.number}
                  </div>

                  <div
                    style={{
                      marginTop: "11px",
                      color: active ? "#6645bd" : "#263b5e",
                      fontSize: "11px",
                      fontWeight: active ? 900 : 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {step.name}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#7e8ba2",
                      fontSize: "9px",
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
              height: "7px",
              margin: "23px 8px 0",
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
                right: "185px",
                borderRadius: "999px",
                background: "#acbdd6",
              }}
            />

            <span
              style={{
                position: "absolute",
                top: "50%",
                left: "-2px",
                color: "#a8b9d2",
                fontSize: "9px",
                transform: "translate(-100%, -50%)",
              }}
            >
              ◀
            </span>

            <span
              style={{
                position: "absolute",
                top: "50%",
                right: "-2px",
                color: "#a8b9d2",
                fontSize: "9px",
                transform: "translate(100%, -50%)",
              }}
            >
              ▶
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* =========================================================
   PROPERTY AND ASSIGNMENT
========================================================= */

function PropertyAssignmentCard({
  values,
  onChange,
  compactGrid,
}) {
  return (
    <Card style={{ padding: "23px 20px 20px" }}>
      <SectionTitle>Property and assignment</SectionTitle>

      <div
        style={{
          marginTop: "15px",
          display: "grid",
          gridTemplateColumns: compactGrid
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(3, minmax(0, 1fr))",
          gap: "14px",
        }}
      >
        {propertyFields.map((field) => {
          const currentValue =
            values[field.label] ?? field.value;

          return (
            <div
              key={field.label}
              style={{ minWidth: 0 }}
            >
              <FieldLabel>{field.label}</FieldLabel>

              {field.type === "select" ? (
                <SelectInput
                  value={currentValue}
                  options={field.options}
                  onChange={(event) =>
                    onChange(
                      field.label,
                      event.target.value
                    )
                  }
                />
              ) : (
                <TextInput
                  type={field.type}
                  value={currentValue}
                  onChange={(event) =>
                    onChange(
                      field.label,
                      event.target.value
                    )
                  }
                />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* =========================================================
   TITLE CHAIN
========================================================= */

function TitleChainCard() {
  return (
    <Card style={{ padding: "23px 20px 22px" }}>
      <SectionTitle>Title chain graph</SectionTitle>

      <div style={{ marginTop: "14px" }}>
        {titleChain.map((item, index) => (
          <div
            key={`${item.year}-${item.title}`}
            style={{
              position: "relative",
              minHeight: "47px",
              paddingLeft: "24px",
            }}
          >
            {index < titleChain.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  top: "16px",
                  bottom: "-2px",
                  left: "7px",
                  width: "2px",
                  background: "#cbb8ee",
                }}
              />
            )}

            <div
              style={{
                position: "absolute",
                top: "4px",
                left: 0,
                width: "15px",
                height: "15px",
                boxSizing: "border-box",
                border: "4px solid #f2e9fb",
                borderRadius: "50%",
                background: "#9650c8",
                boxShadow: "0 0 0 2px #e8daf8",
              }}
            />

            <div
              style={{
                color: "#263957",
                fontSize: "11px",
                lineHeight: 1.35,
                fontWeight: 900,
              }}
            >
              {item.year} · {item.title}
            </div>

            <div
              style={{
                marginTop: "3px",
                color: "#7b88a0",
                fontSize: "9px",
                lineHeight: 1.4,
                fontWeight: 500,
              }}
            >
              {item.subtitle}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* =========================================================
   CHECKLIST
========================================================= */

function ChecklistCard({
  items,
  onToggle,
  oneColumn,
}) {
  return (
    <Card style={{ padding: "22px 20px 20px" }}>
      <SectionTitle>Title and legal checklist</SectionTitle>

      <div
        style={{
          marginTop: "15px",
          display: "grid",
          gridTemplateColumns: oneColumn
            ? "minmax(0, 1fr)"
            : "repeat(2, minmax(0, 1fr))",
          gap: "8px",
        }}
      >
        {items.map((item) => (
          <label
            key={item.id}
            style={{
              minHeight: "49px",
              padding: "9px 11px",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "flex-start",
              gap: "9px",
              cursor: "pointer",
              border: "1px solid #d2dcea",
              borderRadius: "11px",
              background: "#ffffff",
              transition:
                "border-color 160ms ease, background 160ms ease",
            }}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggle(item.id)}
              style={{
                width: "13px",
                height: "13px",
                margin: "2px 0 0",
                flexShrink: 0,
                cursor: "pointer",
                accentColor: "#6d4bc4",
              }}
            />

            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: "block",
                  color: "#293b58",
                  fontSize: "11px",
                  lineHeight: 1.35,
                  fontWeight: 800,
                }}
              >
                {item.title}
              </span>

              <span
                style={{
                  display: "block",
                  marginTop: "2px",
                  color: "#7d8aa1",
                  fontSize: "9px",
                  lineHeight: 1.35,
                  fontWeight: 500,
                }}
              >
                {item.subtitle}
              </span>
            </span>
          </label>
        ))}
      </div>
    </Card>
  );
}

/* =========================================================
   REPORT AND NOTICE
========================================================= */

function LegalReportCard() {
  return (
    <Card style={{ padding: "23px 20px 20px" }}>
      <SectionTitle>Legal report</SectionTitle>

      <div
        style={{
          minHeight: "133px",
          marginTop: "14px",
          padding: "18px 14px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          border: "2px dashed #aa99df",
          borderRadius: "14px",
          background: "#fcfaff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "7px",
            color: "#3d4661",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          <span style={{ color: "#8d77ca" }}>
            <DocumentIcon size={15} />
          </span>

          <span>
            LAP_Legal_Report_FTLIP-2026-0001.pdf
          </span>
        </div>

        <div
          style={{
            marginTop: "5px",
            color: "#7c879c",
            fontSize: "9px",
            fontWeight: 500,
          }}
        >
          Digitally signed · hash verified
        </div>

        <div style={{ marginTop: "15px" }}>
          <Button
            variant="neutral"
            compact
            onClick={() =>
              window.alert(
                "Legal report preview will open here."
              )
            }
          >
            Preview
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ParallelNotice() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "84px",
        padding: "16px 18px",
        boxSizing: "border-box",
        overflow: "hidden",
        color: "#896223",
        fontSize: "11px",
        lineHeight: 1.55,
        fontWeight: 500,
        border: "1px solid #efd39b",
        borderLeft: "4px solid #dd880b",
        borderRadius: "13px",
        background: "#fffaf0",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-36px",
          right: "-26px",
          width: "88px",
          height: "88px",
          borderRadius: "50%",
          background: "rgba(111, 79, 204, 0.12)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        Legal and valuation may run in parallel, but
        sanction/disbursement cannot proceed until accepted
        outcomes are recorded.
      </div>
    </section>
  );
}

/* =========================================================
   LEGAL OPINION
========================================================= */

function LegalOpinionCard({
  value,
  onChange,
  compactGrid,
}) {
  return (
    <Card
      style={{
        padding: "23px 20px 20px",
        borderColor: "#c8baf0",
        boxShadow:
          "0 14px 30px rgba(86, 57, 165, 0.07)",
      }}
    >
      <SectionTitle>Legal opinion</SectionTitle>

      <div
        style={{
          marginTop: "14px",
          display: "grid",
          gridTemplateColumns: compactGrid
            ? "repeat(2, minmax(0, 1fr))"
            : "repeat(3, minmax(0, 1fr))",
          gap: "13px",
        }}
      >
        <div>
          <FieldLabel>Title Status</FieldLabel>

          <SelectInput
            value={value.titleStatus}
            options={[
              "Clear",
              "Conditional",
              "Adverse",
              "Pending",
            ]}
            onChange={(event) =>
              onChange(
                "titleStatus",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <FieldLabel>Encumbrance Status</FieldLabel>

          <SelectInput
            value={value.encumbranceStatus}
            options={[
              "No adverse encumbrance",
              "Existing charge found",
              "Pending verification",
            ]}
            onChange={(event) =>
              onChange(
                "encumbranceStatus",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <FieldLabel>CERSAI Result</FieldLabel>

          <SelectInput
            value={value.cersaiResult}
            options={[
              "No active charge",
              "Active charge found",
              "Search pending",
            ]}
            onChange={(event) =>
              onChange(
                "cersaiResult",
                event.target.value
              )
            }
          />
        </div>

        <div>
          <FieldLabel>Final Legal Status</FieldLabel>

          <SelectInput
            value={value.finalStatus}
            options={[
              "Positive",
              "Negative",
              "Conditional",
              "Pending",
            ]}
            onChange={(event) =>
              onChange(
                "finalStatus",
                event.target.value
              )
            }
          />
        </div>
      </div>

      <div style={{ marginTop: "13px" }}>
        <FieldLabel>
          Conditions / Deficiencies
        </FieldLabel>

        <TextArea
          value={value.conditions}
          minHeight={92}
          onChange={(event) =>
            onChange(
              "conditions",
              event.target.value
            )
          }
        />
      </div>

      <div style={{ marginTop: "13px" }}>
        <FieldLabel>
          Legal Opinion Summary
        </FieldLabel>

        <TextArea
          value={value.summary}
          minHeight={92}
          onChange={(event) =>
            onChange(
              "summary",
              event.target.value
            )
          }
        />
      </div>
    </Card>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function LegalQueue() {
  const viewportWidth = useViewportWidth();

  const sidebarVisible = viewportWidth >= 768;

  const availableWidth =
    viewportWidth - (sidebarVisible ? 288 : 0);

  const compactHeader = availableWidth < 1120;
  const compactHero = availableWidth < 1060;
  const stackColumns = availableWidth < 1040;
  const compactFormGrid = availableWidth < 1160;
  const checklistOneColumn = availableWidth < 820;

  const [propertyValues, setPropertyValues] =
    useState(() =>
      Object.fromEntries(
        propertyFields.map((field) => [
          field.label,
          field.value,
        ])
      )
    );

  const [checklist, setChecklist] =
    useState(checklistSeed);

  const [legalOpinion, setLegalOpinion] =
    useState(legalOpinionSeed);

  const [outcome, setOutcome] =
    useState("Positive");

  const completedChecks = useMemo(
    () =>
      checklist.filter((item) => item.checked)
        .length,
    [checklist]
  );

  const handlePropertyChange = (label, value) => {
    setPropertyValues((current) => ({
      ...current,
      [label]: value,
    }));
  };

  const handleChecklistToggle = (id) => {
    setChecklist((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              checked: !item.checked,
            }
          : item
      )
    );
  };

  const handleOpinionChange = (field, value) => {
    setLegalOpinion((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "finalStatus") {
      setOutcome(value);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "stretch",
        color: "#23395e",
        fontFamily:
          'Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        background:
          "radial-gradient(circle at 87% 4%, rgba(24,186,205,0.08), transparent 23%), radial-gradient(circle at 42% 3%, rgba(104,82,205,0.07), transparent 28%), linear-gradient(180deg, #f3f7fc 0%, #f7f9fc 100%)",
      }}
    >
      <main
        style={{
          minWidth: 0,
          minHeight: "100vh",
          flex: 1,
          boxSizing: "border-box",
          background:
            "radial-gradient(circle at 87% 4%, rgba(24,186,205,0.08), transparent 23%), radial-gradient(circle at 42% 3%, rgba(104,82,205,0.07), transparent 28%), linear-gradient(180deg, #f3f7fc 0%, #f7f9fc 100%)",
        }}
      >
        <LegalQueueToolbar
          compact={compactHeader}
        />

        <div
          style={{
            width: "100%",
            padding:
              availableWidth < 1100
                ? "22px 18px 46px"
                : "24px 28px 50px",
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
              gap: "16px",
            }}
          >
            <PaymentGateBanner
              compact={compactHero}
              onCreateLink={() =>
                window.alert(
                  "Payment link creation flow will open here."
                )
              }
            />

            <LegalQueueHero
              compact={compactHero}
              outcome={outcome}
              onOutcomeChange={(value) => {
                setOutcome(value);

                setLegalOpinion((current) => ({
                  ...current,
                  finalStatus: value,
                }));
              }}
            />

            <JourneyProgress />

            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: stackColumns
                  ? "minmax(0, 1fr)"
                  : "minmax(0, 1fr) 320px",
                alignItems: "start",
                gap: "16px",
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <PropertyAssignmentCard
                  values={propertyValues}
                  onChange={
                    handlePropertyChange
                  }
                  compactGrid={
                    compactFormGrid
                  }
                />

                <ChecklistCard
                  items={checklist}
                  onToggle={
                    handleChecklistToggle
                  }
                  oneColumn={
                    checklistOneColumn
                  }
                />

                <LegalOpinionCard
                  value={legalOpinion}
                  onChange={
                    handleOpinionChange
                  }
                  compactGrid={
                    compactFormGrid
                  }
                />
              </div>

              <aside
                style={{
                  minWidth: 0,
                  display: "flex",
                  flexDirection: stackColumns
                    ? "row"
                    : "column",
                  alignItems: "stretch",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                    flex: stackColumns
                      ? 1
                      : "initial",
                  }}
                >
                  <TitleChainCard />
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: stackColumns
                      ? 1
                      : "initial",
                  }}
                >
                  <LegalReportCard />
                </div>

                <div
                  style={{
                    minWidth: 0,
                    flex: stackColumns
                      ? 1
                      : "initial",
                  }}
                >
                  <ParallelNotice />
                </div>
              </aside>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                color: "#7d89a0",
                fontSize: "10px",
                fontWeight: 600,
              }}
            >
              Checklist completion:{" "}
              {completedChecks}/
              {checklist.length}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}