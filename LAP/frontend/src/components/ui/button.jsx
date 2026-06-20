import React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Minimal shadcn/ui-inspired Button.
 * Uses Tailwind classes and is Radix-friendly (but does not require Radix here).
 */
export function Button({
  asChild = false,
  className,
  variant = "default",
  size = "default",
  ...props
}) {

  const base =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ring-offset-background";

  const variants = {
    default:
      "bg-primary text-primary-foreground hover:bg-primary/90",
    contained:
      "bg-primary text-primary-foreground hover:bg-primary/90",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost:
      "hover:bg-accent hover:text-accent-foreground",
    link:
      "underline-offset-4 hover:underline text-primary",
  };

  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  // Minimal `asChild` support without depending on @radix-ui/react-slot.
  if (asChild && props.children) {
    const onlyChild = React.Children.only(props.children);
    return React.cloneElement(onlyChild, {
      className: cx(base, variants[variant] || variants.default, sizes[size] || sizes.default, onlyChild.props.className, className),
      ...props,
      children: onlyChild.props.children,
    });
  }

  return (
    <button
      className={cx(base, variants[variant] || variants.default, sizes[size] || sizes.default, className)}
      {...props}
    />
  );
}


