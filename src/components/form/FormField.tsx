import React from "react";
export default function FormField({ label, id, children, error }: { label: string; id: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="text-xs font-bold uppercase">{label}</label>
      {children}
      {error && <p className="text-xs text-red">{error}</p>}
    </div>
  );
}
