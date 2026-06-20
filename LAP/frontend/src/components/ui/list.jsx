

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function List({ className, ...props }) {
  return (
    <ul className={cx("divide-y divide-border", className)} {...props} />
  );
}

export function ListItem({ className, ...props }) {
  return (
    <li className={cx("py-3", className)} {...props} />
  );
}

export function ListItemText({ primary, secondary, className, ...props }) {
  return (
    <div className={cx("min-w-0", className)} {...props}>
      {primary ? <div className="text-sm font-medium">{primary}</div> : null}
      {secondary ? <div className="text-sm text-muted-foreground">{secondary}</div> : null}
    </div>
  );
}

