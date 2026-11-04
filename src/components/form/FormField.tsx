import React from "react";
export default function FormField({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-[.5px]">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red font-bold uppercase">{error}</p>}
    </div>
  );
}
