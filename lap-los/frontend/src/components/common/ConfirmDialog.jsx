import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

export default function ConfirmDialog({ title = 'Confirm action', children, onConfirm, ...props }) {
  return <Dialog {...props}><DialogTitle>{title}</DialogTitle><DialogContent>{children}</DialogContent><DialogActions><Button onClick={props.onClose}>Cancel</Button><Button variant="contained" onClick={onConfirm}>Confirm</Button></DialogActions></Dialog>;
}
