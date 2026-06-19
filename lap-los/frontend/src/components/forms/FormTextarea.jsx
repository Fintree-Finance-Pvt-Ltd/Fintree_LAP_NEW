import FormInput from './FormInput.jsx';

export default function FormTextarea(props) {
  return <FormInput multiline minRows={3} {...props} />;
}
