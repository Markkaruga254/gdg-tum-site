import { auth } from "@/lib/auth";

type UploadPurpose = "profile" | "writeup" | "partner" | "gallery";
type UploadSignature = { cloudName: string; apiKey: string; timestamp: number; folder: string; signature: string };

async function requestService<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_WRITEUP_AI_API_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) throw new Error("Secure photo uploads are not configured. Ask an administrator to configure the media service.");
  const user = auth.currentUser;
  if (!user) throw new Error("Your session has expired. Sign in again before uploading.");
  const token = await user.getIdToken();
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "The secure media service could not complete that request.");
  return result as T;
}

export async function uploadToCloudinary(
  file: File,
  onProgress?: (n: number) => void,
  purpose: UploadPurpose = "writeup",
): Promise<{ url: string; publicId: string }> {
  const signed = await requestService<UploadSignature>("/v1/cloudinary/sign-upload", { purpose });
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", signed.apiKey);
  fd.append("timestamp", String(signed.timestamp));
  fd.append("public_id", signed.publicId);
  fd.append("signature", signed.signature);

  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      let result: Record<string, unknown> = {};
      try { result = JSON.parse(xhr.responseText) as Record<string, unknown>; } catch { /* handled below */ }
      if (xhr.status >= 200 && xhr.status < 300 && typeof result.secure_url === "string" && typeof result.public_id === "string") {
        resolve({ url: result.secure_url, publicId: result.public_id });
      } else {
        reject(new Error(typeof result.error === "object" && result.error && "message" in result.error
          ? String(result.error.message)
          : "Cloudinary could not upload this image."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading the image."));
    xhr.send(fd);
  });
}

export async function destroyGalleryPhoto(publicId: string): Promise<void> {
  await requestService("/v1/cloudinary/destroy-gallery-photo", { publicId });
}
