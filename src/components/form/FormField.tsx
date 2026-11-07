import React from "react";

export default function FormField({
  label,
  id,
  children,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="grid gap-[6px]">
      <label htmlFor={id} className="text-[12px] font-bold uppercase tracking-[.5px]">{label}</label>
      {children}
      {error && <p id={`${id}-error`} role="alert" className="text-[12px] font-bold uppercase text-red">{error}</p>}
    </div>
  );
}
