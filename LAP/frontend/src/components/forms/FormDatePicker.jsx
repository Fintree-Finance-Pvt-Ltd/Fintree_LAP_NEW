import FormInput from './FormInput.jsx';

export default function FormDatePicker(props) {
  return <FormInput type="date" InputLabelProps={{ shrink: true }} {...props} />;
}
