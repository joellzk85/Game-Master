import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, AlertTriangle, Shield } from "lucide-react";
import { EventTimer } from "../types";
import { getSyncedNow } from "../utils/time";
import { soundManager } from "../utils/audio";

interface EventTimerBannerProps {
  timer?: EventTimer;
  userRole: "gm" | "group" | null;
  gmPassword?: string;
  onTimerUpdated?: () => void;
}

export default function EventTimerBanner({
  timer,
  userRole,
  gmPassword,
  onTimerUpdated
}: EventTimerBannerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const warned5m = useRef(false);
  const warned1m = useRef(false);
  const warned0m = useRef(false);

  // Recalculate remaining seconds based on synced real-time clock
  useEffect(() => {
    if (!timer) {
      setSecondsLeft(0);
      return;
    }

    if (!timer.active) {
      // Paused or stopped
      setSecondsLeft(timer.pausedRemainingSeconds ?? timer.durationSeconds ?? 0);
      return;
    }

    const updateTimer = () => {
      if (!timer.targetEndTime) {
        setSecondsLeft(0);
        return;
      }
      const now = getSyncedNow();
      const remainingMs = timer.targetEndTime - now;
      const sec = Math.max(0, Math.ceil(remainingMs / 1000));
      setSecondsLeft(sec);

      // Warning chimes at milestones
      if (sec <= 300 && sec > 298 && !warned5m.current) {
        warned5m.current = true;
        soundManager.playNotification("alert");
      }
      if (sec <= 60 && sec > 58 && !warned1m.current) {
        warned1m.current = true;
        soundManager.playNotification("alert");
      }
      if (sec === 0 && !warned0m.current) {
        warned0m.current = true;
        soundManager.playNotification("negative");
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    return () => clearInterval(interval);
  }, [timer]);

  // Don't render banner if there is no timer configured or active
  if (!timer || (!timer.active && !timer.pausedRemainingSeconds && userRole !== "gm")) {
    return null;
  }

  // Formatting MM:SS or HH:MM:SS
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  };

  const isUrgent = timer.active && secondsLeft <= 60 && secondsLeft > 0;
  const isWarning = timer.active && secondsLeft <= 300 && secondsLeft > 60;
  const isFinished = timer.active && secondsLeft === 0;

  // Percentage for progress bar
  const total = timer.durationSeconds || 1800;
  const progressPercent = Math.min(100, Math.max(0, (secondsLeft / total) * 100));

  const handleTimerAction = async (action: string, extra?: Record<string, any>) => {
    if (!gmPassword) return;
    setLoading(true);
    try {
      const res = await fetch("/api/timer/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          action,
          ...extra
        })
      });
      if (res.ok) {
        onTimerUpdated?.();
      }
    } catch (err) {
      console.error("Timer action failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`border transition-all relative overflow-hidden shadow-lg ${
        isFinished
          ? "bg-rose-950/80 border-rose-500 animate-pulse"
          : isUrgent
          ? "bg-[#BE2403]/30 border-[#BE2403] animate-pulse"
          : isWarning
          ? "bg-[#F9B800]/15 border-[#F9B800]"
          : "bg-[#1C1815] border-[#F9B800]/30"
      }`}
    >
      {/* Progress track behind */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
        <div
          className={`h-full transition-all duration-500 ease-linear ${
            isFinished
              ? "bg-rose-500"
              : isUrgent
              ? "bg-[#BE2403]"
              : isWarning
              ? "bg-[#F9B800]"
              : "bg-emerald-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Round / Timer Label & Status */}
        <div className="flex items-center gap-2.5">
          <div
            className={`w-8 h-8 flex items-center justify-center shrink-0 border ${
              isUrgent || isFinished
                ? "bg-rose-600/30 border-rose-500 text-rose-400"
                : "bg-[#BE2403]/20 border-[#F9B800]/40 text-[#F9B800]"
            }`}
          >
            {isFinished ? (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            ) : (
              <Timer className="w-4 h-4 text-[#F9B800]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-xs uppercase tracking-wider text-white">
                {timer.label || "EVENT ROUND CLOCK"}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.2 rounded-xs font-bold uppercase ${
                  isFinished
                    ? "bg-rose-500 text-white"
                    : timer.active
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {isFinished ? "ROUND EXPIRED" : timer.active ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              {isFinished
                ? "Time is up! Submit all evidence immediately."
                : timer.active
                ? `Synchronized tournament countdown (${Math.round(total / 60)}m)`
                : "Round paused by Game Master."}
            </p>
          </div>
        </div>

        {/* Center: Large Countdown Display */}
        <div className="flex items-center gap-3">
          <div
            className={`font-mono font-black text-xl sm:text-2xl tracking-widest px-3 py-1 bg-[#14110F] border ${
              isFinished
                ? "text-rose-400 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                : isUrgent
                ? "text-[#FF4A3D] border-[#BE2403] shadow-[0_0_10px_rgba(190,36,3,0.4)]"
                : isWarning
                ? "text-[#F9B800] border-[#F9B800]/40"
                : "text-white border-[#F9B800]/20"
            }`}
          >
            {formatCountdown(secondsLeft)}
          </div>

          {/* Right: GM Quick Controls */}
          {userRole === "gm" && (
            <div className="flex items-center gap-1.5 shrink-0">
              {timer.active ? (
                <button
                  onClick={() => handleTimerAction("pause")}
                  disabled={loading}
                  className="p-1.5 bg-[#14110F] border border-amber-500/40 text-amber-400 hover:bg-amber-500 hover:text-black transition-all cursor-pointer"
                  title="Pause Countdown"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleTimerAction("resume")}
                  disabled={loading}
                  className="p-1.5 bg-[#14110F] border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
                  title="Resume Countdown"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => handleTimerAction("extend", { addMinutes: 5 })}
                disabled={loading}
                className="px-2 py-1 bg-[#14110F] border border-[#F9B800]/40 text-[#F9B800] hover:bg-[#BE2403] hover:text-white transition-all text-[10px] font-mono font-black uppercase cursor-pointer flex items-center gap-1"
                title="Add 5 Minutes to Clock"
              >
                <Plus className="w-3 h-3" /> 5M
              </button>

              <button
                onClick={() => handleTimerAction("reset")}
                disabled={loading}
                className="p-1.5 bg-[#14110F] border border-gray-600 text-gray-400 hover:text-white hover:border-white transition-all cursor-pointer"
                title="Reset Round Clock"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
