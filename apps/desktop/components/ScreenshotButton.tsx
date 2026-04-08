"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { MonitorInfo } from "@/global";

interface ScreenshotButtonProps {
  onScreenshotCaptured: (dataUrl: string) => void;
}

export default function ScreenshotButton({ onScreenshotCaptured }: ScreenshotButtonProps) {
  const [monitors, setMonitors] = useState<MonitorInfo[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPicker]);

  const handleClick = useCallback(async () => {
    if (!window.electronAPI) return;

    setIsPreparing(true);
    try {
      const available = await window.electronAPI.getMonitors();
      if (available.length === 1) {
        await captureFromMonitor(available[0].id);
      } else {
        setMonitors(available);
        setShowPicker(true);
      }
    } catch (err) {
      console.error("Failed to fetch monitors:", err);
    } finally {
      setIsPreparing(false);
    }
  }, []);

  const captureFromMonitor = useCallback(async (sourceId: string) => {
    if (!window.electronAPI) return;
    setIsCapturing(true);
    setShowPicker(false);
    try {
      const dataUrl = await window.electronAPI.captureScreenshot(sourceId);
      onScreenshotCaptured(dataUrl);
    } catch (err) {
      console.error("Screenshot capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [onScreenshotCaptured]);

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        disabled={isPreparing || isCapturing}
        className="px-3 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition font-medium shrink-0"
      >
        {isCapturing ? "Capturing..." : isPreparing ? "Preparing..." : "Screenshot"}
      </button>

      {showPicker && monitors.length > 0 && (
        <div
          ref={pickerRef}
          className="absolute bottom-full left-0 mb-2 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 shadow-xl z-50 min-w-[280px]"
        >
          <p className="text-xs text-white/40 mb-2 px-1">Select monitor</p>
          <div className="flex flex-col gap-1.5">
            {monitors.map((monitor) => (
              <button
                key={monitor.id}
                onClick={() => captureFromMonitor(monitor.id)}
                disabled={isCapturing}
                className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/10 transition text-left"
              >
                <img
                  src={monitor.thumbnail}
                  alt={monitor.name}
                  className="w-16 h-9 rounded border border-white/10 object-cover"
                />
                <span className="text-sm text-white/80">{monitor.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
