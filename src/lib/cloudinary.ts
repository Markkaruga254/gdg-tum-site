export async function uploadToCloudinary(file: File, onProgress?: (n: number) => void): Promise<{ url: string; publicId: string }> {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  const xhr = new XMLHttpRequest();
  return new Promise((resolve, reject) => {
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud}/image/upload`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const j = JSON.parse(xhr.responseText);
        resolve({ url: j.secure_url, publicId: j.public_id });
      } else reject(new Error(xhr.responseText));
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(fd);
  });
}
