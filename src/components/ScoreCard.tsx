import React, { useState } from "react";
import { Check, ArrowLeft, RotateCcw } from "lucide-react";
import { Team } from "../types";

interface ScoreCardProps {
  teams: Team[];
  gmPassword: string;
  onScoreUpdated: () => void;
  onBack: () => void;
}

export default function ScoreCard({ teams, gmPassword, onScoreUpdated, onBack }: ScoreCardProps) {
  const [customTeamId, setCustomTeamId] = useState<number | "">("");
  const [customPoints, setCustomPoints] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [loading, setLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [lastActionNotice, setLastActionNotice] = useState<string>("");

  const presets = [
    { label: "+100", value: 100, isPositive: true },
    { label: "+50", value: 50, isPositive: true },
    { label: "+10", value: 10, isPositive: true },
    { label: "-5", value: -5, isPositive: false },
    { label: "-10", value: -10, isPositive: false }
  ];

  const handleAdjustScore = async (targetTeamId: number, points: number, isReset?: boolean, reason?: string) => {
    setLoading(targetTeamId);
    setError("");
    setLastActionNotice("");
    try {
      const res = await fetch("/api/score/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTeamId,
          points,
          isReset,
          reason,
          gmPassword
        })
      });

      if (res.ok) {
        const teamObj = teams.find((t) => t.id === targetTeamId);
        const teamName = teamObj ? teamObj.name : "Team";
        setLastActionNotice(`Score updated for ${teamName}.`);
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
    handleAdjustScore(Number(customTeamId), pts, false, customReason.trim() || undefined);
    setCustomPoints("");
    setCustomReason("");
    setCustomTeamId("");
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div>
          <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
            Score Controller
          </h2>
          <p className="text-xs text-[#58585a]/70 mt-0.5">
            Award challenge points, deductions & score resets
          </p>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] border border-[#58585a]/25 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {lastActionNotice && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#5bc09f]/10 border border-[#5bc09f] p-3.5 text-[#58585a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5bc09f]" />
            <span>{lastActionNotice}</span>
          </div>
          <span className="text-[10px] text-[#5bc09f]">Synced</span>
        </div>
      )}

      {error && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#58585a]/10 border border-[#58585a] p-4 text-[#58585a]">
          ERROR: {error}
        </div>
      )}

      {/* Preset controller cards */}
      <div className="grid gap-4">
        {teams.map((team) => (
          <div
            key={team.id}
            className="bg-[#ffffff] border border-[#58585a]/20 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{ borderLeftWidth: "4px", borderLeftColor: team.color || "#5bc09f" }}
          >
            <div>
              <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                {team.name}
              </h4>
              <p className="font-mono text-xs text-[#58585a]/80 mt-1 uppercase tabular-nums">
                Score: <span className="text-[#5bc09f] font-bold">{team.score} PTS</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  disabled={loading !== null}
                  onClick={() => handleAdjustScore(team.id, preset.value)}
                  className={`px-3 py-2 border font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ${
                    preset.isPositive
                      ? "border-[#5bc09f] bg-[#5bc09f]/10 text-[#58585a] hover:bg-[#5bc09f] hover:text-[#ffffff]"
                      : "border-[#58585a]/30 bg-[#ffffff] text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff]"
                  }`}
                >
                  {preset.label}
                </button>
              ))}

              <button
                disabled={loading !== null}
                onClick={() => handleAdjustScore(team.id, 0, true)}
                className="px-3 py-2 border border-[#58585a]/30 bg-[#ffffff] hover:bg-[#58585a] hover:text-[#ffffff] text-[#58585a] font-mono font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                title="Reset team score to 0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom points adjustment form */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="micro-label">Custom Score Adjuster</span>
          <span className="text-[11px] text-[#5bc09f] font-bold">
            Real-time notification enabled
          </span>
        </div>

        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={customTeamId}
              onChange={(e) => setCustomTeamId(e.target.value === "" ? "" : Number(e.target.value))}
              className="bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#5bc09f] text-[#58585a] cursor-pointer"
              required
            >
              <option value="">Select recipient team...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name.toUpperCase()} (CURRENT: {t.score} PTS)
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Point value (e.g. 75 or -35)"
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              className="bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#5bc09f] text-[#58585a]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Reason / Note (optional)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="sm:col-span-2 bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-xs font-sans outline-none focus:border-[#5bc09f] text-[#58585a]"
            />

            <button
              type="submit"
              className="bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] hover:border-[#58585a] border border-[#5bc09f] font-display font-bold text-xs uppercase tracking-widest px-4 py-3 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
