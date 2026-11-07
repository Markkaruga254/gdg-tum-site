type Variant = "outline" | "yellow" | "dark" | "disabled" | "primary";

const base = "inline-flex items-center justify-center border-[3px] border-ink px-[20px] py-[12px] text-[12px] font-bold uppercase tracking-[.5px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-blue";
const variants: Record<Variant, string> = {
  outline: "bg-white text-ink",
  yellow: "bg-yellow text-ink",
  dark: "bg-ink text-white",
  disabled: "bg-white text-ink opacity-60",
  primary: "bg-yellow text-ink",
};

export default function Button({
  children,
  variant = "yellow",
  className = "",
  disabled = false,
  ...props
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isDisabled = disabled || variant === "disabled";
  return (
    <button
      className={`${base} ${variants[variant]} ${isDisabled ? "cursor-not-allowed opacity-60" : ""} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}
