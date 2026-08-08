import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Users, Lock, Key, ChevronRight, ArrowLeft, Trophy } from "lucide-react";
import { Team } from "../types";

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
      <div className="w-full max-w-md bg-black/80 border border-white/15 overflow-hidden p-8 relative">
        
        {/* Subtle backdrop ornament */}
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/[0.01] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border border-white/20 bg-black flex items-center justify-center">
              <Trophy className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-white uppercase leading-none">
              CHAMPIONSHIP <span className="outline-heading">PORTAL</span>
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.15em] font-bold mt-2.5">
              Enter secure space to sync scores & log forensic clues
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
                className="w-full flex items-center gap-4 p-5 bg-black/40 hover:bg-white border border-white/10 hover:border-white transition-all duration-300 group cursor-pointer text-left"
                id="select-gm-btn"
              >
                <div className="w-12 h-12 bg-white/5 group-hover:bg-black/10 flex items-center justify-center text-white group-hover:text-black transition-colors border border-white/10 group-hover:border-black/20 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="font-black text-xs uppercase tracking-wider text-white group-hover:text-black transition-colors">
                    Game Master
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 group-hover:text-black/70">
                    Manage state & adjust point sets
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              <button
                onClick={() => selectRole("team")}
                className="w-full flex items-center gap-4 p-5 bg-black/40 hover:bg-white border border-white/10 hover:border-white transition-all duration-300 group cursor-pointer text-left"
                id="select-team-btn"
              >
                <div className="w-12 h-12 bg-white/5 group-hover:bg-black/10 flex items-center justify-center text-white group-hover:text-black transition-colors border border-white/10 group-hover:border-black/20 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-grow">
                  <div className="font-black text-xs uppercase tracking-wider text-white group-hover:text-black transition-colors">
                    Team Player Access
                  </div>
                  <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 group-hover:text-black/70">
                    View standing & verify clues
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" />
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
                  className="p-1.5 hover:bg-white/15 border border-white/10 text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  {view === "gm" ? "GM Security Center" : "Team Entry Portal"}
                </span>
              </div>

              {view === "team" && (
                <div className="space-y-1.5" id="team-dropdown-group">
                  <label className="micro-label">Select Your Team</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="w-full bg-black border border-white/15 px-4 py-3.5 text-sm text-white outline-none focus:border-white transition-colors cursor-pointer font-mono"
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
                  {view === "gm" ? "Admin Security Key" : "Team Entry Password"}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder={view === "gm" ? "Enter administrative passcode..." : "Enter team passcode..."}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black border border-white/15 pl-11 pr-4 py-3.5 text-sm text-white outline-none focus:border-white transition-colors font-mono"
                    required
                  />
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 font-bold bg-red-950/20 border border-red-900/30 p-3 flex items-center gap-2"
                  id="login-error-message"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-white text-black hover:bg-black hover:text-white border border-white font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                id="submit-login-btn"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Access Dashboard</span>
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
