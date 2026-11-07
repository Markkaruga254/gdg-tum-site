"use client";

export type FilterOption = { label: string; value: string };

export default function FilterBar({
  filters,
  value,
  onChange,
  label = "Filter content",
}: {
  filters: FilterOption[];
  value: string;
  onChange: (nextValue: string) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap border-b-[3px] border-ink" role="group" aria-label={label}>
      {filters.map((filter) => {
        const active = filter.value === value;
        return (
          <button
            key={filter.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(filter.value)}
            className={`border-r-[3px] border-ink px-[16px] py-[12px] text-[12px] font-bold uppercase tracking-[.5px] ${active ? "bg-yellow" : "bg-white"}`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
