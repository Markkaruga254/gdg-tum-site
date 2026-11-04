type Variant = "primary" | "outline" | "dark";
const base = "border-[3px] border-ink px-[22px] py-[14px] font-bold text-[13px] uppercase";
const variant: Record<Variant, string> = {
  primary: "bg-yellow text-ink",
  outline: "bg-white text-ink",
  dark: "bg-ink text-white",
};
export default function Button({
  children,
  variant: v = "primary",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variant[v]} ${className}`} {...props}>
      {children}
    </button>
  );
}
