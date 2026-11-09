export async function uploadToCloudinary(file: File, onProgress?: (n: number) => void): Promise<{ url: string; publicId: string }> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  if (!cloud || !preset) {
    throw new Error("Photo uploads are not configured. Add the Cloudinary cloud name and unsigned upload preset to the site build environment.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Only JPEG, PNG and WebP images are allowed.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File too large (maximum 5 MB).");
  }

  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud}/image/upload`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const result = JSON.parse(xhr.responseText);
          if (!result.secure_url || !result.public_id) {
            reject(new Error("Cloudinary did not return a secure image URL."));
            return;
          }
          resolve({ url: result.secure_url, publicId: result.public_id });
        } catch {
          reject(new Error("Cloudinary returned an unreadable upload response."));
        }
      } else {
        let message = "Cloudinary upload failed. Check the upload preset and try again.";
        try {
          const payload = JSON.parse(xhr.responseText);
          message = payload.error?.message || message;
        } catch {
          // Keep the safe fallback instead of exposing an unparsed HTML response.
        }
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Network error while uploading to Cloudinary."));
    xhr.onabort = () => reject(new Error("Cloudinary upload was cancelled."));
    xhr.send(fd);
  });
}
