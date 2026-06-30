import Select from "react-select";

const defaultStyles = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "34px",
    borderColor: state.isFocused ? "#0f3d66" : provided.borderColor,
    boxShadow: state.isFocused ? "0 0 0 1px #0f3d66" : provided.boxShadow,
    borderRadius: "8px",
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 8px",
  }),
  indicatorsContainer: (provided) => ({
    ...provided,
    height: "34px",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: 4,
  }),
  clearIndicator: (provided) => ({
    ...provided,
    padding: 4,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#e8f3f8"
      : state.isFocused
        ? "#f4f7fb"
        : "white",
    color: "#0f3d66",
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: "#e8f3f8",
    borderRadius: "6px",
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: "#0f3d66",
    fontWeight: 700,
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: "#0f3d66",
    "&:hover": { backgroundColor: "#d9edf7", color: "#0f3d66" },
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#64748b",
  }),
};

export default function ReactSelect({ styles = defaultStyles, ...props }) {
  return <Select styles={styles} {...props} />;
}

