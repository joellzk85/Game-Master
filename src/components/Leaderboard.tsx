import React from "react";
import { motion } from "motion/react";
import { Trophy, Medal, ArrowLeft, Crown } from "lucide-react";
import { Team } from "../types";

interface LeaderboardProps {
  teams: Team[];
  userRole: "gm" | "group" | null;
  currentTeamId: number | null;
  onBack: () => void;
}

export default function Leaderboard({ teams, userRole, currentTeamId, onBack }: LeaderboardProps) {
  // Sort teams descending by score
  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...sorted.map((t) => t.score), 1);

  // Extract top 3 for podium
  const firstPlace = sorted[0];
  const secondPlace = sorted[1];
  const thirdPlace = sorted[2];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/15 bg-black/60 flex items-center justify-center text-white">
            <Trophy className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wider text-white">Live Standings</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Real-time Championship rankings</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-black border border-white/10 text-white hover:bg-white hover:text-black hover:border-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      {/* 3D Podium Display - Stark Blocks */}
      {sorted.length > 0 && (
        <div className="grid grid-cols-3 items-end gap-4 border border-white/10 bg-black/30 p-6 min-h-[260px] relative overflow-hidden">
          {/* Subtle backdrop watermarking */}
          <div className="absolute top-4 left-4 text-[44px] font-black tracking-tight text-white/[0.02] select-none font-display pointer-events-none">
            PODIUM
          </div>

          {/* 2nd Place */}
          {secondPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <Medal className="w-6 h-6 text-gray-300" />
              <div
                className="font-black text-[11px] uppercase tracking-wider text-center truncate w-full"
                style={{ color: secondPlace.color }}
              >
                {secondPlace.name}
              </div>
              <div className="font-mono font-black text-gray-300 text-lg">
                {secondPlace.score}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 80 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full flex items-end justify-center border border-white/10 bg-white/5"
              >
                <span className="text-[10px] font-mono font-black text-gray-500 mb-2">#02</span>
              </motion.div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* 1st Place */}
          {firstPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-2 z-10"
            >
              <Crown className="w-8 h-8 text-accent-gold animate-pulse" />
              <div
                className="font-black text-xs uppercase tracking-wider text-center truncate w-full"
                style={{ color: firstPlace.color }}
              >
                {firstPlace.name}
              </div>
              <div className="font-mono font-black text-accent-gold text-2xl">
                {firstPlace.score}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 120 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full flex items-end justify-center border border-white/20 bg-accent-gold/10"
              >
                <span className="text-[10px] font-mono font-black text-accent-gold mb-3 uppercase tracking-widest">LEADER</span>
              </motion.div>
            </motion.div>
          ) : (
            <div />
          )}

          {/* 3rd Place */}
          {thirdPlace ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-2"
            >
              <Medal className="w-5 h-5 text-amber-700" />
              <div
                className="font-black text-[11px] uppercase tracking-wider text-center truncate w-full"
                style={{ color: thirdPlace.color }}
              >
                {thirdPlace.name}
              </div>
              <div className="font-mono font-black text-gray-400 text-base">
                {thirdPlace.score}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full flex items-end justify-center border border-white/5 bg-white/[0.02]"
              >
                <span className="text-[10px] font-mono font-black text-gray-500 mb-1.5">#03</span>
              </motion.div>
            </motion.div>
          ) : (
            <div />
          )}
        </div>
      )}

      {/* Rankings List */}
      <div className="space-y-2.5">
        <span className="micro-label pl-1">Rankings Listing</span>

        {sorted.map((team, idx) => {
          const isUserTeam = userRole === "group" && team.id === currentTeamId;
          const percentage = Math.max(5, (team.score / maxScore) * 100);

          return (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`flex items-center gap-4 px-5 py-4 border transition-all duration-300 ${
                isUserTeam
                  ? "border-accent-gold bg-accent-gold/5"
                  : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-black/50"
              }`}
            >
              {/* Rank Marker */}
              <div className="w-8 shrink-0">
                <span className="font-mono text-gray-400 text-xs font-black">
                  0{idx + 1}
                </span>
              </div>

              {/* Team Identity */}
              <div className="w-1/3 shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 shrink-0"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className={`font-black text-xs uppercase tracking-wider truncate ${isUserTeam ? "text-accent-gold" : "text-white"}`}>
                    {team.name} {isUserTeam && <span className="text-[9px] border border-accent-gold/30 text-accent-gold px-1.5 py-0.5 ml-1 font-mono">YOU</span>}
                  </span>
                </div>
              </div>

              {/* Progress Visual Tracker - Square borders */}
              <div className="flex-1 bg-black border border-white/10 h-3 rounded-none relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full rounded-none"
                  style={{ backgroundColor: team.color }}
                />
              </div>

              {/* Score Tag */}
              <div className="font-mono font-black text-xs text-white w-20 text-right uppercase tracking-wider">
                {team.score} PTS
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
