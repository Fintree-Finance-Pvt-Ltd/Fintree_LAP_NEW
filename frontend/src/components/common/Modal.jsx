import { useEffect } from "react";

export default function Modal({
  open,
  title,
  children,
  onClose,
  maxWidthClass = "max-w-lg",
}) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose?.(e);
        }}
      />

      <div
        className={`relative mx-0 mb-0 w-full overflow-y-auto rounded-t-2xl bg-white shadow-lg sm:mx-4 sm:mb-0 sm:max-h-[90dvh] sm:rounded-lg ${maxWidthClass} max-h-[92dvh]`}
      >
        {(title || title === "") && (
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5">
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
          </div>
        )}
        <div className="px-4 py-4 sm:px-5">{children}</div>
      </div>
    </div>
  );
}
