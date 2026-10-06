import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, AlertTriangle } from "lucide-react";
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

  useEffect(() => {
    if (!timer) {
      setSecondsLeft(0);
      return;
    }

    if (!timer.active) {
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

  if (!timer || (!timer.active && !timer.pausedRemainingSeconds && userRole !== "gm")) {
    return null;
  }

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

  const isFinished = timer.active && secondsLeft === 0;
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
    <div className="border border-[#58585a]/20 bg-[#ffffff] relative overflow-hidden">
      {/* Progress track */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#58585a]/10">
        <div
          className="h-full bg-[#5bc09f] transition-all duration-500 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center shrink-0 border border-[#5bc09f] bg-[#5bc09f]/10 text-[#5bc09f]">
            {isFinished ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Timer className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xs uppercase tracking-wider text-[#58585a]">
                {timer.label || "EVENT ROUND CLOCK"}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase text-[#5bc09f]">
                · {isFinished ? "ROUND EXPIRED" : timer.active ? "LIVE" : "PAUSED"}
              </span>
            </div>
            <p className="text-[11px] text-[#58585a]/70">
              {isFinished
                ? "Time is up. Submit all evidence immediately."
                : timer.active
                ? `Synchronized countdown (${Math.round(total / 60)}m)`
                : "Round paused by Game Master."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-mono font-bold text-xl sm:text-2xl tracking-wider px-3 py-1 bg-[#ffffff] border border-[#58585a]/25 text-[#58585a] tabular-nums">
            {formatCountdown(secondsLeft)}
          </div>

          {userRole === "gm" && (
            <div className="flex items-center gap-1.5 shrink-0">
              {timer.active ? (
                <button
                  onClick={() => handleTimerAction("pause")}
                  disabled={loading}
                  className="p-1.5 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
                  title="Pause Countdown"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleTimerAction("resume")}
                  disabled={loading}
                  className="p-1.5 bg-[#ffffff] border border-[#5bc09f] text-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors cursor-pointer"
                  title="Resume Countdown"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => handleTimerAction("extend", { addMinutes: 5 })}
                disabled={loading}
                className="px-2 py-1 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#5bc09f] hover:border-[#5bc09f] hover:text-[#ffffff] transition-colors text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
                title="Add 5 Minutes to Clock"
              >
                <Plus className="w-3 h-3" /> 5M
              </button>

              <button
                onClick={() => handleTimerAction("reset")}
                disabled={loading}
                className="p-1.5 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
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
