import React, { useState } from "react";
import { motion } from "motion/react";
import { Edit3, Check, Plus, Minus, ArrowLeft, RotateCcw } from "lucide-react";
import { Team } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

interface ScoreCardProps {
  teams: Team[];
  gmPassword: string;
  onScoreUpdated: () => void;
  onBack: () => void;
}

export default function ScoreCard({ teams, gmPassword, onScoreUpdated, onBack }: ScoreCardProps) {
  const [customTeamId, setCustomTeamId] = useState<number | "">("");
  const [customPoints, setCustomPoints] = useState<string>("");
  const [loading, setLoading] = useState<number | null>(null); // tracks active team id loading
  const [error, setError] = useState("");

  const presets = [
    { label: "+100", value: 100, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20" },
    { label: "+50", value: 50, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20" },
    { label: "+10", value: 10, color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/20" },
    { label: "-5", value: -5, color: "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20" },
    { label: "-10", value: -10, color: "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/20" }
  ];

  const handleAdjustScore = async (targetTeamId: number, points: number, isReset?: boolean) => {
    setLoading(targetTeamId);
    setError("");
    try {
      const res = await fetch("/api/score/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTeamId,
          points,
          isReset,
          gmPassword
        })
      });

      if (res.ok) {
        onScoreUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to adjust score.");
      }
    } catch (err) {
      setError("Failed to reach server.");
    } finally {
      setLoading(null);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTeamId || !customPoints) return;
    const pts = parseInt(customPoints);
    if (isNaN(pts)) {
      setError("Please enter a valid number of points.");
      return;
    }
    handleAdjustScore(Number(customTeamId), pts);
    setCustomPoints("");
    setCustomTeamId("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F9B800]/20">
        <div className="flex items-center gap-3">
          <TexasDrumstickBadge size="sm" />
          <div>
            <h2 className="font-display font-black text-base uppercase tracking-wider text-white">Texas Score Controller</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Award challenge points, penalties & team score resets</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#14110F] border border-[#F9B800]/30 text-white hover:bg-[#BE2403] hover:border-[#F9B800] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {error && (
        <div className="text-xs font-mono font-black uppercase tracking-wider bg-[#BE2403]/30 border border-[#BE2403] p-4 text-red-200">
          ERROR: {error}
        </div>
      )}

      {/* Preset controller cards */}
      <div className="grid gap-4">
        {teams.map((team) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1C1815]/90 border border-[#F9B800]/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden shadow-md"
            style={{ borderLeftWidth: "4px", borderLeftColor: team.color }}
          >
            <div>
              <h4 className="font-display font-black text-sm uppercase tracking-widest" style={{ color: team.color }}>
                {team.name}
              </h4>
              <p className="font-mono text-xs font-black text-gray-400 mt-1 uppercase">
                Score: <span className="text-[#F9B800] font-black">{team.score} PTS</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  disabled={loading !== null}
                  onClick={() => handleAdjustScore(team.id, preset.value)}
                  className={`px-3 py-2 border rounded-none font-mono font-black text-xs transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${preset.color}`}
                >
                  {loading === team.id ? (
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin block mx-auto" />
                  ) : (
                    preset.label
                  )}
                </button>
              ))}

              {/* RESET TO 0 button */}
              <button
                disabled={loading !== null}
                onClick={() => {
                  if (confirm(`⚠️ WARNING: Are you sure you want to reset ${team.name}'s score to 0?`)) {
                    handleAdjustScore(team.id, 0, true);
                  }
                }}
                className="px-3 py-2 border border-red-500/40 bg-[#BE2403]/20 hover:bg-[#BE2403] hover:text-white text-red-400 font-mono font-black text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0 shadow"
                title="Reset team score to 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom points adjustment form */}
      <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 shadow-md">
        <span className="micro-label mb-4 block">🍗 Custom Score Adjuster</span>

        <form onSubmit={handleCustomSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={customTeamId}
            onChange={(e) => setCustomTeamId(e.target.value === "" ? "" : Number(e.target.value))}
            className="bg-[#14110F] border border-[#F9B800]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#F9B800] text-white cursor-pointer"
            required
          >
            <option value="">Select team...</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name.toUpperCase()}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Points (e.g. +75 or -35)"
            value={customPoints}
            onChange={(e) => setCustomPoints(e.target.value)}
            className="bg-[#14110F] border border-[#F9B800]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#F9B800] text-white"
            required
          />

          <button
            type="submit"
            className="bg-[#F9B800] text-[#120F0D] hover:bg-[#BE2403] hover:text-white hover:border-[#BE2403] border border-[#F9B800] font-display font-black text-xs uppercase tracking-[0.2em] px-4 py-3 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <Check className="w-4 h-4" />
            <span>Apply Score</span>
          </button>
        </form>
      </div>
    </div>
  );
}
