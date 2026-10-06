import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, Users, Lock, Key, ChevronRight, ArrowLeft } from "lucide-react";
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
        onLoginSuccess(
          view === "gm" ? "gm" : "group",
          password,
          view === "team" ? Number(selectedTeamId) : undefined
        );
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
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#ffffff] border border-[#58585a]/25 p-8">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#5bc09f] block mb-2">
            Event Access
          </span>
          <h1 className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-[#58585a] uppercase">
            Team Portal
          </h1>
          <p className="text-xs text-[#58585a]/75 mt-2">
            Select your access role to continue
          </p>
        </div>

        {view === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
            id="role-selection"
          >
            <button
              onClick={() => selectRole("gm")}
              className="w-full flex items-center gap-4 p-5 bg-[#ffffff] hover:bg-[#5bc09f]/5 border border-[#58585a]/20 hover:border-[#5bc09f] transition-colors group cursor-pointer text-left"
              id="select-gm-btn"
            >
              <div className="w-11 h-11 bg-[#5bc09f]/10 border border-[#5bc09f]/40 group-hover:bg-[#5bc09f] flex items-center justify-center text-[#5bc09f] group-hover:text-[#ffffff] transition-colors shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <div className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                  Game Master Console
                </div>
                <div className="text-xs text-[#58585a]/70 mt-0.5">
                  Live scoring, game controls & team management
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#58585a]/60 group-hover:text-[#5bc09f] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>

            <button
              onClick={() => selectRole("team")}
              className="w-full flex items-center gap-4 p-5 bg-[#ffffff] hover:bg-[#5bc09f]/5 border border-[#58585a]/20 hover:border-[#5bc09f] transition-colors group cursor-pointer text-left"
              id="select-team-btn"
            >
              <div className="w-11 h-11 bg-[#5bc09f]/10 border border-[#5bc09f]/40 group-hover:bg-[#5bc09f] flex items-center justify-center text-[#5bc09f] group-hover:text-[#ffffff] transition-colors shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex-grow">
                <div className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                  Team Participant Portal
                </div>
                <div className="text-xs text-[#58585a]/70 mt-0.5">
                  View standings, gallery & active challenges
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#58585a]/60 group-hover:text-[#5bc09f] group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          </motion.div>
        )}

        {view !== "select" && (
          <motion.form
            initial={{ opacity: 0, x: view === "gm" ? -15 : 15 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <button
                type="button"
                onClick={() => setView("select")}
                className="p-1.5 bg-[#ffffff] hover:bg-[#5bc09f] border border-[#58585a]/25 hover:border-[#5bc09f] text-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                {view === "gm" ? "GM Administration Sign-In" : "Team Sign-In"}
              </span>
            </div>

            {view === "team" && (
              <div className="space-y-1.5" id="team-dropdown-group">
                <label className="micro-label">Select Your Team</label>
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-sm text-[#58585a] outline-none focus:border-[#5bc09f] transition-colors cursor-pointer"
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
                <span className="absolute left-3.5 top-3.5 text-[#5bc09f]">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  placeholder={view === "gm" ? "Enter administrative passcode..." : "Enter team passcode..."}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#58585a]/30 pl-10 pr-4 py-3 text-sm text-[#58585a] outline-none focus:border-[#5bc09f] transition-colors"
                  required
                />
              </div>
            </div>

            {error && (
              <div
                className="text-xs text-[#58585a] font-bold bg-[#58585a]/5 border border-[#58585a]/30 p-3 flex items-center gap-2"
                id="login-error-message"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#58585a] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] border border-[#5bc09f] hover:border-[#58585a] font-display font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              id="submit-login-btn"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Continue</span>
                </>
              )}
            </button>
          </motion.form>
        )}
      </div>
    </div>
  );
}
