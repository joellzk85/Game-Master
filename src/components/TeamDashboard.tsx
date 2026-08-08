import React, { useState } from "react";
import { motion } from "motion/react";
import { Award, Camera, Trophy, Eye, EyeOff, Lock, RefreshCw, Upload, Sparkles } from "lucide-react";
import { AppState, Team } from "../types";

interface TeamDashboardProps {
  currentTeam: Team;
  state: AppState;
  onStateUpdated: () => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
}

export default function TeamDashboard({ currentTeam, state, onStateUpdated, onNavigate, onLogout }: TeamDashboardProps) {
  // Sync current team state because other GMs might have adjusted points or parameters since they logged in
  const team = state.teams.find((t) => t.id === currentTeam.id) || currentTeam;
  
  const sorted = [...state.teams].sort((a, b) => b.score - a.score);
  const rank = sorted.findIndex((t) => t.id === team.id) + 1;

  // Banner change state
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Password modification state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [updatingPw, setUpdatingPw] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const res = await fetch("/api/teams/banner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: team.id,
            password: currentTeam.password, // use the stored initial password for auth proxy
            banner: base64
          })
        });

        if (res.ok) {
          onStateUpdated();
          alert("🖼️ Team banner updated!");
        } else {
          alert("Failed to update banner.");
        }
      } catch (err) {
        alert("Banner upload network error.");
      } finally {
        setUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
  };

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
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <h2 className="font-display font-black text-sm uppercase tracking-[0.2em] text-white flex items-center gap-2">
          <span>PORTAL OVERVIEW</span>
        </h2>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-black border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Logout
        </button>
      </div>

      {/* Team Banner / Card block */}
      <div className="border border-white/15 bg-black/60 relative overflow-hidden">
        <div
          className="h-44 bg-cover bg-center relative transition-transform duration-700"
          style={{ backgroundImage: `url('${team.banner}')` }}
        >
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          
          {/* Team Name badge */}
          <div className="absolute bottom-4 left-6">
            <h3 className="font-display font-black text-2xl uppercase tracking-tight" style={{ color: team.color }}>
              {team.name}
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" style={{ color: team.color }} />
              <span>Championship Participant</span>
            </p>
          </div>

          {/* Edit Banner button */}
          <div className="absolute top-4 right-4">
            <input
              type="file"
              id="team-banner-input"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
              disabled={uploadingBanner}
            />
            <button
              onClick={() => document.getElementById("team-banner-input")?.click()}
              className="px-3.5 py-2 bg-black/80 border border-white/10 hover:border-white text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all text-white cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span>{uploadingBanner ? "Saving..." : "Change Card Art"}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Standing indicators */}
        <div className="p-6 grid grid-cols-2 gap-4 divide-x divide-white/10">
          <div className="text-center sm:text-left">
            <span className="micro-label">Championship Score</span>
            <div className="font-display font-black text-4xl mt-1 font-mono tracking-tight" style={{ color: team.color }}>
              {team.score}
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mt-0.5">Points Awarded</span>
          </div>

          <div className="text-center sm:text-left pl-4">
            <span className="micro-label">Live Rankings Stand</span>
            <div className="font-display font-black text-4xl mt-1 text-white font-mono tracking-tight">
              #{rank}
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold block mt-0.5">out of {state.teams.length} teams</span>
          </div>
        </div>
      </div>

      {/* Games Round Board */}
      <div className="border border-white/10 bg-black/30 p-6 space-y-4">
        <span className="micro-label">Approved Interactive Games</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {state.games.map((game) => {
            const isCSI = game.name.includes("C.S.I");
            const canPlay = game.open && isCSI;

            return (
              <motion.div
                key={game.id}
                whileHover={canPlay ? { y: -2 } : {}}
                onClick={() => canPlay && onNavigate("csi-game")}
                className={`p-5 border flex flex-col justify-between min-h-[140px] transition-all relative overflow-hidden ${
                  canPlay
                    ? "border-accent-gold/20 bg-accent-gold/5 hover:border-accent-gold cursor-pointer"
                    : "border-white/5 bg-black/10 text-gray-600 cursor-not-allowed"
                }`}
              >
                {/* Glowing status tag */}
                {game.open && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 bg-accent-gold/10 border border-accent-gold/20 text-accent-gold text-[9px] font-black px-2.5 py-0.5 animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-accent-gold" />
                    <span>ACTIVE</span>
                  </div>
                )}

                <div>
                  <span className="text-xl block mb-2">{isCSI ? "🔍" : "🎯"}</span>
                  <h4 className={`font-black text-xs uppercase tracking-wider ${game.open ? "text-white" : "text-gray-600"}`}>
                    {game.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 font-light">
                    {isCSI ? "Forensic photo scavenger hunt game" : "Awaiting unlock by Game Master"}
                  </p>
                </div>

                {canPlay && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-accent-gold mt-3 hover:underline">
                    Click to Play →
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Navigation Quick Links block with stark buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("leaderboard")}
          className="flex flex-col items-center justify-center p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center cursor-pointer group"
        >
          <Trophy className="w-5 h-5 text-accent-gold mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-black text-xs uppercase tracking-widest">Leaderboard</span>
          <span className="text-[9px] text-gray-500 uppercase mt-1 group-hover:text-black/50">View Standings</span>
        </button>

        <button
          onClick={() => onNavigate("camera")}
          className="flex flex-col items-center justify-center p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center cursor-pointer group"
        >
          <Camera className="w-5 h-5 text-white mb-2 group-hover:text-black group-hover:scale-110 transition-all duration-200" />
          <span className="font-black text-xs uppercase tracking-widest">Live Lens</span>
          <span className="text-[9px] text-gray-500 uppercase mt-1 group-hover:text-black/50">Browse Photos</span>
        </button>
      </div>

      {/* Change Password Block */}
      <div className="border border-white/10 bg-black/30 p-6 space-y-4">
        <span className="micro-label">Security: Update Team Password</span>

        {pwSuccess && <p className="text-xs text-emerald-400 font-bold">{pwSuccess}</p>}
        {pwError && <p className="text-xs text-red-400 font-bold">{pwError}</p>}

        <form onSubmit={handleUpdatePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Current passcode..."
            className="bg-black border border-white/15 px-4 py-3 text-sm text-white outline-none focus:border-white transition-all font-mono"
            required
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="New passcode..."
            className="bg-black border border-white/15 px-4 py-3 text-sm text-white outline-none focus:border-white transition-all font-mono"
            required
          />
          <button
            type="submit"
            disabled={updatingPw}
            className="bg-white text-black hover:bg-black hover:text-white border border-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer p-3"
          >
            {updatingPw ? "Saving..." : "Change Passcode"}
          </button>
        </form>
      </div>
    </div>
  );
}
