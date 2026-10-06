import React, { useState } from "react";
import { motion } from "motion/react";
import { Check, ArrowLeft, RotateCcw, Trophy, Medal } from "lucide-react";
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

  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sorted.map((t) => t.score), 1);

  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];

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
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div>
          <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
            Standings & Score Card
          </h2>
          <p className="text-xs text-[#58585a]/70 mt-0.5">
            Live team rankings, point adjustments, deductions & score resets
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

      {/* Podium Display */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-4 border border-[#58585a]/20 bg-[#ffffff] p-6 min-h-[220px]">
          {/* 2nd Place */}
          {secondPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Medal className="w-5 h-5 text-[#58585a]" />
              <div className="font-display font-bold text-xs uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {secondPlace.name}
              </div>
              <div className="font-mono font-bold text-[#58585a] text-base tabular-nums">
                {secondPlace.score} PTS
              </div>
              <div className="w-full h-18 flex items-end justify-center border border-[#58585a]/25 bg-[#58585a]/5">
                <span className="text-xs font-mono font-bold text-[#58585a] mb-2">#02</span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* 1st Place */}
          {firstPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Trophy className="w-6 h-6 text-[#5bc09f]" />
              <div className="font-display font-bold text-sm uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {firstPlace.name}
              </div>
              <div className="font-mono font-bold text-[#5bc09f] text-xl tabular-nums">
                {firstPlace.score} PTS
              </div>
              <div className="w-full h-24 flex items-end justify-center border border-[#5bc09f] bg-[#5bc09f] text-[#ffffff]">
                <span className="text-xs font-mono font-bold mb-2.5 uppercase tracking-widest">
                  #01 LEADER
                </span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* 3rd Place */}
          {thirdPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Medal className="w-5 h-5 text-[#58585a]/70" />
              <div className="font-display font-bold text-xs uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {thirdPlace.name}
              </div>
              <div className="font-mono font-bold text-[#58585a]/80 text-base tabular-nums">
                {thirdPlace.score} PTS
              </div>
              <div className="w-full h-14 flex items-end justify-center border border-[#58585a]/20 bg-[#58585a]/5">
                <span className="text-xs font-mono font-bold text-[#58585a]/80 mb-1.5">#03</span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Combined Rankings & Score Controller Rows */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="micro-label">Live Standings & Quick Score Controls</span>
          <span className="text-[11px] font-mono text-[#58585a]/70">
            Sorted by rank
          </span>
        </div>

        <div className="grid gap-3">
          {sorted.map((team, idx) => {
            const percentage = Math.max(4, (team.score / maxScore) * 100);

            return (
              <div
                key={team.id}
                className="bg-[#ffffff] border border-[#58585a]/20 p-4 sm:p-5 space-y-3"
                style={{ borderLeftWidth: "4px", borderLeftColor: team.color || "#5bc09f" }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Rank + Team Name + Score */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-[#5bc09f] tabular-nums px-2 py-1 border border-[#5bc09f]/40 bg-[#5bc09f]/10">
                      #{String(idx + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                        {team.name}
                      </h4>
                      <p className="font-mono text-xs text-[#58585a]/80 mt-0.5 uppercase tabular-nums">
                        Score: <span className="text-[#5bc09f] font-bold">{team.score} PTS</span>
                      </p>
                    </div>
                  </div>

                  {/* Quick Score Adjustment Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {presets.map((preset) => (
                      <button
                        key={preset.label}
                        disabled={loading !== null}
                        onClick={() => handleAdjustScore(team.id, preset.value)}
                        className={`px-3 py-1.5 border font-mono font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 ${
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
                      className="px-3 py-1.5 border border-[#58585a]/30 bg-[#ffffff] hover:bg-[#58585a] hover:text-[#ffffff] text-[#58585a] font-mono font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                      title="Reset team score to 0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESET</span>
                    </button>
                  </div>
                </div>

                {/* Relative Standings Bar */}
                <div className="w-full bg-[#58585a]/10 h-2 relative">
                  <div
                    className="h-full bg-[#5bc09f] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
              {sorted.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  #{idx + 1} {t.name.toUpperCase()} (CURRENT: {t.score} PTS)
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
