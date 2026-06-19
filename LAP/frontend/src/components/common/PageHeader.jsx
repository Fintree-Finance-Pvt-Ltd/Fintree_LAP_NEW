import { Typography } from '@mui/material';

export default function PageHeader({ title, subtitle, actions }) {
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><Typography variant="h4">{title}</Typography>{subtitle && <Typography color="text.secondary">{subtitle}</Typography>}</div>{actions}</div>;
}
