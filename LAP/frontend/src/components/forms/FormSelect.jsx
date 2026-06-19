import { MenuItem, TextField } from '@mui/material';

export default function FormSelect({ options = [], ...props }) {
  return <TextField select fullWidth size="small" {...props}>{options.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField>;
}
