import { put, head, del } from "@vercel/blob";

export async function uploadAudio(file: File | Blob, filename: string) {
  const blob = await put(`recordings/${filename}`, file, {
    access: "public",
  });
  return blob.url;
}

export async function deleteAudio(url: string) {
  await del(url);
}

export async function getAudioMetadata(url: string) {
  return await head(url);
}
