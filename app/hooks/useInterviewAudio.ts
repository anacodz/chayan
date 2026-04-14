"use client";

import { useCallback, useRef, useState } from "react";

export function useInterviewAudio() {
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const playTTS = useCallback(async (text: string) => {
    if (isTtsLoading) return;
    setIsTtsLoading(true);
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (audioPlayerRef.current) audioPlayerRef.current.pause();
      const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
      audioPlayerRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("TTS playback failed:", err);
    } finally {
      setIsTtsLoading(false);
    }
  }, [isTtsLoading]);

  return {
    isTtsLoading,
    playTTS,
  };
}
