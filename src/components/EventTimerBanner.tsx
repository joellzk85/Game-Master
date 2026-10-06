import React, { useState, useEffect, useRef } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, AlertTriangle, SlidersHorizontal, Check, X } from "lucide-react";
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
  const [showCustomEditor, setShowCustomEditor] = useState(false);
  const [customMins, setCustomMins] = useState<string>("30");
  const [customSecs, setCustomSecs] = useState<string>("0");
  const [customLabel, setCustomLabel] = useState<string>(timer?.label || "Round 1");

  const warned5m = useRef(false);
  const warned1m = useRef(false);
  const warned0m = useRef(false);

  useEffect(() => {
    if (timer?.durationSeconds) {
      setCustomMins(String(Math.floor(timer.durationSeconds / 60)));
      setCustomSecs(String(timer.durationSeconds % 60));
    }
    if (timer?.label) {
      setCustomLabel(timer.label);
    }
  }, [timer?.durationSeconds, timer?.label]);

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

  const handleApplyCustomTime = async (startImmediately: boolean) => {
    const m = Math.max(0, parseInt(customMins || "0", 10) || 0);
    const s = Math.max(0, parseInt(customSecs || "0", 10) || 0);
    const totalSec = m * 60 + s;
    if (totalSec <= 0) return;

    await handleTimerAction(startImmediately ? "start" : "set", {
      durationSeconds: totalSec,
      label: customLabel.trim() || timer.label || "Round 1"
    });
    setShowCustomEditor(false);
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
                ? `Synchronized countdown (${Math.floor(total / 60)}m${total % 60 ? ` ${total % 60}s` : ""})`
                : `Configured duration: ${Math.floor(total / 60)}m${total % 60 ? ` ${total % 60}s` : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
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
                  title="Start / Resume Countdown"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                onClick={() => setShowCustomEditor(!showCustomEditor)}
                disabled={loading}
                className={`px-2.5 py-1.5 border text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                  showCustomEditor
                    ? "bg-[#5bc09f] border-[#5bc09f] text-[#ffffff]"
                    : "bg-[#ffffff] border-[#58585a]/30 text-[#58585a] hover:border-[#5bc09f]"
                }`}
                title="Custom Set Countdown Time"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>Set Time</span>
              </button>

              <button
                onClick={() => handleTimerAction("extend", { addMinutes: 5 })}
                disabled={loading}
                className="px-2 py-1.5 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#5bc09f] hover:border-[#5bc09f] hover:text-[#ffffff] transition-colors text-[10px] font-mono font-bold uppercase cursor-pointer flex items-center gap-1"
                title="Add 5 Minutes to Clock"
              >
                <Plus className="w-3 h-3" /> 5M
              </button>

              <button
                onClick={() => handleTimerAction("reset")}
                disabled={loading}
                className="p-1.5 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
                title="Reset to Configured Duration"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline Custom Time Setter for Game Master */}
      {userRole === "gm" && showCustomEditor && (
        <div className="px-4 py-3 border-t border-[#58585a]/15 bg-[#58585a]/[0.03] flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap items-end gap-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#58585a] mb-1">
                Round Label
              </label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                className="w-36 sm:w-44 bg-[#ffffff] border border-[#58585a]/30 px-2.5 py-1.5 text-xs font-mono text-[#58585a] focus:outline-none focus:border-[#5bc09f]"
                placeholder="Round 1"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#58585a] mb-1">
                Minutes
              </label>
              <input
                type="number"
                min={0}
                max={999}
                value={customMins}
                onChange={(e) => setCustomMins(e.target.value)}
                className="w-20 bg-[#ffffff] border border-[#58585a]/30 px-2.5 py-1.5 text-xs font-mono font-bold text-[#58585a] focus:outline-none focus:border-[#5bc09f] tabular-nums"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#58585a] mb-1">
                Seconds
              </label>
              <input
                type="number"
                min={0}
                max={59}
                value={customSecs}
                onChange={(e) => setCustomSecs(e.target.value)}
                className="w-20 bg-[#ffffff] border border-[#58585a]/30 px-2.5 py-1.5 text-xs font-mono font-bold text-[#58585a] focus:outline-none focus:border-[#5bc09f] tabular-nums"
              />
            </div>

            {/* Quick inline presets */}
            <div className="flex items-center gap-1">
              {[5, 10, 15, 20, 45, 60].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setCustomMins(String(m));
                    setCustomSecs("0");
                  }}
                  className="px-2 py-1.5 bg-[#ffffff] border border-[#58585a]/25 hover:border-[#5bc09f] text-[10px] font-mono font-bold text-[#58585a] cursor-pointer"
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleApplyCustomTime(false)}
              className="px-3 py-1.5 bg-[#ffffff] border border-[#58585a]/35 hover:bg-[#58585a] text-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Set Only</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleApplyCustomTime(true)}
              className="px-3.5 py-1.5 bg-[#5bc09f] border border-[#5bc09f] hover:bg-[#58585a] hover:border-[#58585a] text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Set & Start</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCustomEditor(false)}
              className="p-1.5 text-[#58585a]/70 hover:text-[#58585a] cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
