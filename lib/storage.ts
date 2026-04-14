import { put, head, del } from "@vercel/blob";

/**
 * Upload audio to Vercel Blob with private access.
 */
export async function uploadAudio(file: File | Blob, filename: string) {
  const blob = await put(`recordings/${filename}`, file, {
    access: "private",
    addRandomSuffix: true,
  });
  return blob.url;
}

export async function deleteAudio(url: string) {
  await del(url);
}

export async function getAudioMetadata(url: string) {
  return await head(url);
}

/**
 * Generates an authenticated proxy URL for private blobs.
 * Recruiters must be logged in to access the returned URL.
 */
export async function getSignedAudioUrl(url: string) {
  if (!url || !url.startsWith("http")) return url;
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname; // e.g. /recordings/xyz.webm
    
    // Return our secure proxy endpoint
    return `/api/audio${pathname}?url=${encodeURIComponent(url)}`;
  } catch (e) {
    return url;
  }
}
