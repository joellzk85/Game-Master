import React, { useState, useEffect } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, Check } from "lucide-react";
import { EventTimer } from "../types";

interface GMTimerControlProps {
  timer?: EventTimer;
  gmPassword: string;
  onTimerUpdated: () => void;
}

export default function GMTimerControl({
  timer,
  gmPassword,
  onTimerUpdated
}: GMTimerControlProps) {
  const initialTotalSec = timer?.durationSeconds || 1800;
  const [customHours, setCustomHours] = useState<string>(
    String(Math.floor(initialTotalSec / 3600))
  );
  const [customMinutes, setCustomMinutes] = useState<string>(
    String(Math.floor((initialTotalSec % 3600) / 60))
  );
  const [customSeconds, setCustomSeconds] = useState<string>(
    String(initialTotalSec % 60)
  );
  const [label, setLabel] = useState<string>(timer?.label || "Round 1");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync local custom fields when server timer duration changes externally
  useEffect(() => {
    if (timer?.durationSeconds) {
      const total = timer.durationSeconds;
      setCustomHours(String(Math.floor(total / 3600)));
      setCustomMinutes(String(Math.floor((total % 3600) / 60)));
      setCustomSeconds(String(total % 60));
    }
    if (timer?.label) {
      setLabel(timer.label);
    }
  }, [timer?.durationSeconds, timer?.label]);

  const presets = [
    { label: "5 Min", mins: 5 },
    { label: "10 Min", mins: 10 },
    { label: "15 Min", mins: 15 },
    { label: "20 Min", mins: 20 },
    { label: "30 Min", mins: 30 },
    { label: "45 Min", mins: 45 },
    { label: "60 Min", mins: 60 },
    { label: "90 Min", mins: 90 }
  ];

  const getComputedTotalSeconds = () => {
    const h = Math.max(0, parseInt(customHours || "0", 10) || 0);
    const m = Math.max(0, parseInt(customMinutes || "0", 10) || 0);
    const s = Math.max(0, parseInt(customSeconds || "0", 10) || 0);
    return h * 3600 + m * 60 + s;
  };

  const formatSummary = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const parts: string[] = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0 || h === 0) parts.push(`${m}m`);
    if (s > 0) parts.push(`${s}s`);
    return parts.join(" ");
  };

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setErrorMsg("");
    setStatusMsg("");
    const totalSec = extra?.durationSeconds ?? getComputedTotalSeconds();

    if ((action === "start" || action === "set") && totalSec <= 0) {
      setErrorMsg("Please enter a countdown duration greater than 0 seconds.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/timer/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          action,
          durationSeconds: totalSec > 0 ? totalSec : undefined,
          label,
          ...extra
        })
      });
      if (res.ok) {
        onTimerUpdated();
        if (action === "set") {
          setStatusMsg(`Countdown time set to ${formatSummary(totalSec)}.`);
        } else if (action === "start") {
          setStatusMsg(`Countdown started for ${formatSummary(totalSec)}.`);
        } else {
          setStatusMsg(`Clock ${action} command applied.`);
        }
        setTimeout(() => setStatusMsg(""), 3500);
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to update countdown timer.");
      }
    } catch (err) {
      console.error("Timer action failed", err);
      setErrorMsg("Failed to execute clock command.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (mins: number) => {
    const totalSec = mins * 60;
    setCustomHours(String(Math.floor(totalSec / 3600)));
    setCustomMinutes(String(Math.floor((totalSec % 3600) / 60)));
    setCustomSeconds("0");
    handleAction("set", { durationSeconds: totalSec });
  };

  const isRunning = timer?.active;
  const computedSec = getComputedTotalSeconds();

  return (
    <div className="p-6 border border-[#58585a]/20 bg-[#ffffff] space-y-5">
      <div className="flex items-center justify-between border-b border-[#58585a]/15 pb-3">
        <div className="flex items-center gap-2.5">
          <Timer className="w-5 h-5 text-[#5bc09f]" />
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
              Synchronized Round Countdown Clock
            </h3>
            <p className="text-xs text-[#58585a]/70 mt-0.5">
              Set any custom countdown time synced across all teams
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono font-bold uppercase ${
            isRunning ? "text-[#5bc09f]" : "text-[#58585a]/60"
          }`}
        >
          {isRunning ? "● RUNNING" : "○ IDLE"}
        </span>
      </div>

      {statusMsg && (
        <div className="p-2.5 bg-[#5bc09f]/10 border border-[#5bc09f] text-[#58585a] text-xs font-mono font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-[#5bc09f] shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 bg-[#58585a]/10 border border-[#58585a] text-[#58585a] text-xs font-mono font-bold">
          {errorMsg}
        </div>
      )}

      {/* Round Name Input */}
      <div>
        <label className="micro-label mb-1.5">
          Round / Event Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Round 1: Crime Scene Forensics"
          className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-sm text-[#58585a] font-mono focus:outline-none focus:border-[#5bc09f]"
        />
      </div>

      {/* Custom Time Input (Hours, Minutes, Seconds) */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="micro-label">
            Custom Countdown Duration
          </label>
          <span className="text-xs font-mono font-bold text-[#5bc09f] tabular-nums">
            Total: {formatSummary(computedSec)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#58585a]/70 mb-1">
              Hours
            </label>
            <input
              type="number"
              min={0}
              max={99}
              value={customHours}
              onChange={(e) => setCustomHours(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2.5 text-sm font-mono font-bold text-[#58585a] focus:outline-none focus:border-[#5bc09f] tabular-nums"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#58585a]/70 mb-1">
              Minutes
            </label>
            <input
              type="number"
              min={0}
              max={999}
              value={customMinutes}
              onChange={(e) => setCustomMinutes(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2.5 text-sm font-mono font-bold text-[#58585a] focus:outline-none focus:border-[#5bc09f] tabular-nums"
              placeholder="30"
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono uppercase text-[#58585a]/70 mb-1">
              Seconds
            </label>
            <input
              type="number"
              min={0}
              max={59}
              value={customSeconds}
              onChange={(e) => setCustomSeconds(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2.5 text-sm font-mono font-bold text-[#58585a] focus:outline-none focus:border-[#5bc09f] tabular-nums"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div>
        <label className="micro-label mb-2">
          Quick Duration Presets
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {presets.map((p) => {
            const isSelected = computedSec === p.mins * 60;
            return (
              <button
                key={p.mins}
                type="button"
                disabled={loading}
                onClick={() => handleSelectPreset(p.mins)}
                className={`py-2 px-2 text-xs font-mono font-bold uppercase transition-colors cursor-pointer border whitespace-nowrap ${
                  isSelected
                    ? "bg-[#5bc09f] border-[#5bc09f] text-[#ffffff]"
                    : "bg-[#ffffff] border-[#58585a]/25 text-[#58585a] hover:border-[#5bc09f]"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Controls */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => handleAction("set")}
          disabled={loading || computedSec <= 0}
          className="px-4 py-3 bg-[#ffffff] hover:bg-[#58585a] text-[#58585a] hover:text-[#ffffff] border border-[#58585a]/35 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>Set Time ({formatSummary(computedSec)})</span>
        </button>

        {!isRunning ? (
          <button
            type="button"
            onClick={() => handleAction("start")}
            disabled={loading || computedSec <= 0}
            className="flex-1 py-3 px-4 bg-[#5bc09f] hover:bg-[#58585a] text-[#ffffff] border border-[#5bc09f] hover:border-[#58585a] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            <span>Start Countdown ({formatSummary(computedSec)})</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleAction("pause")}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-[#58585a] hover:bg-[#5bc09f] text-[#ffffff] border border-[#58585a] hover:border-[#5bc09f] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            <span>Pause Countdown</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => handleAction("extend", { addMinutes: 5 })}
          disabled={loading}
          className="px-3.5 py-3 bg-[#ffffff] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] border border-[#58585a]/30 hover:border-[#5bc09f] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> 5m
        </button>

        <button
          type="button"
          onClick={() => handleAction("reset")}
          disabled={loading}
          className="px-3.5 py-3 bg-[#ffffff] hover:bg-[#58585a] text-[#58585a] hover:text-[#ffffff] border border-[#58585a]/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
}
