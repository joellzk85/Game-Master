import React, { useState } from "react";
import { Timer, Play, Pause, RotateCcw, Plus, Clock, Sparkles } from "lucide-react";
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
        setStatusMsg(`Clock ${action} command sent successfully!`);
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
    <div className="p-6 border border-[#F9B800]/20 bg-[#1C1815] space-y-5">
      <div className="flex items-center justify-between border-b border-[#F9B800]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <Timer className="w-5 h-5 text-[#F9B800]" />
          <div>
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
              Synchronized Round Countdown Clock
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              Live broadcasted tournament clock synced to real time across all teams
            </p>
          </div>
        </div>

        <span
          className={`text-[10px] font-mono px-2 py-0.5 font-black uppercase border ${
            isRunning
              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse"
              : "bg-gray-800 text-gray-400 border-gray-700"
          }`}
        >
          {isRunning ? "● CLOCK RUNNING" : "CLOCK IDLE"}
        </span>
      </div>

      {statusMsg && (
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
          {statusMsg}
        </div>
      )}

      {/* Round Name Input */}
      <div>
        <label className="block text-[10px] uppercase font-black tracking-widest text-[#F9B800] mb-1.5">
          Round / Event Name
        </label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Round 1: Crime Scene Forensics"
          className="w-full bg-[#14110F] border border-[#F9B800]/30 px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#F9B800]"
        />
      </div>

      {/* Preset Duration Buttons */}
      <div>
        <label className="block text-[10px] uppercase font-black tracking-widest text-gray-400 mb-2">
          Select Duration Preset
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {presets.map((p) => (
            <button
              key={p.mins}
              type="button"
              onClick={() => setDurationMinutes(p.mins)}
              className={`py-2 px-3 text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                durationMinutes === p.mins
                  ? "bg-[#BE2403] border-[#F9B800] text-white shadow-sm"
                  : "bg-[#14110F] border-white/10 text-gray-300 hover:border-white/40"
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
            className="flex-1 py-3 bg-[#BE2403] hover:bg-[#8F1A02] text-white border border-[#F9B800] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-white" />
            Start Synchronized Countdown ({durationMinutes}m)
          </button>
        ) : (
          <button
            type="button"
            onClick={() => handleAction("pause")}
            disabled={loading}
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white border border-amber-400 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Pause className="w-4 h-4" />
            Pause Countdown
          </button>
        )}

        <button
          type="button"
          onClick={() => handleAction("extend", { addMinutes: 5 })}
          disabled={loading}
          className="px-4 py-3 bg-[#14110F] hover:bg-[#BE2403] text-[#F9B800] hover:text-white border border-[#F9B800]/40 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> 5 Min
        </button>

        <button
          type="button"
          onClick={() => handleAction("reset")}
          disabled={loading}
          className="px-4 py-3 bg-[#14110F] hover:bg-gray-800 text-gray-400 hover:text-white border border-gray-700 text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> Reset
        </button>
      </div>
    </div>
  );
}
