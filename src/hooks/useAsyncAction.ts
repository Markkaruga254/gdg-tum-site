/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  async function run(fn: () => Promise<void>, successMsg?: string) {
    setLoading(true); setError(null); setSuccess(null);
    try { await fn(); if (successMsg) setSuccess(successMsg); }
    catch (e: unknown) { setError((e as any)?.message || "Something went wrong"); }
    finally { setLoading(false); }
  }
  return { loading, error, success, setError, setSuccess, run };
}
