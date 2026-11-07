type Color = "blue" | "red" | "green" | "yellow" | "ink" | "white";

const colors: Record<Color, string> = {
  blue: "bg-blue text-white",
  red: "bg-red text-ink",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  ink: "bg-ink text-white",
  white: "bg-white text-ink",
};

export default function Tag({
  label,
  color = "ink",
  bordered = false,
}: { label: string; color?: Color; bordered?: boolean }) {
  const needsTrackBorder = color === "yellow" && /women in tech/i.test(label);
  return (
    <span
      className={`inline-block px-[10px] py-[4px] text-[11px] font-bold uppercase ${colors[color]} ${bordered || needsTrackBorder ? "border-[3px] border-ink" : ""}`}
    >
      {label}
    </span>
  );
}
