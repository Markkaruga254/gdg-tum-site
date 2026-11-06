type Color = "blue" | "red" | "green" | "yellow" | "ink";
const map: Record<Color, string> = {
  blue: "bg-blue text-white",
  red: "bg-red text-ink",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  ink: "bg-ink text-white",
};
export default function Tag({
  label,
  color = "ink",
  bordered = false,
}: { label: string; color?: Color; bordered?: boolean }) {
  return (
    <span
      className={`inline-block px-[10px] py-[4px] text-[11px] font-bold uppercase ${map[color]} ${
        (bordered || (color === "yellow" && /women in tech/i.test(label))) ? "border-[2px] border-ink" : ""
      }`}
    >
      {label}
    </span>
  );
}
