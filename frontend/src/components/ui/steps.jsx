

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Steps({ children, className }) {
  return <ol className={cx("flex flex-wrap gap-2", className)}>{children}</ol>;
}

export function Step({ children, className }) {
  return <li className={cx("flex items-center", className)}>{children}</li>;
}

export function StepItem({
  label,
  isActive = false,
  isCompleted = false,
}) {
  return (
    <div className={cx("flex items-center gap-2 rounded-md px-3 py-1", isActive ? "bg-primary/10" : "bg-muted")}> 
      <span
        className={cx(
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
          isCompleted ? "bg-primary text-primary-foreground" : isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
        )}
      >
        {isCompleted ? "✓" : label.slice(0, 1)}
      </span>
      <span className={cx("text-xs", isActive ? "text-primary" : "text-muted-foreground")}>{label.replaceAll("_", " ")}</span>
    </div>
  );
}

