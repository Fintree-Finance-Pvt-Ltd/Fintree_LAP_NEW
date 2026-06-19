import { Paper } from '@mui/material';

export default function AppCard({ children, className = '' }) {
  return <Paper className={`p-5 ${className}`} elevation={0}>{children}</Paper>;
}
