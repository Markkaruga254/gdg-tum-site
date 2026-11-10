"use client";

import { useEffect, useState } from "react";

type Status = "checking" | "waking" | "slow" | "ready" | "unavailable";

const WAITING_MESSAGES = [
  "☕ The AI is grabbing a coffee. We're bringing the assistant back online.",
  "🚀 Warming up the engines. Great writeups deserve a little processing power.",
  "🔍 Running a quick systems check. Making sure everything is ready.",
  "🛠️ Getting the workspace ready. Your notes aren't going anywhere.",
];

export default function AIAssistantStatus({
  apiUrl,
  configured,
  onReadyChange,
}: {
  apiUrl: string;
  configured: boolean;
  onReadyChange: (ready: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>(configured ? "checking" : "unavailable");
  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!configured || !apiUrl) {
      setStatus("unavailable");
      onReadyChange(false);
      return;
    }

    let active = true;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();
    setStatus("checking");
    setElapsed(0);
    onReadyChange(false);

    const tick = setInterval(() => {
      if (active) setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    const check = async () => {
      if (!active) return;
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`${(apiUrl.endsWith("/") ? apiUrl.slice(0, -1) : apiUrl)}/healthz`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Health check failed");
        if (!active) return;
        setStatus("ready");
        onReadyChange(true);
        timeout = setTimeout(check, 10 * 60 * 1000);
      } catch {
        if (!active) return;
        onReadyChange(false);
        const seconds = Math.floor((Date.now() - startedAt) / 1000);
        setStatus(seconds >= 60 ? "slow" : "waking");
        if (seconds >= 120) {
          setStatus("unavailable");
          return;
        }
        timeout = setTimeout(check, 5000);
      } finally {
        clearTimeout(abortTimer);
      }
    };

    void check();
    return () => {
      active = false;
      clearInterval(tick);
      if (timeout) clearTimeout(timeout);
    };
  }, [apiUrl, configured, onReadyChange, retryKey]);

  useEffect(() => {
    if (status !== "waking" && status !== "checking" && status !== "slow") return;
    const rotation = setInterval(() => setMessageIndex((current) => (current + 1) % WAITING_MESSAGES.length), 7000);
    return () => clearInterval(rotation);
  }, [status]);

  if (!configured || !apiUrl) {
    return (
      <div role="status" className="mt-[12px] border-[2px] border-ink bg-yellow p-[10px] text-[11px] font-bold leading-[1.5]">
        AI features are waiting for an administrator to finish service configuration. You can keep writing and saving as usual.
      </div>
    );
  }

  const waiting = status === "checking" || status === "waking" || status === "slow";
  const message = status === "ready"
    ? "✨ We're online! Let's turn those notes into something worth sharing."
    : status === "unavailable"
      ? "🔌 Our assistant missed the meeting. The service isn't responding yet."
      : status === "slow"
        ? "🐢 Taking the scenic route today. Your writeup is safe; we're still trying."
        : WAITING_MESSAGES[messageIndex];

  return (
    <section className="mt-[12px] border-[2px] border-ink bg-white p-[12px]" aria-label="AI assistant status">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase">AI assistant status</p>
        <span role="status" aria-live="polite" className={`border-[2px] border-ink px-[7px] py-[3px] text-[9px] font-bold uppercase ${status === "ready" ? "bg-green" : status === "unavailable" ? "bg-red text-white" : "bg-yellow"}`}>
          {status === "ready" ? "Ready" : status === "unavailable" ? "Unavailable" : status === "slow" ? "Still waking" : "Waking up"}
        </span>
      </div>
      <p className="mt-[8px] text-[11px] font-bold leading-[1.5]">{message}</p>
      {waiting && (
        <p className="mt-[5px] text-[10px] leading-[1.5] text-[#555]">
          {status === "slow" ? "This is taking longer than usual." : "The service may be starting after a quiet spell."} Your writeup stays editable and safe.
        </p>
      )}
      {status !== "ready" && (
        <p aria-hidden="true" className="mt-[6px] text-[10px] font-bold tabular-nums">Time elapsed: {String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}</p>
      )}
      {status === "unavailable" && (
        <button type="button" onClick={() => { setMessageIndex(0); setRetryKey((value) => value + 1); }} className="mt-[9px] border-[2px] border-ink bg-yellow px-[10px] py-[7px] text-[10px] font-bold uppercase">
          Try again
        </button>
      )}
    </section>
  );
}
