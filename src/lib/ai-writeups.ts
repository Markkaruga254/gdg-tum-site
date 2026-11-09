import { getAI, getGenerativeModel, GoogleAIBackend } from "firebase/ai";
import { app } from "@/lib/firebase";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/data";

export const WRITEUP_TOPIC_TAGS = [
  "cloud", "cybersecurity", "web", "mobile", "ai-ml", "data", "devops", "open-source", "careers",
] as const;

export const WRITEUP_PRODUCT_TAGS = [
  "android", "firebase", "flutter", "gemini", "chrome", "google-cloud",
] as const;

export interface GeneratedWriteupDraft {
  title: string;
  summary: string;
  body: string;
  topics: string[];
  products: string[];
}

async function requireWriteupEditor(trackId?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in with an authorised GDG TUM lead or admin account before using AI features.");
  const profile = await getUserById(user.uid);
  if (!profile || (profile.role !== "lead" && profile.role !== "admin")) {
    throw new Error("AI drafting and photo captioning are available only to authorised track leads and admins.");
  }
  if (trackId && profile.role === "lead" && profile.track !== trackId) {
    throw new Error("Your lead account cannot create AI content for a different track.");
  }
}

function ensureWriteupAppCheck() {
  if (typeof window === "undefined") {
    throw new Error("AI drafting and photo captioning must be started from the dashboard in a browser.");
  }
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (!siteKey) {
    throw new Error("AI drafting is not configured yet. Add the reCAPTCHA Enterprise site key and enable Firebase AI Logic.");
  }

  const appCheckWindow = self as typeof self & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean;
    __GDG_TUM_APPCHECK_INITIALIZED__?: boolean;
  };
  if (appCheckWindow.__GDG_TUM_APPCHECK_INITIALIZED__) return;

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG === "true"
  ) {
    // The generated debug token is printed in the browser console and must be
    // registered manually in Firebase Console > App Check > Manage debug tokens.
    appCheckWindow.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  // Initialise only when a lead invokes an AI feature, not for every site visitor.
  appCheckWindow.__GDG_TUM_APPCHECK_INITIALIZED__ = true;
}

export function isWriteupAIConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY);
}

function getWriteupModel(responseMimeType: "application/json" | "text/plain" = "application/json") {
  if (!isWriteupAIConfigured()) {
    throw new Error(
      "AI drafting is not configured yet. Register the website with Firebase App Check and add NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY before using AI features.",
    );
  }

  ensureWriteupAppCheck();
  const ai = getAI(app, { backend: new GoogleAIBackend() });
  return getGenerativeModel(ai, {
    model: process.env.NEXT_PUBLIC_FIREBASE_AI_MODEL || "gemini-3.8-flash",
    generationConfig: {
      temperature: 0.35,
      responseMimeType,
    },
  });
}

function parseJsonResponse(raw: string): unknown {
  const cleaned = raw.trim().replace(/^\u0060\u0060\u0060(?:json)?\s*/i, "").replace(/\s*\u0060\u0060\u0060$/, "");
  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("The AI response was not valid JSON. Please try again or write the article manually.");
  }
}

function stringArray(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string").map((item) => item.toLowerCase()).filter((item) => allowed.includes(item)))];
}

export async function generateWriteupDraft(input: {
  notes: string;
  eventTitle: string;
  eventDescription?: string;
  eventDate?: string;
  venue?: string;
  trackName: string;
  trackId: string;
}): Promise<GeneratedWriteupDraft> {
  ensureWriteupAppCheck();
  await requireWriteupEditor(input.trackId);
  const notes = input.notes.trim();
  if (notes.length < 40) {
    throw new Error("Add at least a few sentences of session notes before generating a draft.");
  }
  if (notes.length > 12000) {
    throw new Error("Your notes are too long for one request. Keep them under 12,000 characters.");
  }

  const prompt = `You are the editorial assistant for GDG on Campus – Technical University of Mombasa.
Create a factual, readable session recap from the supplied notes. Return one JSON object only with these keys:
"title" (string), "summary" (string, maximum 40 words), "body" (Markdown string, 500–850 words where the notes support that much detail), "topics" (array of allowed topic tags), and "products" (array of allowed product tags).

Editorial rules:
- Treat the notes as the only source of truth for what happened. Event metadata supplies context, not proof that a planned activity happened.
- Do not invent attendance, participant reactions, questions, quotations, outcomes, speaker names, demonstrations, or completed exercises.
- Do not claim every participant completed a setup step unless the notes explicitly say so.
- Do not add technical commands, version numbers, links, or product claims unless they are present in the notes or are essential, stable explanations of a concept.
- Use cautious wording where the notes are incomplete. If a detail is absent, omit it rather than guessing.
- Write in a clear, practical community voice. Avoid promotional filler and exaggerated claims.
- Use useful Markdown headings and bullets. Do not repeat the article title as a body heading.
- Keep the summary to 40 words or fewer.
- Allowed topics: ${WRITEUP_TOPIC_TAGS.join(", ")}.
- Allowed products: ${WRITEUP_PRODUCT_TAGS.join(", ")}.
- Return valid JSON. Do not wrap it in Markdown fences.

Event context:
Title: ${input.eventTitle}
Track: ${input.trackName}
Date: ${input.eventDate || "Not supplied"}
Venue: ${input.venue || "Not supplied"}
Event description (context only; not proof of delivery): ${input.eventDescription || "Not supplied"}

Session notes:
${notes}`;

  try {
    const result = await getWriteupModel().generateContent(prompt);
    const parsed = parseJsonResponse(result.response.text()) as Record<string, unknown>;
    const title = typeof parsed.title === "string" ? parsed.title.trim() : "";
    const summary = typeof parsed.summary === "string" ? parsed.summary.trim() : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
    if (!title || !summary || !body) {
      throw new Error("The AI response was missing a title, summary or article body. Please regenerate.");
    }
    const summaryWords = summary.split(/\s+/).filter(Boolean);
    if (summaryWords.length > 40) {
      throw new Error("The AI returned a summary longer than 40 words. Please regenerate or shorten it manually.");
    }
    return {
      title: title.slice(0, 140),
      summary,
      body,
      topics: stringArray(parsed.topics, WRITEUP_TOPIC_TAGS),
      products: stringArray(parsed.products, WRITEUP_PRODUCT_TAGS),
    };
  } catch (error) {
    if (error instanceof Error && /AI response|summary longer|Add at least|too long|not configured/.test(error.message)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : String(error);
    if (/app.?check|recaptcha|attestation/i.test(message)) {
      throw new Error("Firebase App Check could not verify this browser. Check the registered reCAPTCHA Enterprise site key and local debug token.");
    }
    if (/quota|429|resource exhausted/i.test(message)) {
      throw new Error("The Gemini free-tier quota is temporarily unavailable or exhausted. Try again later.");
    }
    if (/permission_denied|403/i.test(message)) {
      throw new Error("Firebase AI Logic rejected this request. Confirm that AI Logic is enabled for the Gemini Developer API and App Check is enforced for the registered web app.");
    }
    throw new Error(`AI drafting failed: ${message}`);
  }
}

function fileToGenerativePart(file: File): Promise<{ type: "inlineData"; inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The selected photo could not be read."));
    reader.onload = () => {
      const value = typeof reader.result === "string" ? reader.result : "";
      const comma = value.indexOf(",");
      if (comma < 0) {
        reject(new Error("The selected photo could not be prepared for AI captioning."));
        return;
      }
      resolve({
        type: "inlineData",
        inlineData: { data: value.slice(comma + 1), mimeType: file.type },
      });
    };
    reader.readAsDataURL(file);
  });
}

export async function generatePhotoCaption(imageUrl: string, consentConfirmed: boolean, trackId: string): Promise<string> {
  if (!consentConfirmed) throw new Error("Confirm that the people pictured have consented before requesting an AI caption.");
  ensureWriteupAppCheck();
  await requireWriteupEditor(trackId);
  let url: URL;
  try {
    url = new URL(imageUrl);
  } catch {
    throw new Error("The selected photo URL is invalid.");
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
    throw new Error("AI captions are only supported for photos stored in the GDG TUM Cloudinary media library.");
  }

  const response = await fetch(url.toString(), { mode: "cors" });
  if (!response.ok) throw new Error("The selected photo could not be loaded for captioning.");
  const blob = await response.blob();
  if (blob.size > 5 * 1024 * 1024) throw new Error("The selected photo is larger than 5 MB.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type)) {
    throw new Error("Only JPEG, PNG and WebP photos can be captioned.");
  }

  const file = new File([blob], "gdg-event-photo", { type: blob.type });
  const imagePart = await fileToGenerativePart(file);
  try {
    const result = await getWriteupModel("text/plain").generateContent([
      "Write one concise, factual accessibility caption for this GDG TUM event photo. Describe only visible activities, objects and setting. Do not identify people, infer names, ages, gender, ethnicity, health, religion or other sensitive traits, and do not guess what people are thinking. If the scene is unclear, say so briefly. Return only the caption, without quotation marks.",
      imagePart,
    ]);
    const caption = result.response.text().trim().replace(/^["']|["']$/g, "");
    if (!caption) throw new Error("The AI did not return a caption. Please try again.");
    return caption.slice(0, 300);
  } catch (error) {
    if (error instanceof Error && /AI did not return/.test(error.message)) throw error;
    const message = error instanceof Error ? error.message : String(error);
    if (/app.?check|recaptcha|attestation/i.test(message)) {
      throw new Error("Firebase App Check could not verify this browser. Check the registered reCAPTCHA Enterprise site key and local debug token.");
    }
    if (/quota|429|resource exhausted/i.test(message)) {
      throw new Error("The Gemini free-tier quota is temporarily unavailable or exhausted. Try again later.");
    }
    throw new Error(`AI photo captioning failed: ${message}`);
  }
}
