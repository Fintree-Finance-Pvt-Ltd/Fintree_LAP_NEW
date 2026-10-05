import { useEffect, useMemo, useRef, useState } from "react";

export const getStepIcon = (id, className = "h-5 w-5") => {
  switch (id) {
    case 1:
      // User / Basic Info
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      );
    case 2:
      // Briefcase / Additional Details
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    case 3:
      // Users / Co-Applicants
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    case 4:
      // Building / Collateral Property
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      );
    case 5:
      // Document / Attachments
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      );
    case 6:
      // Shield Check / Review & Submit
      return (
        <svg
          className={className}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
      );
    default:
      return null;
  }
};

export function Section({ title, subtitle, icon, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xs space-y-5 ${className}`}
    >
      {title && (
        <div className="border-b border-slate-100 pb-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600 shadow-3xs">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  containerClassName = "",
  className = "",
  icon = null,
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700">{label}</label>
      )}
      {children ? (
        children
      ) : (
        <div className="relative w-full">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              {icon}
            </div>
          )}
          <input
            {...props}
            className={`w-full rounded-lg border border-slate-300 bg-white ${
              icon ? "pl-9" : "px-3.5"
            } py-2.5 text-sm text-slate-900 shadow-2xs outline-none transition-all placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 ${className}`}
          />
        </div>
      )}
    </div>
  );
}

export function IndianFlag({ className = "h-3.5 w-5" }) {
  return (
    <svg
      className={`inline-block overflow-hidden rounded-[2px] border border-slate-200/90 shrink-0 shadow-3xs ${className}`}
      viewBox="0 0 24 16"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Indian Flag"
    >
      {/* Top Saffron Band */}
      <rect width="24" height="5.33" fill="#FF9933" />
      {/* Middle White Band */}
      <rect y="5.33" width="24" height="5.33" fill="#FFFFFF" />
      {/* Bottom Green Band */}
      <rect y="10.66" width="24" height="5.34" fill="#138808" />
      {/* Ashoka Chakra */}
      <circle cx="12" cy="8" r="2.2" fill="none" stroke="#000080" strokeWidth="0.45" />
      <circle cx="12" cy="8" r="0.45" fill="#000080" />
      {/* 24 Spokes (8 crossed lines) */}
      <g stroke="#000080" strokeWidth="0.25" strokeLinecap="round">
        <line x1="12" y1="5.8" x2="12" y2="10.2" />
        <line x1="9.8" y1="8" x2="14.2" y2="8" />
        <line x1="10.44" y1="6.44" x2="13.56" y2="9.56" />
        <line x1="10.44" y1="9.56" x2="13.56" y2="6.44" />
        <line x1="11.16" y1="5.95" x2="12.84" y2="10.05" />
        <line x1="11.16" y1="10.05" x2="12.84" y2="5.95" />
        <line x1="9.95" y1="7.16" x2="14.05" y2="8.84" />
        <line x1="9.95" y1="8.84" x2="14.05" y2="7.16" />
      </g>
    </svg>
  );
}

export function PhoneField({
  label,
  name = "mobileNumber",
  value = "",
  onChange,
  containerClassName = "",
  className = "",
  placeholder = "Enter 10-digit number",
  required = false,
  disabled = false,
  maxLength = 10,
  actionButton = null,
  ...props
}) {
  const handleChange = (e) => {
    if (!onChange) return;
    const cleanVal = (e.target.value || "").replace(/\D/g, "").slice(0, maxLength);
    onChange({
      ...e,
      target: {
        ...(e.target || {}),
        name,
        value: cleanVal,
      },
    });
  };

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label className="text-xs font-semibold text-slate-700">
          {label}
          {required && !String(label).includes("*") && (
            <span className="text-red-600 font-bold"> *</span>
          )}
        </label>
      )}
      <div className="flex gap-2 items-stretch">
        <div
          className={`flex flex-1 items-center rounded-lg border bg-white shadow-2xs transition-all overflow-hidden ${
            disabled
              ? "border-slate-200 bg-slate-50 opacity-90 cursor-not-allowed"
              : "border-slate-300 hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
          }`}
        >
          {/* Flag & Prefix Badge */}
          <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-slate-700 select-none shrink-0">
            <IndianFlag className="h-3.5 w-5" />
            <span className="text-xs font-bold text-slate-700 tracking-tight">
              +91
            </span>
          </div>
          <input
            type="tel"
            name={name}
            value={value || ""}
            onChange={handleChange}
            maxLength={maxLength}
            inputMode="numeric"
            required={required}
            disabled={disabled}
            placeholder={placeholder}
            className={`w-full bg-transparent px-3.5 py-2 text-sm font-medium tracking-wide text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal disabled:cursor-not-allowed disabled:text-slate-500 ${className}`}
            {...props}
          />
        </div>
        {actionButton}
      </div>
    </div>
  );
}


export function Select({
  name,
  value,
  onChange,
  children,
  placeholder = "Select option",
  disabled = false,
  className = "",
  ...props
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Parse children options
  const options = useMemo(() => {
    if (!children) return [];
    const childArray = Array.isArray(children) ? children : [children];
    return childArray
      .flat(Infinity)
      .filter((child) => child && child.props)
      .map((child) => ({
        value: child.props.value,
        label:
          child.props.children ||
          child.props.label ||
          String(child.props.value),
        disabled: child.props.disabled,
      }));
  }, [children]);

  // Find currently active option
  const selectedOption = options.find(
    (opt) => String(opt.value ?? "") === String(value ?? ""),
  );
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  const handleSelect = (optionValue) => {
    if (disabled) return;
    setIsOpen(false);
    if (onChange) {
      onChange({
        target: {
          name,
          value: optionValue,
        },
      });
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-lg border bg-white px-3.5 py-2.5 text-left text-sm font-normal shadow-2xs outline-none transition-all cursor-pointer ${
          isOpen
            ? "border-blue-600 ring-2 ring-blue-100 text-slate-900 shadow-sm"
            : "border-slate-300 text-slate-800 hover:border-slate-400"
        } ${disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""} ${className}`}
        {...props}
      >
        <span
          className={`truncate ${
            !selectedOption || selectedOption.value === ""
              ? "text-slate-400 font-normal"
              : "text-slate-900 font-normal"
          }`}
        >
          {displayLabel}
        </span>
        <span
          className={`pointer-events-none ml-2 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>

      {/* Custom Styled Floating Options Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95 duration-100">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400">
              No options available
            </div>
          ) : (
            options.map((opt, index) => {
              const isSelected =
                String(opt.value ?? "") === String(value ?? "");
              return (
                <button
                  key={`${opt.value}-${index}`}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  } ${opt.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <svg
                      className="h-4 w-4 text-blue-600 shrink-0 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
