"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseMediaRecorderOptions {
  onStop?: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
}

export function useMediaRecorder({ onStop, onError }: UseMediaRecorderOptions = {}) {
  const [status, setStatus] = useState<"idle" | "recording">("idle");
  const [waveform, setWaveform] = useState<number[]>(Array(20).fill(4));
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks.current = [];
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const recorder = new MediaRecorder(stream);
      mediaRecorder.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(audioChunks.current, { 
          type: recorder.mimeType || "audio/webm" 
        });
        if (onStop) onStop(audioBlob);
        setStatus("idle");
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };

      recorder.start();
      setStatus("recording");

      // Start waveform animation
      const tick = () => {
        if (!analyserRef.current) return;
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const bars: number[] = [];
        const sliceWidth = Math.floor(dataArray.length / 20);
        for (let i = 0; i < 20; i++) {
          let sum = 0;
          for (let j = 0; j < sliceWidth; j++) {
            sum += dataArray[i * sliceWidth + j];
          }
          bars.push(Math.max(4, (sum / sliceWidth / 255) * 40));
        }
        setWaveform(bars);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();

    } catch (err) {
      if (onError) onError("Microphone access blocked or failed.");
      setStatus("idle");
    }
  }, [onStop, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return {
    status,
    waveform,
    startRecording,
    stopRecording,
  };
}
