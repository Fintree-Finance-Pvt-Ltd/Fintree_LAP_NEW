import { Checkbox, FormControlLabel } from '@mui/material';

export default function FormCheckbox({ label, ...props }) {
  return <FormControlLabel control={<Checkbox {...props} />} label={label} />;
}
