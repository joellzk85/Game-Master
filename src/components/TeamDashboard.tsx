import React, { useState } from "react";
import { motion } from "motion/react";
import { Camera, Trophy, Lock, Upload, Radio } from "lucide-react";
import { AppState, Team } from "../types";
import { formatRealTime, formatRelativeTime } from "../utils/time";
import BannerModal from "./BannerModal";

interface TeamDashboardProps {
  currentTeam: Team;
  state: AppState;
  teamPassword?: string;
  gmPassword?: string;
  onTeamPasswordUpdated?: (newPw: string) => void;
  onStateUpdated: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TeamDashboard({
  currentTeam,
  state,
  teamPassword,
  gmPassword,
  onTeamPasswordUpdated,
  onStateUpdated,
  onNavigate,
  onLogout
}: TeamDashboardProps) {
  const team = state.teams.find((t) => t.id === currentTeam.id) || currentTeam;

  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((t) => t.id === team.id) + 1;

  // Banner modal state
  const [showBannerModal, setShowBannerModal] = useState(false);

  // Password modification state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    setUpdatingPw(true);

    try {
      const res = await fetch("/api/teams/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          currentPw,
          newPw
        })
      });

      if (res.ok) {
        setPwSuccess("Password updated successfully!");
        onTeamPasswordUpdated?.(newPw.trim());
        setCurrentPw("");
        setNewPw("");
        onStateUpdated();
      } else {
        const d = await res.json();
        setPwError(d.error || "Failed to update password");
      }
    } catch (err) {
      setPwError("Network connection error");
    } finally {
      setUpdatingPw(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <h2 className="font-display font-bold text-sm uppercase tracking-widest text-[#58585a]">
          Team Portal Overview
        </h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Latest Live Dispatch Notice if present */}
      {(() => {
        const notifs = (state.notifications || []).filter(
          (n) => n.targetTeamId === "all" || n.targetTeamId === team.id
        );
        const latest = notifs[0];
        if (!latest) return null;

        const isDirect = latest.targetTeamId === team.id;
        const isScore = latest.type === "score_update";
        const points = latest.points ?? 0;

        return (
          <div
            className={`p-4 border transition-all ${
              isDirect
                ? "bg-[#5bc09f]/10 border-[#5bc09f]"
                : "bg-[#ffffff] border-[#58585a]/25"
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#5bc09f]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#58585a] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-[#5bc09f]" />
                  {isDirect ? "Direct Message for Your Team" : "Latest GM Broadcast"}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#58585a]/70">
                {formatRealTime(latest.timestamp)} · {formatRelativeTime(latest.timestamp)}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#58585a]">
                {latest.title}
              </h4>
              {isScore && points !== 0 && (
                <span className="text-xs font-mono font-bold text-[#5bc09f] tabular-nums">
                  {points > 0 ? `+${points}` : points} PTS
                </span>
              )}
            </div>

            <p className="text-xs text-[#58585a]/85 mt-1 leading-relaxed">
              {latest.message}
            </p>
          </div>
        );
      })()}

      {/* Team Banner / Card block */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] relative overflow-hidden">
        <div
          className="h-44 bg-cover bg-center relative bg-[#58585a]/10"
          style={{ backgroundImage: team.banner ? `url('${team.banner}')` : undefined }}
        >
          {/* Contrast Scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

          {/* Team Name */}
          <div className="absolute bottom-4 left-6">
            <h3 className="font-display font-bold text-2xl uppercase tracking-tight text-[#ffffff]">
              {team.name}
            </h3>
            <p className="text-xs text-[#ffffff]/85 font-medium mt-0.5">
              Registered Event Team
            </p>
          </div>

          {/* Edit Banner button */}
          <div className="absolute top-4 right-4">
            <button
              type="button"
              onClick={() => setShowBannerModal(true)}
              className="px-3.5 py-2 bg-[#ffffff] border border-[#58585a]/30 hover:border-[#5bc09f] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Change Banner</span>
            </button>
          </div>
        </div>

        {/* Dynamic Standing indicators */}
        <div className="p-6 grid grid-cols-2 gap-4 divide-x divide-[#58585a]/15">
          <div className="text-center sm:text-left">
            <span className="micro-label">Current Score</span>
            <div className="font-display font-bold text-4xl mt-1 font-mono tracking-tight text-[#5bc09f] tabular-nums">
              {team.score}
            </div>
            <span className="text-xs text-[#58585a]/70 block mt-0.5">Points Awarded</span>
          </div>

          <div className="text-center sm:text-left pl-4">
            <span className="micro-label">Live Standing</span>
            <div className="font-display font-bold text-4xl mt-1 text-[#58585a] font-mono tracking-tight tabular-nums">
              #{rank}
            </div>
            <span className="text-xs text-[#58585a]/70 block mt-0.5">
              of {state.teams.length} teams
            </span>
          </div>
        </div>
      </div>

      {/* Approved Games Round Board */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="micro-label">Approved Games</span>
          <span className="text-xs font-mono font-bold text-[#5bc09f] uppercase tracking-wider tabular-nums">
            {state.games.filter((g) => g.open).length} Active
          </span>
        </div>

        {(() => {
          const approvedGames = state.games.filter((g) => g.open);

          if (approvedGames.length === 0) {
            return (
              <div className="p-8 text-center border border-[#58585a]/15 bg-[#ffffff] space-y-2">
                <Lock className="w-7 h-7 text-[#58585a]/50 mx-auto" />
                <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                  No Games Currently Unlocked
                </h4>
                <p className="text-xs text-[#58585a]/70 max-w-sm mx-auto">
                  The Game Master has not approved any rounds yet. Stand by for live broadcast instructions.
                </p>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {approvedGames.map((game) => {
                const isCSI = game.name.includes("C.S.I");
                const canPlay = isCSI;

                return (
                  <motion.div
                    key={game.id}
                    whileHover={canPlay ? { y: -2 } : {}}
                    onClick={() => canPlay && onNavigate("csi-game")}
                    className={`p-5 border flex flex-col justify-between min-h-[130px] transition-colors relative ${
                      canPlay
                        ? "border-[#5bc09f] bg-[#5bc09f]/5 hover:bg-[#5bc09f]/10 cursor-pointer"
                        : "border-[#58585a]/20 bg-[#ffffff] text-[#58585a]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                        {game.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold uppercase text-[#5bc09f]">
                        ACTIVE
                      </span>
                    </div>

                    <p className="text-xs text-[#58585a]/75">
                      {isCSI
                        ? "Photo scavenger hunt & AI verification"
                        : "Approved by Game Master"}
                    </p>

                    {canPlay ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-[#5bc09f] mt-4 inline-block">
                        Open Challenge →
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#58585a]/70 mt-4 inline-block">
                        Unlocked for participation
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("leaderboard")}
          className="flex flex-col items-center justify-center p-6 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center cursor-pointer group"
        >
          <Trophy className="w-6 h-6 text-[#5bc09f] group-hover:text-[#ffffff] mb-2 transition-colors" />
          <span className="font-display font-bold text-xs uppercase tracking-widest">Leaderboard</span>
          <span className="text-[11px] opacity-75 mt-1">View Standings</span>
        </button>

        <button
          onClick={() => onNavigate("camera")}
          className="flex flex-col items-center justify-center p-6 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center cursor-pointer group"
        >
          <Camera className="w-6 h-6 text-[#5bc09f] group-hover:text-[#ffffff] mb-2 transition-colors" />
          <span className="font-display font-bold text-xs uppercase tracking-widest">Photo Gallery</span>
          <span className="text-[11px] opacity-75 mt-1">Browse & Capture</span>
        </button>
      </div>

      {/* Change Password Block */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <span className="micro-label">Update Team Passcode</span>

        {pwSuccess && <p className="text-xs text-[#5bc09f] font-bold">{pwSuccess}</p>}
        {pwError && <p className="text-xs text-[#58585a] font-bold">{pwError}</p>}

        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current passcode..."
            className="bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-sm text-[#58585a] outline-none focus:border-[#5bc09f] transition-colors"
            required
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New passcode..."
            className="bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-sm text-[#58585a] outline-none focus:border-[#5bc09f] transition-colors"
            required
          />
          <button
            type="submit"
            disabled={updatingPw}
            className="bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] border border-[#5bc09f] hover:border-[#58585a] font-display font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer p-3"
          >
            {updatingPw ? "Saving..." : "Update Passcode"}
          </button>
        </form>
      </div>

      {/* Banner Customizer Modal */}
      <BannerModal
        isOpen={showBannerModal}
        onClose={() => setShowBannerModal(false)}
        team={team}
        teamPassword={teamPassword}
        gmPassword={gmPassword}
        onBannerUpdated={onStateUpdated}
      />
    </div>
  );
}
