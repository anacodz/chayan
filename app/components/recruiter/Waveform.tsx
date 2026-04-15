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
      waveColor: "#94a3b8",
      progressColor: "#0070ff",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 3,
      barRadius: 4,
      height: 48,
      normalize: true,
      url: audioUrl,
      renderFunction: (channels, ctx) => {
        const { width, height } = ctx.canvas;
        const barWidth = 2;
        const barGap = 3;
        const barRadius = 4;
        const step = barWidth + barGap;
        const absMax = (values: Float32Array) => {
          let max = 0;
          for (const v of values) {
            if (Math.abs(v) > max) max = Math.abs(v);
          }
          return max;
        };

        ctx.clearRect(0, 0, width, height);
        ctx.beginPath();
        
        const channel = channels[0];
        const length = channel.length;
        const barCount = Math.floor(width / step);
        
        for (let i = 0; i < barCount; i++) {
          const start = Math.floor((i / barCount) * length);
          const end = Math.floor(((i + 1) / barCount) * length);
          
          let val = 0;
          if (channel instanceof Float32Array) {
            val = absMax(channel.subarray(start, end));
          } else {
            // For number[]
            const sub = (channel as number[]).slice(start, end);
            for (const v of sub) if (Math.abs(v) > val) val = Math.abs(v);
          }
          
          const barHeight = val * height;
          const x = i * step;
          const y = (height - barHeight) / 2;
          
          ctx.fillStyle = i * step < wavesurfer.getCurrentTime() / wavesurfer.getDuration() * width ? "#0070ff" : "#94a3b8";
          
          // Draw rounded rect
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barRadius);
          ctx.fill();
        }
      }
    });

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("timeupdate", (time) => setCurrentTime(time));
    wavesurfer.on("ready", (dur) => setDuration(dur));

    wavesurferRef.current = wavesurfer;

    const resizeObserver = new ResizeObserver(() => {
      if (wavesurferRef.current) {
        wavesurferRef.current.setOptions({});
      }
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
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
    <div className="flex items-center gap-4 bg-white/40 dark:bg-surface-container-low/40 backdrop-blur-md p-4 rounded-2xl border border-white/20 dark:border-outline-variant/10 shadow-sm">
      <button 
        onClick={togglePlay}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm ${isPlaying ? 'bg-primary text-white scale-95' : 'bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105'}`}
      >
        <span className="material-symbols-outlined text-[24px]">{isPlaying ? 'pause' : 'play_arrow'}</span>
      </button>
      
      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="w-full" />
      </div>
      
      <div className="text-[11px] font-bold text-on-surface-variant tabular-nums flex flex-col items-end gap-0.5 min-w-[45px]">
        <span className="text-primary">{formatTime(currentTime)}</span>
        <span className="opacity-40">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
