import { toast } from "react-toastify";

export default function AppSnackbar({ message, severity = "info" }) {
  if (message) {
    const fn =
      severity === "success"
        ? toast.success
        : severity === "error"
          ? toast.error
          : severity === "warning"
            ? toast.warning
            : toast.info;
    fn(message);
  }

  return null;
}

