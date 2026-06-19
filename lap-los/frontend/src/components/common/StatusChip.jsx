import { Chip } from '@mui/material';

export default function StatusChip({ status }) {
  const color = status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'error' : 'primary';
  return <Chip size="small" color={color} label={status} />;
}
