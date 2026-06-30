import Modal from "./Modal.jsx";

export default function AppDialog({
  title,
  children,
  open = false,
  onClose,
  maxWidthClass = "max-w-lg",
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidthClass={maxWidthClass}>
      {children}
    </Modal>
  );
}

