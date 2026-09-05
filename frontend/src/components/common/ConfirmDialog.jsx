import Modal from "./Modal.jsx";

export default function ConfirmDialog({
  open = false,
  title = "Confirm action",
  children,
  onConfirm,
  onClose,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="text-sm text-slate-700">{children}</div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
        <button
          type="button"
          className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 sm:w-auto"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="w-full rounded-md bg-[#0f3d66] px-3 py-2 text-sm font-bold text-white sm:w-auto"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

