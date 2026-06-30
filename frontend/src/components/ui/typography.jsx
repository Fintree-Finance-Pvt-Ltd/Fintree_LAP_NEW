

export function Typography({ as: As = "div", className, ...props }) {
  return <As className={className} {...props} />;
}

export function H4({ className, ...props }) {
  return (
    <h4 className={className ?? "text-2xl font-semibold tracking-tight"} {...props} />
  );
}

