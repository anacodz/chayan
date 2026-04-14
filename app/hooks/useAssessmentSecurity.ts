"use client";

import { useEffect, useCallback } from "react";

interface SecurityOptions {
  enabled: boolean;
  onViolation: (type: string) => void;
}

export function useAssessmentSecurity({ enabled, onViolation }: SecurityOptions) {
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to enable full-screen mode:", err);
    }
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && enabled) {
      onViolation("TAB_SWITCH");
    }
  }, [enabled, onViolation]);

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Block F12
    if (e.key === "F12") {
      e.preventDefault();
      onViolation("INSPECT_ELEMENT");
    }

    // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) {
      e.preventDefault();
      onViolation("INSPECT_ELEMENT");
    }
    
    if (e.ctrlKey && e.key === "u") {
      e.preventDefault();
      onViolation("VIEW_SOURCE");
    }

    // Block Cmd+Option+I etc on Mac
    if (e.metaKey && e.altKey && (e.key === "i" || e.key === "j" || e.key === "c")) {
      e.preventDefault();
      onViolation("INSPECT_ELEMENT");
    }
  }, [enabled, onViolation]);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (enabled) {
      e.preventDefault();
      onViolation("RIGHT_CLICK");
    }
  }, [enabled, onViolation]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("contextmenu", handleContextMenu);

    // Prevent accidental navigation
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (e.returnValue = "Are you sure you want to leave? Your assessment progress will be lost.");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, handleVisibilityChange, handleKeydown, handleContextMenu]);

  return { enterFullscreen };
}
