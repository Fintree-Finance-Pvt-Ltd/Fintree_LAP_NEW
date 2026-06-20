import ReactSelect from "./ReactSelect.jsx";

export default function FormSelect({
  options = [],
  value,
  onChange,
  isDisabled,
  isLoading,
  placeholder = "Select",
  isClearable = false,
  isMulti = false,
  ...props
}) {
  const reactSelectOptions = options;

  const selectedValue = (() => {
    if (isMulti) {
      const values = Array.isArray(value) ? value : [];
      return reactSelectOptions.filter((opt) => values.includes(opt.value));
    }

    return reactSelectOptions.find((opt) => opt.value === value) || null;
  })();

  return (
    <ReactSelect
      options={reactSelectOptions}
      value={selectedValue}
      onChange={(selected) => {
        if (isMulti) {
          const values = Array.isArray(selected) ? selected.map((s) => s.value) : [];
          onChange?.(values);
          return;
        }

        onChange?.(selected?.value ?? "");
      }}
      isDisabled={isDisabled}
      isLoading={isLoading}
      placeholder={placeholder}
      isClearable={isClearable}
      isMulti={isMulti}
      {...props}
    />
  );
}

