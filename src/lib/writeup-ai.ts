import { auth } from "@/lib/auth";

type DraftResult = {
  title: string;
  summary: string;
  body: string;
  topicTags: string[];
  productTags: string[];
};

type CaptionSuggestion = {
  mediaId: string;
  caption: string;
  altText: string;
};

async function postAiRequest<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_WRITEUP_AI_API_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) throw new Error("The AI writing service has not been configured yet. Ask an administrator to finish the AI service setup.");
  const user = auth.currentUser;
  if (!user) throw new Error("Your session has expired. Sign in again to use AI features.");
  const token = await user.getIdToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = typeof result.code === "string" ? result.code : "";
    if (code === "GEMINI_UNAVAILABLE") {
      throw new Error("Gemini is temporarily busy. Your notes and edits are safe. Please try again shortly.");
    }
    if (code === "GEMINI_RATE_LIMITED") {
      throw new Error("Gemini is receiving too many requests right now. Your notes and edits are safe; please try again shortly.");
    }
    if (code === "GEMINI_QUOTA_EXHAUSTED") {
      throw new Error("The AI service has reached its Gemini usage quota. Your notes and edits are safe; please try again after the quota resets.");
    }
    throw new Error(typeof result.error === "string" ? result.error : "The AI service could not complete that request.");
  }
  return result as T;
}

export async function generateWriteupDraft(input: {
  eventId: string;
  writeupId?: string;
  notes: string;
}): Promise<DraftResult> {
  const result = await postAiRequest<{ draft: DraftResult }>("/v1/writeups/draft", input);
  return result.draft;
}

export async function generatePhotoCaptions(input: {
  writeupId: string;
  mediaIds: string[];
  consentConfirmed: true;
}): Promise<CaptionSuggestion[]> {
  const result = await postAiRequest<{ captions: CaptionSuggestion[] }>("/v1/media/captions", input);
  return result.captions;
}
