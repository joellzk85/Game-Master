import React, { useState } from "react";
import { Timer, Play, Pause, RotateCcw, Plus } from "lucide-react";
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
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [label, setLabel] = useState<string>(timer?.label || "Round 1: Forensics");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const presets = [
    { label: "10 Min", mins: 10 },
    { label: "15 Min", mins: 15 },
    { label: "20 Min", mins: 20 },
    { label: "30 Min", mins: 30 },
    { label: "45 Min", mins: 45 },
    { label: "60 Min", mins: 60 }
  ];

  const handleAction = async (action: string, extra?: Record<string, any>) => {
    setLoading(true);
    setStatusMsg("");
    try {
      const res = await fetch("/api/timer/control", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          action,
          durationMinutes,
          label,
          ...extra
        })
      });
      if (res.ok) {
        onTimerUpdated();
        setStatusMsg(`Clock ${action} command sent.`);
        setTimeout(() => setStatusMsg(""), 3000);
      }
    } catch (err) {
      console.error("Timer action failed", err);
      setStatusMsg("Failed to execute clock command.");
    } finally {
      setLoading(false);
    }
  };

  const isRunning = timer?.active;

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
              Live broadcasted clock synced across all teams
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
        <div className="p-2.5 bg-[#5bc09f]/10 border border-[#5bc09f] text-[#58585a] text-xs font-mono font-bold">
          {statusMsg}
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

      {/* Preset Duration Buttons */}
      <div>
        <label className="micro-label mb-2">
          Select Duration Preset
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presets.map((p) => (
            <button
              key={p.mins}
              type="button"
              onClick={() => setDurationMinutes(p.mins)}
              className={`py-2 px-3 text-xs font-mono font-bold uppercase transition-colors cursor-pointer border ${
                durationMinutes === p.mins
                  ? "bg-[#5bc09f] border-[#5bc09f] text-[#ffffff]"
                  : "bg-[#ffffff] border-[#58585a]/25 text-[#58585a] hover:border-[#5bc09f]"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {!isRunning ? (
          <button
            type="button"
            onClick={() => handleAction("start")}
            disabled={loading}
            className="flex-1 py-3 bg-[#5bc09f] hover:bg-[#58585a] text-[#ffffff] border border-[#5bc09f] hover:border-[#58585a] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
            Start Countdown ({durationMinutes}m)
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleAction("pause")}
            disabled={loading}
            className="flex-1 py-3 bg-[#58585a] hover:bg-[#5bc09f] text-[#ffffff] border border-[#58585a] hover:border-[#5bc09f] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pause Countdown
          </button>
        )}

        <button
          type="button"
          onClick={() => handleAction("extend", { addMinutes: 5 })}
          disabled={loading}
          className="px-4 py-3 bg-[#ffffff] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] border border-[#58585a]/30 hover:border-[#5bc09f] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> 5 Min
        </button>

        <button
          type="button"
          onClick={() => handleAction("reset")}
          disabled={loading}
          className="px-4 py-3 bg-[#ffffff] hover:bg-[#58585a] text-[#58585a] hover:text-[#ffffff] border border-[#58585a]/30 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
}
