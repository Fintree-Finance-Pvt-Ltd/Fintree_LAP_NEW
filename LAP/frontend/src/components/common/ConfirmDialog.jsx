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
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700"
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="rounded-md bg-[#0f3d66] px-3 py-2 text-sm font-bold text-white"
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

