

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Card({ className, ...props }) {
  return (
    <div
      className={cx(
        "rounded-lg border border-border bg-background text-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}


export function CardContent({ className, ...props }) {
  return (
    <div className={cx("p-6", className)} {...props} />
  );
}

