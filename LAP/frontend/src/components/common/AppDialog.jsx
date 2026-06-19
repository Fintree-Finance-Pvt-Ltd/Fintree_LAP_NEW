import { Dialog, DialogContent, DialogTitle } from '@mui/material';

export default function AppDialog({ title, children, ...props }) {
  return <Dialog fullWidth maxWidth="sm" {...props}><DialogTitle>{title}</DialogTitle><DialogContent>{children}</DialogContent></Dialog>;
}
