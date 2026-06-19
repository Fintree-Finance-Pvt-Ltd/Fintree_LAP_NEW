import { Button } from '@mui/material';
import FormInput from '../../../components/forms/FormInput.jsx';

export default function ApplicationForm({ value, onChange, onSubmit, submitLabel = 'Save application' }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value });
  return <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}><FormInput label="Customer name" value={value.customerName ?? ''} onChange={set('customerName')} required /><FormInput label="Mobile" value={value.mobile ?? ''} onChange={set('mobile')} required /><FormInput label="PAN" value={value.pan ?? ''} onChange={set('pan')} /><FormInput label="Loan amount" type="number" value={value.requestedAmount ?? ''} onChange={set('requestedAmount')} /><div className="md:col-span-2"><Button type="submit" variant="contained">{submitLabel}</Button></div></form>;
}
