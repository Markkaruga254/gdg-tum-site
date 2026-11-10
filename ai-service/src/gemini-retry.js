const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1_000;
const MAX_JITTER_MS = 250;

function upstreamStatus(error) {
  const candidate = Number(error?.status ?? error?.code);
  if (Number.isInteger(candidate) && candidate >= 400 && candidate <= 599) return candidate;
  const statusText = String(error?.status || error?.code || "").toUpperCase();
  if (statusText === "UNAVAILABLE") return 503;
  if (statusText === "RESOURCE_EXHAUSTED") return 429;
  if (statusText === "DEADLINE_EXCEEDED") return 504;
  return 0;
}

function upstreamText(error) {
  const parts = [error?.message, error?.status, error?.code];
  if (error?.errorDetails) parts.push(JSON.stringify(error.errorDetails));
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function isQuotaExhausted(error, text) {
  return /quota[_ ]?exceeded|daily quota|per.?day quota|billing.+quota/.test(text)
    || (error?.status === "RESOURCE_EXHAUSTED" || error?.code === "RESOURCE_EXHAUSTED")
      && !/rate.?limit|requests per minute|requests per second/.test(text);
}

function retryKind(error) {
  const status = upstreamStatus(error);
  const text = upstreamText(error);
  if (status === 429 && isQuotaExhausted(error, text)) return "quota";
  if (status === 503 || status === 408 || status === 500 || status === 502 || status === 504) return "transient";
  if (status === 429 && /rate.?limit|too many requests|requests per minute|requests per second/.test(text)) return "transient";
  return "permanent";
}

export async function generateWithRetry(genAI, request, {
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  random = Math.random,
  onRetry = () => {},
} = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await genAI.models.generateContent(request);
    } catch (error) {
      const kind = retryKind(error);
      if (kind !== "transient" || attempt >= MAX_RETRIES) {
        const status = upstreamStatus(error);
        if (kind === "quota") {
          const failure = new Error("Gemini's usage quota is currently exhausted. Please try again after the quota resets.");
          failure.status = 429;
          failure.code = "GEMINI_QUOTA_EXHAUSTED";
          throw failure;
        }
        if (kind === "transient") {
          const failure = new Error("Gemini is temporarily busy. Your notes are safe; please try again shortly.");
          failure.status = 503;
          failure.code = status === 429 ? "GEMINI_RATE_LIMITED" : "GEMINI_UNAVAILABLE";
          throw failure;
        }
        throw error;
      }
      const delay = BASE_DELAY_MS * (2 ** attempt) + Math.floor(random() * MAX_JITTER_MS);
      onRetry({ attempt: attempt + 1, status: upstreamStatus(error), delay });
      await sleep(delay);
    }
  }
}
