import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Users, Lock, Key, ChevronRight, ArrowLeft, Trophy } from "lucide-react";
import { Team } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

interface LoginScreenProps {
  teams: Team[];
  onLoginSuccess: (role: "gm" | "group", pass: string, teamId?: number) => void;
}

export default function LoginScreen({ teams, onLoginSuccess }: LoginScreenProps) {
  const [view, setView] = useState<"select" | "gm" | "team">("select");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: any = { role: view === "gm" ? "gm" : "group", password };
      if (view === "team") {
        if (!selectedTeamId) {
          setError("Please select your team first");
          setLoading(false);
          return;
        }
        payload.teamId = Number(selectedTeamId);
      }

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess(view === "gm" ? "gm" : "group", password, view === "team" ? Number(selectedTeamId) : undefined);
      } else {
        setError(data.error || "Login failed. Please verify credentials.");
      }
    } catch (err) {
      setError("Server connection failed. Is the API active?");
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (role: "gm" | "team") => {
    setView(role);
    setError("");
    setPassword("");
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1C1815]/95 border border-[#F9B800]/30 shadow-2xl p-8 relative overflow-hidden">
        
        {/* Subtle warm glow ornament */}
        <div className="absolute -top-32 -left-32 w-72 h-72 bg-[#BE2403]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 bg-[#F9B800]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-5">
            {/* Texas Chicken Fried Drumstick Logo Emblem */}
            <TexasDrumstickBadge size="xl" className="shadow-2xl shadow-[#BE2403]/60 ring-4 ring-[#BE2403]/50" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-[#BE2403] text-white text-[9px] font-black uppercase tracking-widest mb-2 border border-[#F9B800]/40 shadow-sm">
              <TexasDrumstickBadge size="xs" showBorder={false} />
              <span>TEXAS CHICKEN MALAYSIA</span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white uppercase leading-none">
              CHAMPIONSHIP <span className="text-[#F9B800]">PORTAL</span>
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-bold mt-2">
              BOLD FLAVOR • BIG CHALLENGE • LEGENDARY TEAMS
            </p>
          </div>

          {view === "select" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
              id="role-selection"
            >
              <button
                onClick={() => selectRole("gm")}
                className="w-full flex items-center gap-4 p-5 bg-[#14110F] hover:bg-[#25201C] border border-[#F9B800]/20 hover:border-[#F9B800] transition-all duration-300 group cursor-pointer text-left shadow-md"
                id="select-gm-btn"
              >
                <div className="w-12 h-12 bg-[#BE2403]/20 border border-[#BE2403]/40 group-hover:bg-[#BE2403] flex items-center justify-center text-[#F9B800] group-hover:text-white transition-colors shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="font-display font-black text-sm uppercase tracking-wider text-white group-hover:text-[#F9B800] transition-colors">
                    Game Master HQ
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                    Live scoring, game controls & passwords
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#F9B800] group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <button
                onClick={() => selectRole("team")}
                className="w-full flex items-center gap-4 p-5 bg-[#14110F] hover:bg-[#25201C] border border-[#F9B800]/20 hover:border-[#F9B800] transition-all duration-300 group cursor-pointer text-left shadow-md"
                id="select-team-btn"
              >
                <div className="w-12 h-12 bg-[#F9B800]/20 border border-[#F9B800]/40 group-hover:bg-[#F9B800] flex items-center justify-center text-[#F9B800] group-hover:text-[#120F0D] transition-colors shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="font-display font-black text-sm uppercase tracking-wider text-white group-hover:text-[#F9B800] transition-colors">
                    Team Participant Portal
                  </div>
                  <div className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">
                    View standing, photos & forensic CSI hunt
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#F9B800] group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </motion.div>
          )}

          {view !== "select" && (
            <motion.form
              initial={{ opacity: 0, x: view === "gm" ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLogin}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setView("select")}
                  className="p-1.5 bg-[#14110F] hover:bg-[#BE2403] border border-[#F9B800]/30 text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#F9B800]">
                  {view === "gm" ? "🍗 GM Administration Access" : "🍗 Team Player Sign-In"}
                </span>
              </div>

              {view === "team" && (
                <div className="space-y-1.5" id="team-dropdown-group">
                  <label className="micro-label">Select Your Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-[#14110F] border border-[#F9B800]/30 px-4 py-3.5 text-sm text-white outline-none focus:border-[#F9B800] transition-colors cursor-pointer font-mono"
                    required
                  >
                    <option value="">-- Choose team --</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="micro-label">
                  {view === "gm" ? "GM Security Password" : "Team Passcode"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-[#F9B800]">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder={view === "gm" ? "Enter administrative passcode..." : "Enter team passcode..."}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#14110F] border border-[#F9B800]/30 pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-[#F9B800] transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-300 font-bold bg-[#BE2403]/30 border border-[#BE2403] p-3 flex items-center gap-2"
                  id="login-error-message"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#F9B800] text-[#120F0D] hover:bg-[#BE2403] hover:text-white border border-[#F9B800] hover:border-[#BE2403] font-display font-black text-sm uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                id="submit-login-btn"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Enter Championship</span>
                  </>
                )}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}
