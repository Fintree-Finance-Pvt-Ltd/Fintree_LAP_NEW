import { useEffect } from "react";

export default function Modal({ open, title, children, onClose, maxWidthClass = "max-w-lg" }) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.(e);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.(e);
        }}
      />

      <div className={`relative w-full mx-4 rounded-lg bg-white shadow-lg ${maxWidthClass}`}>
        {(title || title === "") && (
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

