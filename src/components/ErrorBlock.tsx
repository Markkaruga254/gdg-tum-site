"use client";

export default function ErrorBlock({
  message,
  onRetry,
  className = "",
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={`border-[3px] border-red px-[20px] py-[18px] text-[13px] font-bold ${className}`} role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-[10px] font-bold uppercase underline underline-offset-2">
          Try again
        </button>
      )}
    </div>
  );
}
