import React from "react";
import { motion } from "motion/react";
import { Trophy, Medal, ArrowLeft } from "lucide-react";
import { Team } from "../types";

interface LeaderboardProps {
  teams: Team[];
  userRole: "gm" | "group" | null;
  currentTeamId: number | null;
  onBack: () => void;
}

export default function Leaderboard({ teams, userRole, currentTeamId, onBack }: LeaderboardProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sorted.map((t) => t.score), 1);

  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div>
          <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
            Live Standings
          </h2>
          <p className="text-xs text-[#58585a]/70 mt-0.5">
            Real-time team rankings
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

      {/* Podium Display */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-4 border border-[#58585a]/20 bg-[#ffffff] p-6 min-h-[240px]">
          {/* 2nd Place */}
          {secondPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Medal className="w-5 h-5 text-[#58585a]" />
              <div className="font-display font-bold text-xs uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {secondPlace.name}
              </div>
              <div className="font-mono font-bold text-[#58585a] text-base tabular-nums">
                {secondPlace.score}
              </div>
              <div className="w-full h-20 flex items-end justify-center border border-[#58585a]/25 bg-[#58585a]/5">
                <span className="text-xs font-mono font-bold text-[#58585a] mb-2">#02</span>
              </div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* 1st Place */}
          {firstPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Trophy className="w-6 h-6 text-[#5bc09f]" />
              <div className="font-display font-bold text-sm uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {firstPlace.name}
              </div>
              <div className="font-mono font-bold text-[#5bc09f] text-xl tabular-nums">
                {firstPlace.score} PTS
              </div>
              <div className="w-full h-28 flex items-end justify-center border border-[#5bc09f] bg-[#5bc09f] text-[#ffffff]">
                <span className="text-xs font-mono font-bold mb-3 uppercase tracking-widest">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex flex-col items-center gap-1.5"
            >
              <Medal className="w-5 h-5 text-[#58585a]/70" />
              <div className="font-display font-bold text-xs uppercase tracking-wider text-center truncate w-full text-[#58585a]">
                {thirdPlace.name}
              </div>
              <div className="font-mono font-bold text-[#58585a]/80 text-base tabular-nums">
                {thirdPlace.score}
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

      {/* Rankings List */}
      <div className="space-y-2.5">
        <span className="micro-label">Full Roster Standings</span>

        {sorted.map((team, idx) => {
          const isUserTeam = userRole === "group" && team.id === currentTeamId;
          const percentage = Math.max(5, (team.score / maxScore) * 100);

          return (
            <div
              key={team.id}
              className={`flex items-center gap-4 px-5 py-4 border transition-colors ${
                isUserTeam
                  ? "border-[#5bc09f] bg-[#5bc09f]/5"
                  : "border-[#58585a]/20 bg-[#ffffff]"
              }`}
            >
              {/* Rank Marker */}
              <div className="w-8 shrink-0">
                <span className="font-mono text-[#5bc09f] text-xs font-bold tabular-nums">
                  0{idx + 1}
                </span>
              </div>

              {/* Team Identity */}
              <div className="w-1/3 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 shrink-0"
                    style={{ backgroundColor: team.color || "#5bc09f" }}
                  />
                  <span className="font-display font-bold text-xs uppercase tracking-wider truncate text-[#58585a]">
                    {team.name}{" "}
                    {isUserTeam && (
                      <span className="text-[10px] text-[#5bc09f] font-mono ml-1">
                        · YOU
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="flex-1 bg-[#58585a]/10 h-2.5 relative">
                <div
                  className="h-full bg-[#5bc09f] transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Score */}
              <div className="font-mono font-bold text-xs text-[#58585a] w-20 text-right uppercase tracking-wider tabular-nums">
                {team.score} PTS
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
