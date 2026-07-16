import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import { rmApi } from "../rmApi.js";

const initialChargeForm = {
  chargeType: "PROCESSING_FEE",
  name: "Processing Fee",
  calculationMethod: "PERCENTAGE",
  calculationBasis: "Recommended Amount",
  rate: "2",
  baseAmount: "3000000",
  taxRate: "18",
  stage: "BEFORE_DISBURSEMENT",
  paymentTreatment: "UPFRONT",
  dueDate: "",
  remarks: "Processing fee payable before disbursement.",
};

const initialReceiptForm = {
  receiptDate: new Date().toISOString().slice(0, 10),
  amountReceived: "0",
  paymentMode: "NEFT",
  paymentReference: "",
  bankName: "",
  remarks: "",
};

const unwrapResponse = (response) => {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response ?? {};
};

const numberValue = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const formatCurrency = (value, fractionDigits = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: fractionDigits,
  }).format(numberValue(value));

const maskMobile = (mobile) => {
  const value = String(mobile || "");
  if (value.length < 4) return value || "-";
  return `${value.slice(0, 2)}XXXXXX${value.slice(-2)}`;
};

const maskPan = (pan) => {
  const value = String(pan || "").toUpperCase();
  if (value.length !== 10) return value || "-";
  return `${value.slice(0, 3)}XX${value.slice(5, 9)}X`;
};

const normalizeCharge = (charge) => ({
  ...charge,
  base: numberValue(charge.base),
  gstRate: numberValue(charge.gstRate),
  gstAmount: numberValue(charge.gstAmount),
  grossAmount: numberValue(charge.grossAmount),
  paidAmount: numberValue(charge.paidAmount),
  waiverAmount: numberValue(charge.waiverAmount),
  refundAmount: numberValue(charge.refundAmount),
  collectionStatus: charge.collectionStatus || "pending",
  scheduleStatus: charge.scheduleStatus || "draft",
  noLink: Boolean(charge.noLink),
});

const calculateAmounts = (base, gstRate = 18) => {
  const baseAmount = numberValue(base);
  const gstPercent = numberValue(gstRate);
  const gstAmount = Number(((baseAmount * gstPercent) / 100).toFixed(2));
  const grossAmount = Number((baseAmount + gstAmount).toFixed(2));

  return {
    base: baseAmount,
    gstRate: gstPercent,
    gstAmount,
    grossAmount,
  };
};

const getOutstanding = (charge) =>
  Math.max(
    numberValue(charge.grossAmount) -
    numberValue(charge.paidAmount) -
    numberValue(charge.waiverAmount) +
    numberValue(charge.refundAmount),
    0,
  );

export default function ChargesReceipts() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const selectedId = applicationId || "";

  const [activeTab, setActiveTab] = useState("charges");
  const [charges, setCharges] = useState([]);
  const [scheduleStatus, setScheduleStatus] = useState("draft");
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);

  const [chargeForm, setChargeForm] = useState(initialChargeForm);
  const [receiptForm, setReceiptForm] = useState(initialReceiptForm);
  const [allocation, setAllocation] = useState({});

  const applicationListQuery = useQuery({
  queryKey: ["charge-receipt-application-list-documents-uploaded"],
  queryFn: async () => {
    const response = await rmApi.getChargeReceiptApplications({
      page: 1,
      limit: 100,
    });

    const payload = unwrapResponse(response);

    const rows = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
        ? payload.data
        : [];

    const applicationsWithWorkflow = await Promise.all(
      rows.map(async (application) => {
        try {
          const workflowResponse = await rmApi.workflowStatus(application.id);
          const workflowPayload = unwrapResponse(workflowResponse);
          const workflow = workflowPayload?.data ?? workflowPayload ?? {};

          const documentsUploaded =
            workflow.documentsUploaded === true ||
            workflow.documentsUploaded === "true" ||
            workflow.documentsUploaded === 1 ||
            workflow.documentsUploaded === "1";

          if (!documentsUploaded) {
            return null;
          }

          return {
            ...application,
            workflow,
          };
        } catch (error) {
          console.error(
            "Failed to fetch workflow for application:",
            application.id,
            error,
          );

          return null;
        }
      }),
    );

    return applicationsWithWorkflow.filter(Boolean);
  },
  staleTime: 30000,
  retry: false,
});

const applicationQuery = useQuery({
  queryKey: ["application", applicationId],
  queryFn: () => rmApi.getApplication(applicationId),
  enabled: Boolean(applicationId),
  staleTime: 0,
  retry: false,
});

const applicationList = applicationListQuery.data ?? [];

const applicationPayload = unwrapResponse(applicationQuery.data);
const application = applicationPayload?.data ?? applicationPayload ?? {};
const profile = application?.customerProfile || {};


 


  const selectedCustomer = {
    customerName:
      application.customerName ||
      `${profile.firstName || ""} ${profile.middleName || ""} ${profile.lastName || ""}`
        .replace(/\s+/g, " ")
        .trim() ||
      "-",
    customerType:
      application.customerType || profile.customerType || "Individual",
    mobile: application.mobile || profile.mobile || "-",
    pan: application.pan || application.panNumber || profile.panNumber || "-",
    occupation:
      application.occupationType ||
      profile.occupationType ||
      application.occupation ||
      "-",
    recommendedAmount:
      application.recommendedAmount ||
      profile.recommendedAmount ||
      application.requestedAmount ||
      "0",
    recommendedRoi:
      application.recommendedRoi ||
      profile.recommendedRoi ||
      application.roi ||
      profile.roi ||
      "-",
    tenure:
      application.recommendedTenure ||
      profile.recommendedTenure ||
      application.tenure ||
      profile.tenure ||
      application.requestedTenure ||
      "-",
    propertyType:
      application.propertyType ||
      profile.propertyType ||
      application.propertyCategory ||
      profile.propertyCategory ||
      "-",
    marketValue:
      application.marketValue ||
      profile.marketValue ||
      application.propertyValue ||
      "0",
  };

  const fetchSchedule = async () => {
    if (!applicationId) {
      setCharges([]);
      setScheduleStatus("draft");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const response = await rmApi.getChargeSchedule(applicationId);
      const data = unwrapResponse(response);

      const list = Array.isArray(data?.charges) ? data.charges : [];

      setCharges(list.map(normalizeCharge));
      setScheduleStatus(data?.scheduleStatus || "draft");
    } catch (err) {
      setCharges([]);
      setScheduleStatus("draft");
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load charges receipt schedule.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [applicationId]);

  const visibleCharges = useMemo(() => {
    if (!applicationId) return charges;

    const loginFeeExists = charges.some((item) => {
      const name = String(item.name || "").toLowerCase();
      return name.includes("login") || name.includes("application fee");
    });

    if (loginFeeExists) return charges;

    const amounts = calculateAmounts(10, 18);

    const defaultLoginFee = normalizeCharge({
      id: "DEFAULT_LOGIN_FEE_PREVIEW",
      isPreview: true,
      name: "Login / Application Fee",
      sub: "LOGIN_FEE",
      stage: "RM / Login",
      ...amounts,
      paidAmount: 0,
      waiverAmount: 0,
      refundAmount: 0,
      collectionStatus: "pending",
      scheduleStatus: "draft",
      paymentReference: "Preview only",
      receiptNo: "",
      noLink: false,
    });

    return [defaultLoginFee, ...charges];
  }, [applicationId, charges]);

  const receiptRows = useMemo(
    () =>
      charges.filter(
        (item) =>
          numberValue(item.paidAmount) > 0 ||
          item.paymentReference ||
          item.receiptNo,
      ),
    [charges],
  );

  const outstandingCharges = useMemo(
    () => charges.filter((item) => getOutstanding(item) > 0),
    [charges],
  );

  const metrics = useMemo(() => {
    const result = visibleCharges.reduce(
      (acc, item) => {
        acc.totalCharges += numberValue(item.grossAmount);
        acc.amountCollected += numberValue(item.paidAmount);
        acc.waived += numberValue(item.waiverAmount);
        acc.refunded += numberValue(item.refundAmount);
        return acc;
      },
      {
        totalCharges: 0,
        amountCollected: 0,
        waived: 0,
        refunded: 0,
      },
    );

    const outstanding =
      result.totalCharges -
      result.amountCollected -
      result.waived +
      result.refunded;

    return {
      totalCharges: result.totalCharges,
      amountCollected: result.amountCollected,
      outstanding,
      pendingReceipts: receiptRows.filter((item) => !item.receiptNo).length,
    };
  }, [visibleCharges, receiptRows]);

  const chargeCalculation = useMemo(() => {
    const method = chargeForm.calculationMethod;
    const rate = numberValue(chargeForm.rate);
    const basis = numberValue(chargeForm.baseAmount);
    const taxRate = numberValue(chargeForm.taxRate);

    let chargeBase = basis;

    if (method === "PERCENTAGE") {
      chargeBase = (basis * rate) / 100;
    }

    const tax = (chargeBase * taxRate) / 100;
    const total = chargeBase + tax;

    return {
      chargeBase,
      tax,
      total,
      outstanding: total,
    };
  }, [chargeForm]);

  const receiptCalculation = useMemo(() => {
    const receiptAmount = numberValue(receiptForm.amountReceived);

    const allocated = Object.values(allocation).reduce(
      (sum, value) => sum + numberValue(value),
      0,
    );

    return {
      receiptAmount,
      allocated,
      unallocated: receiptAmount - allocated,
    };
  }, [receiptForm.amountReceived, allocation]);

  const showSuccess = (message) => {
    setSuccess(message);
    setError("");
    window.setTimeout(() => setSuccess(""), 2500);
  };

  const runAction = async (callback, message) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await callback();

      showSuccess(message);
      await fetchSchedule();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Action failed.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplicationChange = (event) => {
    const nextApplicationId = event.target.value;
    if (!nextApplicationId) return;
    navigate(`/charges-receipts/${nextApplicationId}`);
  };

  const createDefaultSchedule = () => {
    if (!applicationId) {
      setError("Please select customer application first.");
      return;
    }

    runAction(
      () => rmApi.createDefaultChargeSchedule(applicationId),
      "Default charge schedule created successfully.",
    );
  };

  const createCharge = async () => {
    if (!applicationId) {
      setError("Please select customer application first.");
      return;
    }

    const payload = {
      applicationId: Number(applicationId),
      name: chargeForm.name,
      sub: chargeForm.chargeType,
      stage: chargeForm.stage,
      base: Number(chargeCalculation.chargeBase.toFixed(2)),
      gstRate: numberValue(chargeForm.taxRate),
      noLink: false,
    };

    await runAction(
      () => rmApi.createChargeReceipt(payload),
      "Charge created successfully.",
    );

    setChargeModalOpen(false);
    setChargeForm(initialChargeForm);
  };

  const submitSchedule = () => {
    if (!charges.length) {
      setError("Please create default schedule or add a charge first.");
      return;
    }

    runAction(
      () => rmApi.submitChargeSchedule(applicationId),
      "Charge schedule submitted successfully.",
    );
  };

  // const approveSchedule = () => {
  //   if (!charges.length) {
  //     setError("Please create default schedule or add a charge first.");
  //     return;
  //   }

  //   runAction(
  //     () => rmApi.approveChargeSchedule(applicationId),
  //     "Charge schedule approved successfully.",
  //   );
  // };

  const updateCharge = async (charge, payload) => {
    await runAction(
      () => rmApi.updateChargeReceipt(charge.id, payload),
      "Charge updated successfully.",
    );
  };

  const deleteCharge = async (charge) => {
    if (!window.confirm(`Delete "${charge.name}"?`)) return;

    await runAction(
      () => rmApi.deleteChargeReceipt(charge.id),
      "Charge deleted successfully.",
    );
  };

  const waiveCharge = async (charge) => {
    const amount = window.prompt(
      "Enter waiver amount",
      String(getOutstanding(charge)),
    );

    if (amount === null) return;

    await runAction(
      () =>
        rmApi.waiveChargeReceipt(charge.id, {
          waiverAmount: numberValue(amount),
        }),
      "Waiver updated successfully.",
    );
  };

  const refundCharge = async (charge) => {
    const amount = window.prompt("Enter refund amount", "0");

    if (amount === null) return;

    await runAction(
      () =>
        rmApi.refundChargeReceipt(charge.id, {
          refundAmount: numberValue(amount),
        }),
      "Refund updated successfully.",
    );
  };

  const openReceiptModal = (charge = null) => {
    if (!charges.length) {
      setError("Please create default schedule or add a charge first.");
      return;
    }

    const nextAllocation = {};

    if (charge && !charge.isPreview) {
      const amount = getOutstanding(charge);
      nextAllocation[charge.id] = amount;
      setReceiptForm((prev) => ({
        ...prev,
        amountReceived: String(amount),
        remarks: `Customer paid against ${charge.name}.`,
      }));
    } else {
      const firstOutstanding = outstandingCharges[0];
      if (firstOutstanding) {
        const amount = getOutstanding(firstOutstanding);
        nextAllocation[firstOutstanding.id] = amount;
        setReceiptForm((prev) => ({
          ...prev,
          amountReceived: String(amount),
        }));
      }
    }

    setAllocation(nextAllocation);
    setReceiptModalOpen(true);
  };

  const saveReceipt = async () => {
    const allocations = Object.entries(allocation)
      .map(([chargeId, amount]) => ({
        chargeId,
        amount: numberValue(amount),
      }))
      .filter((item) => item.amount > 0);

    if (!allocations.length) {
      setError("Please allocate receipt amount to at least one charge.");
      return;
    }

    if (receiptCalculation.unallocated < 0) {
      setError("Allocated amount cannot be greater than receipt amount.");
      return;
    }

    await runAction(async () => {
      for (const item of allocations) {
        await rmApi.markChargePaid(item.chargeId, {
          paidAmount: item.amount,
          paymentMode: receiptForm.paymentMode,
          paymentReference: receiptForm.paymentReference,
        });
      }
    }, "Receipt recorded successfully.");

    setReceiptModalOpen(false);
    setReceiptForm(initialReceiptForm);
    setAllocation({});
  };

  const getStatusBadgeClass = (status) => {
    const value = String(status || "pending").toLowerCase();

    if (value === "paid") return "badge badge-paid";
    if (value === "partial") return "badge badge-partial";
    if (value === "waived") return "badge badge-paid";
    if (value === "refunded") return "badge badge-pending";

    return "badge badge-pending";
  };

  const getStatusLabel = (status) => {
    const value = String(status || "pending").toLowerCase();
    if (value === "partial") return "Partially Paid";
    return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const netDisbursementPreview =
    numberValue(selectedCustomer.recommendedAmount) - metrics.totalCharges;

  return (
    <div className="charges-react-page">
      <style>{`
        .charges-react-page{--primary:#2563eb;--primary-dark:#1d4ed8;--bg:#f8fafc;--surface:#fff;--border:#e2e8f0;--text:#0f172a;--muted:#64748b;--shadow:0 10px 30px rgba(15,23,42,.08);background:var(--bg);min-height:100vh;color:var(--text)}
        .charges-react-page *{box-sizing:border-box}
        .charges-react-page button,.charges-react-page input,.charges-react-page select,.charges-react-page textarea{font:inherit}
        .charges-react-page button{cursor:pointer}
        .charges-react-page .page{width:min(1500px,100%);margin:0 auto;padding:28px}
        .charges-react-page .hero{background:linear-gradient(120deg,#2575fc 0%,#1e40af 48%,#6a11cb 100%);color:#fff;border-radius:26px;padding:28px 30px;box-shadow:0 18px 45px rgba(37,99,235,.18);display:flex;justify-content:space-between;gap:20px;align-items:center}
        .charges-react-page .hero h1{margin:0;font-size:clamp(24px,3vw,34px);letter-spacing:-.03em}
        .charges-react-page .hero p{margin:7px 0 0;color:rgba(255,255,255,.82);font-size:14px}
        .charges-react-page .application-select{min-width:290px;border:1px solid rgba(255,255,255,.28);background:rgba(255,255,255,.16);color:white;padding:12px 14px;border-radius:13px;outline:none}
        .charges-react-page .application-select option{color:#0f172a}
        .charges-react-page .card{background:var(--surface);border:1px solid var(--border);border-radius:20px;box-shadow:var(--shadow)}
        .charges-react-page .customer-summary{margin-top:22px;padding:22px}
        .charges-react-page .section-heading{display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:18px}
        .charges-react-page .section-heading h2,.charges-react-page .section-heading h3{margin:0;font-size:15px;letter-spacing:.02em}
        .charges-react-page .muted{color:var(--muted);font-size:12px;margin-top:5px}
        .charges-react-page .customer-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}
        .charges-react-page .field-box{background:#f8fafc;border:1px solid #edf2f7;border-radius:14px;padding:13px 14px;min-height:72px}
        .charges-react-page .field-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;font-weight:800;color:#94a3b8}
        .charges-react-page .field-value{margin-top:6px;font-size:13px;font-weight:800;color:#1e293b;overflow-wrap:anywhere}
        .charges-react-page .metrics{margin-top:20px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
        .charges-react-page .metric{padding:20px;position:relative;overflow:hidden}
        .charges-react-page .metric::after{content:"";width:90px;height:90px;position:absolute;border-radius:999px;right:-24px;top:-30px;background:currentColor;opacity:.06}
        .charges-react-page .metric-title{color:#94a3b8;font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
        .charges-react-page .metric-value{margin-top:8px;font-size:26px;font-weight:900}
        .charges-react-page .blue{color:#2563eb}.charges-react-page .green{color:#059669}.charges-react-page .orange{color:#d97706}.charges-react-page .purple{color:#7c3aed}
        .charges-react-page .workspace{margin-top:20px;overflow:hidden}
        .charges-react-page .tabs{display:flex;border-bottom:1px solid var(--border);background:#fff}
        .charges-react-page .tab{padding:17px 24px;border:0;background:transparent;color:var(--muted);font-weight:800;border-bottom:3px solid transparent}
        .charges-react-page .tab.active{color:var(--primary);border-color:var(--primary);background:#eff6ff}
        .charges-react-page .tab-content{padding:22px}
        .charges-react-page .toolbar{display:flex;justify-content:space-between;align-items:flex-end;gap:14px;margin-bottom:18px;flex-wrap:wrap}
        .charges-react-page .filters{display:flex;gap:10px;flex-wrap:wrap}
        .charges-react-page .control{border:1px solid var(--border);border-radius:11px;padding:10px 12px;background:#fff;color:#334155;min-width:160px;outline:none}
        .charges-react-page .btn{border:0;border-radius:11px;padding:10px 15px;font-size:12px;font-weight:900;transition:.2s ease}
        .charges-react-page .btn-primary{color:#fff;background:var(--primary);box-shadow:0 8px 18px rgba(37,99,235,.22)}
        .charges-react-page .btn-primary:hover{background:var(--primary-dark)}
        .charges-react-page .btn-secondary{color:#334155;background:#f1f5f9;border:1px solid var(--border)}
        .charges-react-page .btn-danger{color:#b91c1c;background:#fee2e2;border:1px solid #fecaca}
        .charges-react-page .btn:disabled{opacity:.55;cursor:not-allowed}
        .charges-react-page .table-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:15px}
        .charges-react-page table{width:100%;border-collapse:collapse;min-width:1100px}
        .charges-react-page thead{background:#f8fafc}
        .charges-react-page th{text-align:left;padding:13px 14px;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;border-bottom:1px solid var(--border)}
        .charges-react-page td{padding:14px;font-size:12px;border-bottom:1px solid #eef2f7;vertical-align:middle}
        .charges-react-page tbody tr:hover{background:#f8fafc}
        .charges-react-page tbody tr:last-child td{border-bottom:0}
        .charges-react-page .name-cell strong{display:block;color:#0f172a}
        .charges-react-page .name-cell span{display:block;margin-top:4px;color:#94a3b8;font-size:10px}
        .charges-react-page .badge{display:inline-flex;align-items:center;border-radius:999px;padding:5px 9px;font-size:10px;font-weight:900;border:1px solid transparent;white-space:nowrap}
        .charges-react-page .badge-paid,.charges-react-page .badge-verified{color:#047857;background:#ecfdf5;border-color:#a7f3d0}
        .charges-react-page .badge-pending{color:#b45309;background:#fffbeb;border-color:#fde68a}
        .charges-react-page .badge-partial{color:#1d4ed8;background:#eff6ff;border-color:#bfdbfe}
.charges-react-page .action-group {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  min-width: 240px;
}

.charges-react-page .action-btn {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 10px;
  font-weight: 900;
  line-height: 1;
  white-space: nowrap;
  transition: 0.18s ease;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
}

.charges-react-page .action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 7px 14px rgba(15, 23, 42, 0.1);
}

.charges-react-page .action-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.charges-react-page .action-view {
  background: #eff6ff;
  color: #1d4ed8;
  border-color: #bfdbfe;
}

.charges-react-page .action-view:hover {
  background: #dbeafe;
}

.charges-react-page .action-receipt {
  background: #ecfdf5;
  color: #047857;
  border-color: #a7f3d0;
}

.charges-react-page .action-receipt:hover {
  background: #d1fae5;
}

.charges-react-page .action-waiver {
  background: #fffbeb;
  color: #b45309;
  border-color: #fde68a;
}

.charges-react-page .action-waiver:hover {
  background: #fef3c7;
}

.charges-react-page .action-refund {
  background: #faf5ff;
  color: #7e22ce;
  border-color: #e9d5ff;
}

.charges-react-page .action-refund:hover {
  background: #f3e8ff;
}

.charges-react-page .action-delete {
  background: #fef2f2;
  color: #b91c1c;
  border-color: #fecaca;
}

.charges-react-page .action-delete:hover {
  background: #fee2e2;
}

.charges-react-page .action-save {
  background: #2563eb;
  color: #ffffff;
  border-color: #2563eb;
}

.charges-react-page .action-save:hover {
  background: #1d4ed8;
}
        .charges-react-page .empty-info{margin-top:16px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:13px 14px;border-radius:12px;font-size:12px;font-weight:700}
        .charges-react-page .alert{margin-top:16px;border-radius:12px;padding:12px 14px;font-size:12px;font-weight:800}
        .charges-react-page .alert-error{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c}
        .charges-react-page .alert-success{background:#ecfdf5;border:1px solid #a7f3d0;color:#047857}
        .charges-react-page .modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.58);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;z-index:1000}
        .charges-react-page .modal{width:min(760px,100%);max-height:92vh;overflow-y:auto;background:#fff;border-radius:22px;box-shadow:0 30px 80px rgba(15,23,42,.3)}
        .charges-react-page .modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--border)}
        .charges-react-page .modal-header h3{margin:0;font-size:16px}
        .charges-react-page .close-btn{width:34px;height:34px;border:0;border-radius:10px;background:#f1f5f9;font-size:20px;color:#64748b}
        .charges-react-page .modal-body{padding:22px}
        .charges-react-page .form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
        .charges-react-page .form-group.full{grid-column:1/-1}
        .charges-react-page .form-group label{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:900;color:#64748b;margin-bottom:7px}
        .charges-react-page .form-group input,.charges-react-page .form-group select,.charges-react-page .form-group textarea{width:100%;border:1px solid var(--border);border-radius:11px;padding:11px 12px;outline:none;color:#1e293b;background:#fff}
        .charges-react-page .form-group textarea{min-height:85px;resize:vertical}
        .charges-react-page .calculation-panel{grid-column:1/-1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
        .charges-react-page .calc-item{border-radius:11px;background:white;border:1px solid #edf2f7;padding:11px}
        .charges-react-page .calc-item span{display:block;font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;font-weight:900}
        .charges-react-page .calc-item strong{display:block;margin-top:5px;font-size:14px}
        .charges-react-page .modal-footer{padding:17px 22px;border-top:1px solid var(--border);display:flex;justify-content:flex-end;gap:10px;background:#f8fafc}
        .charges-react-page .allocation-list{grid-column:1/-1;border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .charges-react-page .allocation-row{display:grid;grid-template-columns:1.5fr .8fr .8fr;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid #eef2f7}
        .charges-react-page .allocation-row:last-child{border-bottom:0}
        .charges-react-page .allocation-row small{color:#94a3b8;display:block;margin-top:3px}
        .charges-react-page .allocation-row input{width:100%;border:1px solid var(--border);border-radius:9px;padding:9px}
        @media(max-width:1100px){.charges-react-page .customer-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.charges-react-page .metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.charges-react-page .page{padding:15px}.charges-react-page .hero{flex-direction:column;align-items:stretch;padding:22px}.charges-react-page .application-select{min-width:0;width:100%}.charges-react-page .customer-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.charges-react-page .metrics{grid-template-columns:1fr}.charges-react-page .form-grid{grid-template-columns:1fr}.charges-react-page .form-group.full,.charges-react-page .calculation-panel,.charges-react-page .allocation-list{grid-column:auto}.charges-react-page .calculation-panel{grid-template-columns:repeat(2,minmax(0,1fr))}.charges-react-page .allocation-row{grid-template-columns:1fr}}
        @media(max-width:480px){.charges-react-page .customer-grid{grid-template-columns:1fr}.charges-react-page .tabs{overflow-x:auto}.charges-react-page .tab{white-space:nowrap}}
      `}</style>

      <main className="page">
        <section className="hero">
          <div>
            <h1>Charges & Receipts</h1>
            <p>
              Create application charges, collect customer payments and track
              outstanding balances.
            </p>
          </div>

          <select
            className="application-select"
            value={selectedId}
            disabled={applicationListQuery.isLoading}
            onChange={handleApplicationChange}
          >
         <option value="">
  {applicationListQuery.isLoading
    ? "Loading document completed applications..."
    : applicationList.length === 0
      ? "No document completed applications found"
      : "Select Customer Application"}
</option>

            {applicationList.map((item) => (
              <option key={item.id} value={item.id}>
                {item.applicationNumber} - {item.customerName}
              </option>
            ))}
          </select>
        </section>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <section className="card customer-summary">
          <div className="section-heading">
            <div>
              <h2>Customer & Loan Summary</h2>
              <div className="muted">
                Profile information used as the calculation basis for charges.
              </div>
            </div>

            <button
              className="btn btn-secondary"
              disabled={!applicationId}
              onClick={() => navigate(`/applications/${applicationId}`)}
            >
              View Full Profile
            </button>
          </div>

          <div className="customer-grid">
            <div className="field-box">
              <div className="field-label">Customer Name</div>
              <div className="field-value">{selectedCustomer.customerName}</div>
            </div>

            <div className="field-box">
              <div className="field-label">Customer Type</div>
              <div className="field-value">{selectedCustomer.customerType}</div>
            </div>

            <div className="field-box">
              <div className="field-label">Mobile</div>
              <div className="field-value">{maskMobile(selectedCustomer.mobile)}</div>
            </div>

            <div className="field-box">
              <div className="field-label">PAN</div>
              <div className="field-value">{maskPan(selectedCustomer.pan)}</div>
            </div>

            <div className="field-box">
              <div className="field-label">Occupation</div>
              <div className="field-value">{selectedCustomer.occupation}</div>
            </div>

            <div className="field-box">
              <div className="field-label">Recommended Amount</div>
              <div className="field-value">
                {formatCurrency(selectedCustomer.recommendedAmount)}
              </div>
            </div>

            <div className="field-box">
              <div className="field-label">Recommended ROI</div>
              <div className="field-value">
                {selectedCustomer.recommendedRoi === "-"
                  ? "-"
                  : `${selectedCustomer.recommendedRoi}%`}
              </div>
            </div>

            <div className="field-box">
              <div className="field-label">Tenure</div>
              <div className="field-value">
                {selectedCustomer.tenure === "-"
                  ? "-"
                  : `${selectedCustomer.tenure} Months`}
              </div>
            </div>

            <div className="field-box">
              <div className="field-label">Property Type</div>
              <div className="field-value">{selectedCustomer.propertyType}</div>
            </div>

            <div className="field-box">
              <div className="field-label">Market Value</div>
              <div className="field-value">
                {formatCurrency(selectedCustomer.marketValue)}
              </div>
            </div>
          </div>
        </section>

        <section className="metrics">
          <div className="card metric blue">
            <div className="metric-title">Total Charges</div>
            <div className="metric-value">{formatCurrency(metrics.totalCharges)}</div>
          </div>

          <div className="card metric green">
            <div className="metric-title">Amount Collected</div>
            <div className="metric-value">{formatCurrency(metrics.amountCollected)}</div>
          </div>

          <div className="card metric orange">
            <div className="metric-title">Outstanding</div>
            <div className="metric-value">{formatCurrency(metrics.outstanding)}</div>
          </div>

          <div className="card metric purple">
            <div className="metric-title">Pending Receipts</div>
            <div className="metric-value">{metrics.pendingReceipts}</div>
          </div>
        </section>

        <section className="card workspace">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === "charges" ? "active" : ""}`}
              onClick={() => setActiveTab("charges")}
            >
              Charges
            </button>

            <button
              type="button"
              className={`tab ${activeTab === "receipts" ? "active" : ""}`}
              onClick={() => setActiveTab("receipts")}
            >
              Receipts
            </button>
          </div>

          {activeTab === "charges" && (
            <div className="tab-content">
              <div className="toolbar">
                <div>
                  <h3 style={{ margin: 0 }}>Application Charges</h3>
                  <div className="muted">
                    Configure fixed, percentage-based and manual charges.
                    Schedule status: <strong>{scheduleStatus}</strong>
                  </div>
                </div>

                <div className="filters">
                  <button
                    className="btn btn-secondary"
                    disabled={!applicationId || actionLoading}
                    onClick={createDefaultSchedule}
                  >
                    Create Default Schedule
                  </button>

                  <button
                    className="btn btn-secondary"
                    disabled={!charges.length || actionLoading}
                    onClick={submitSchedule}
                  >
                    Submit Schedule
                  </button>

                  {/* <button
                    className="btn btn-secondary"
                    disabled={!charges.length || actionLoading}
                    onClick={approveSchedule}
                  >
                    Approve Schedule
                  </button> */}

                  <button
                    className="btn btn-primary"
                    disabled={!applicationId}
                    onClick={() => setChargeModalOpen(true)}
                  >
                    + Add Charge
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Charge</th>
                      <th>Calculation</th>
                      <th>Base</th>
                      <th>Tax</th>
                      <th>Total</th>
                      <th>Paid</th>
                      <th>Outstanding</th>
                      <th>Due Stage</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={10}>Loading charge schedule...</td>
                      </tr>
                    ) : visibleCharges.length ? (
                      visibleCharges.map((charge) => {
                        const outstanding = getOutstanding(charge);

                        return (
                          <tr key={charge.id}>
                            <td className="name-cell">
                              <strong>{charge.name}</strong>
                              <span>{charge.sub || "-"}</span>
                              {charge.isPreview && (
                                <span>Preview only. Save default to create.</span>
                              )}
                            </td>

                            <td>{charge.isPreview ? "Fixed default" : "Configured"}</td>

                            <td>{formatCurrency(charge.base)}</td>

                            <td>{formatCurrency(charge.gstAmount)}</td>

                            <td>
                              <strong>{formatCurrency(charge.grossAmount)}</strong>
                            </td>

                            <td>{formatCurrency(charge.paidAmount)}</td>

                            <td>
                              <strong>{formatCurrency(outstanding)}</strong>
                            </td>

                            <td>{charge.stage || "-"}</td>

                            <td>
                              <span className={getStatusBadgeClass(charge.collectionStatus)}>
                                {getStatusLabel(charge.collectionStatus)}
                              </span>
                            </td>

                            <td>
                              <div className="action-group">
                                {charge.isPreview ? (
                                  <button
                                    type="button"
                                    className="action-btn action-save"
                                    disabled={actionLoading}
                                    onClick={createDefaultSchedule}
                                  >
                                    Save Default
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      className="action-btn action-view"
                                      onClick={() =>
                                        updateCharge(charge, {
                                          base: charge.base,
                                          gstRate: charge.gstRate,
                                        })
                                      }
                                    >
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      className="action-btn action-receipt"
                                      onClick={() => openReceiptModal(charge)}
                                    >
                                      Create Receipt
                                    </button>

                                    <button
                                      type="button"
                                      className="action-btn action-waiver"
                                      onClick={() => waiveCharge(charge)}
                                    >
                                      Waiver
                                    </button>

                                    <button
                                      type="button"
                                      className="action-btn action-refund"
                                      onClick={() => refundCharge(charge)}
                                    >
                                      Refund
                                    </button>

                                    <button
                                      type="button"
                                      className="action-btn action-delete"
                                      onClick={() => deleteCharge(charge)}
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={10}>
                          No charges found. Select an application or create default
                          schedule.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="empty-info">
                Net disbursement preview:{" "}
                {formatCurrency(selectedCustomer.recommendedAmount)} sanctioned
                amount − {formatCurrency(metrics.totalCharges)} deductible charges ={" "}
                {formatCurrency(netDisbursementPreview)}.
              </div>
            </div>
          )}

          {activeTab === "receipts" && (
            <div className="tab-content">
              <div className="toolbar">
                <div>
                  <h3 style={{ margin: 0 }}>Customer Receipts</h3>
                  <div className="muted">
                    Record payments and allocate them against outstanding charges.
                  </div>
                </div>

                <div className="filters">
                  <button
                    className="btn btn-primary"
                    disabled={!charges.length}
                    onClick={() => openReceiptModal()}
                  >
                    + Add Receipt
                  </button>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Receipt No.</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Reference</th>
                      <th>Allocated To</th>
                      <th>Status</th>
                      <th>Received By</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {receiptRows.length ? (
                      receiptRows.map((receipt) => (
                        <tr key={receipt.id}>
                          <td>
                            <strong>{receipt.receiptNo || "Pending Receipt"}</strong>
                          </td>
                          <td>
                            {receipt.updatedAt
                              ? new Date(receipt.updatedAt).toLocaleDateString()
                              : "-"}
                          </td>
                          <td>
                            <strong>{formatCurrency(receipt.paidAmount)}</strong>
                          </td>
                          <td>{receipt.paymentMode || "-"}</td>
                          <td>{receipt.paymentReference || "-"}</td>
                          <td>{receipt.name}</td>
                          <td>
                            <span
                              className={
                                receipt.receiptNo
                                  ? "badge badge-verified"
                                  : "badge badge-pending"
                              }
                            >
                              {receipt.receiptNo
                                ? "Verified"
                                : "Pending Verification"}
                            </span>
                          </td>
                          <td>RM/User</td>
                          <td>
                            <div className="action-group">
                              <button className="link-btn">View</button>
                              <button className="link-btn">Download</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9}>
                          No receipts found. Use “Add Receipt” to record payment.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {chargeModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setChargeModalOpen(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>Add Application Charge</h3>
                <div className="muted">
                  Create a charge against selected application.
                </div>
              </div>

              <button
                className="close-btn"
                onClick={() => setChargeModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Charge Type</label>
                  <select
                    value={chargeForm.chargeType}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        chargeType: event.target.value,
                      }))
                    }
                  >
                    <option value="PROCESSING_FEE">PROCESSING_FEE</option>
                    <option value="LOGIN_FEE">LOGIN_FEE</option>
                    <option value="LEGAL_FEE">LEGAL_FEE</option>
                    <option value="TECHNICAL_VALUATION_FEE">
                      TECHNICAL_VALUATION_FEE
                    </option>
                    <option value="STAMP_DUTY">STAMP_DUTY</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Charge Name</label>
                  <input
                    value={chargeForm.name}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Calculation Method</label>
                  <select
                    value={chargeForm.calculationMethod}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        calculationMethod: event.target.value,
                      }))
                    }
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed</option>
                    <option value="MANUAL">Manual</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Calculation Basis</label>
                  <select
                    value={chargeForm.calculationBasis}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        calculationBasis: event.target.value,
                      }))
                    }
                  >
                    <option>Recommended Amount</option>
                    <option>Sanctioned Amount</option>
                    <option>Market Value</option>
                    <option>Distress Value</option>
                    <option>Fixed Amount</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Rate / Percentage</label>
                  <input
                    type="number"
                    value={chargeForm.rate}
                    step="0.01"
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        rate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Base Amount</label>
                  <input
                    type="number"
                    value={chargeForm.baseAmount}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        baseAmount: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input
                    type="number"
                    value={chargeForm.taxRate}
                    step="0.01"
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        taxRate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Due Stage</label>
                  <select
                    value={chargeForm.stage}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        stage: event.target.value,
                      }))
                    }
                  >
                    <option value="BEFORE_DISBURSEMENT">BEFORE_DISBURSEMENT</option>
                    <option value="BEFORE_LEGAL">BEFORE_LEGAL</option>
                    <option value="BEFORE_VALUATION">BEFORE_VALUATION</option>
                    <option value="BEFORE_SANCTION">BEFORE_SANCTION</option>
                    <option value="BEFORE_AGREEMENT">BEFORE_AGREEMENT</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Payment Treatment</label>
                  <select
                    value={chargeForm.paymentTreatment}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        paymentTreatment: event.target.value,
                      }))
                    }
                  >
                    <option value="UPFRONT">UPFRONT</option>
                    <option value="DEDUCT_FROM_DISBURSEMENT">
                      DEDUCT_FROM_DISBURSEMENT
                    </option>
                    <option value="FINANCED">FINANCED</option>
                    <option value="WAIVED">WAIVED</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={chargeForm.dueDate}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="calculation-panel">
                  <div className="calc-item">
                    <span>Charge Base</span>
                    <strong>{formatCurrency(chargeCalculation.chargeBase)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Tax Amount</span>
                    <strong>{formatCurrency(chargeCalculation.tax)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Total Charge</span>
                    <strong>{formatCurrency(chargeCalculation.total)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Outstanding</span>
                    <strong>{formatCurrency(chargeCalculation.outstanding)}</strong>
                  </div>
                </div>

                <div className="form-group full">
                  <label>Remarks</label>
                  <textarea
                    value={chargeForm.remarks}
                    onChange={(event) =>
                      setChargeForm((prev) => ({
                        ...prev,
                        remarks: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setChargeModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={createCharge}
              >
                Save Charge
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptModalOpen && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setReceiptModalOpen(false);
            }
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h3>Add Customer Receipt</h3>
                <div className="muted">
                  Record payment and allocate it to outstanding charges.
                </div>
              </div>

              <button
                className="close-btn"
                onClick={() => setReceiptModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Receipt Date</label>
                  <input
                    type="date"
                    value={receiptForm.receiptDate}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        receiptDate: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Amount Received</label>
                  <input
                    type="number"
                    value={receiptForm.amountReceived}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        amountReceived: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Payment Mode</label>
                  <select
                    value={receiptForm.paymentMode}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        paymentMode: event.target.value,
                      }))
                    }
                  >
                    <option>NEFT</option>
                    <option>RTGS</option>
                    <option>IMPS</option>
                    <option>UPI</option>
                    <option>CHEQUE</option>
                    <option>CASH</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction Reference</label>
                  <input
                    value={receiptForm.paymentReference}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        paymentReference: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Bank Name</label>
                  <input
                    value={receiptForm.bankName}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        bankName: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Payment Proof</label>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </div>

                <div className="form-group full">
                  <label>Charge Allocation</label>
                  <div className="allocation-list">
                    {outstandingCharges.length ? (
                      outstandingCharges.map((charge) => (
                        <div className="allocation-row" key={charge.id}>
                          <div>
                            <strong>{charge.name}</strong>
                            <small>
                              Outstanding {formatCurrency(getOutstanding(charge))}
                            </small>
                          </div>
                          <div>
                            <span className="field-label">Allocate</span>
                          </div>
                          <input
                            type="number"
                            value={allocation[charge.id] || ""}
                            onChange={(event) =>
                              setAllocation((prev) => ({
                                ...prev,
                                [charge.id]: event.target.value,
                              }))
                            }
                          />
                        </div>
                      ))
                    ) : (
                      <div className="allocation-row">
                        <div>
                          <strong>No outstanding charges</strong>
                          <small>All charges are cleared.</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="calculation-panel">
                  <div className="calc-item">
                    <span>Receipt Amount</span>
                    <strong>{formatCurrency(receiptCalculation.receiptAmount)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Allocated</span>
                    <strong>{formatCurrency(receiptCalculation.allocated)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Unallocated</span>
                    <strong>{formatCurrency(receiptCalculation.unallocated)}</strong>
                  </div>
                  <div className="calc-item">
                    <span>Status</span>
                    <strong>Pending Verification</strong>
                  </div>
                </div>

                <div className="form-group full">
                  <label>Remarks</label>
                  <textarea
                    value={receiptForm.remarks}
                    onChange={(event) =>
                      setReceiptForm((prev) => ({
                        ...prev,
                        remarks: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setReceiptModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={actionLoading}
                onClick={saveReceipt}
              >
                Save Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}