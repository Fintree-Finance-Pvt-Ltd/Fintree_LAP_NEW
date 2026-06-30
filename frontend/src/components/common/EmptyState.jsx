import { Typography } from '@mui/material';

export default function EmptyState({ title = 'No records found' }) {
  return <div className="py-10 text-center"><Typography color="text.secondary">{title}</Typography></div>;
}
