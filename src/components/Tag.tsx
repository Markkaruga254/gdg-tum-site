type Color = "blue" | "red" | "green" | "yellow" | "ink";
const map: Record<Color, string> = {
  blue: "bg-blue text-white",
  red: "bg-red text-ink",
  green: "bg-green text-ink",
  yellow: "bg-yellow text-ink",
  ink: "bg-ink text-white",
};
export default function Tag({ label, color = "ink" }: { label: string; color?: Color }) {
  return <span className={`inline-block border-[3px] border-ink px-2 py-0.5 text-xs font-bold uppercase ${map[color]}`}>{label}</span>;
}
