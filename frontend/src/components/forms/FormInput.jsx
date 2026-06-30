

import { Input } from '../ui/input.jsx';

export default function FormInput({ label, ...props }) {
  return (
    <label className="grid gap-1">
      {label ? <span className="text-sm">{label}</span> : null}
      <Input {...props} />
    </label>
  );
}

