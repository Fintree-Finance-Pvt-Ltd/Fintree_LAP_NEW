import { Alert, Snackbar } from '@mui/material';

export default function AppSnackbar({ message, severity = 'info', ...props }) {
  return <Snackbar {...props}><Alert severity={severity}>{message}</Alert></Snackbar>;
}
