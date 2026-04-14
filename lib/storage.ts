import { put, head, del } from "@vercel/blob";
import { logger } from "./logger";
import { monitoring } from "./monitoring";

/**
 * Upload audio to Vercel Blob with private access.
 */
export async function uploadAudio(file: File | Blob, filename: string) {
  const timer = monitoring.startTimer("storage_upload", { filename });
  try {
    const blob = await put(`recordings/${filename}`, file, {
      access: "private",
      addRandomSuffix: true,
    });
    timer.stop();
    logger.info({ url: blob.url, filename }, "Audio uploaded successfully");
    return blob.url;
  } catch (error) {
    monitoring.captureException(error, { filename, operation: "uploadAudio" });
    throw new Error(`Failed to upload audio: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export async function deleteAudio(url: string) {
  try {
    await del(url);
    logger.info({ url }, "Audio deleted successfully");
  } catch (error) {
    monitoring.captureException(error, { url, operation: "deleteAudio" });
    throw error;
  }
}

export async function getAudioMetadata(url: string) {
  try {
    return await head(url);
  } catch (error) {
    monitoring.captureException(error, { url, operation: "getAudioMetadata" });
    throw error;
  }
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
