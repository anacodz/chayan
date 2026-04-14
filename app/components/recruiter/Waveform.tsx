"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";

type WaveformProps = {
  audioUrl: string;
};

export default function Waveform({ audioUrl }: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "#93a1b8",
      progressColor: "#0056b3",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 3,
      barRadius: 4,
      height: 40,
      normalize: true,
      url: audioUrl,
    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("timeupdate", (time) => setCurrentTime(time));
    wavesurfer.on("ready", (dur) => setDuration(dur));

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-4 bg-white/50 p-3 rounded-xl border border-outline-variant/10">
      <button 
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-white' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
      >
        <span className="material-symbols-outlined text-[20px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      
      <div className="flex-1 min-w-0">
        <div ref={containerRef} />
      </div>
      
      <div className="text-[10px] font-bold text-on-surface-variant tabular-nums flex flex-col items-end">
        <span>{formatTime(currentTime)}</span>
        <span className="opacity-40">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
