import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Key, ShieldAlert, RefreshCw, Radio } from "lucide-react";
import { AppState, Team, CSIProgress } from "./types";

import LoginScreen from "./components/LoginScreen";
import TeamDashboard from "./components/TeamDashboard";
import GMDashboard from "./components/GMDashboard";
import ScoreCard from "./components/ScoreCard";
import Leaderboard from "./components/Leaderboard";
import CameraGallery from "./components/CameraGallery";
import CSIHunt from "./components/CSIHunt";

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [userRole, setUserRole] = useState<"gm" | "group" | null>(null);
  const [currentTeamId, setCurrentTeamId] = useState<number | null>(null);
  const [gmPassword, setGMPassword] = useState<string>("");
  const [teamPassword, setTeamPassword] = useState<string>("");
  
  // Navigation
  const [activePage, setActivePage] = useState<string>("login-select");
  const [navHistory, setNavHistory] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch unified server state
  const fetchState = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setRefreshing(true);
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    } finally {
      if (showLoadingIndicator) setRefreshing(false);
    }
  };

  // On initial mount
  useEffect(() => {
    fetchState();

    // Check localStorage session persistence
    const savedRole = localStorage.getItem("event_role");
    const savedTeamId = localStorage.getItem("event_team_id");
    const savedGMPass = localStorage.getItem("event_gm_pass");
    const savedTeamPass = localStorage.getItem("event_team_pass");

    if (savedRole === "gm" && savedGMPass) {
      setUserRole("gm");
      setGMPassword(savedGMPass);
      setActivePage("main-gm-hub");
    } else if (savedRole === "group" && savedTeamId && savedTeamPass) {
      setUserRole("group");
      setCurrentTeamId(Number(savedTeamId));
      setTeamPassword(savedTeamPass);
      setActivePage("team-dashboard");
    }

    // Polling interval (keep rankings and active games perfectly synced every 5s)
    const interval = setInterval(() => {
      fetchState();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (role: "gm" | "group", pass: string, teamId?: number) => {
    setUserRole(role);
    localStorage.setItem("event_role", role);

    if (role === "gm") {
      setGMPassword(pass);
      localStorage.setItem("event_gm_pass", pass);
      navigate("main-gm-hub");
    } else if (role === "group" && teamId) {
      setCurrentTeamId(teamId);
      setTeamPassword(pass);
      localStorage.setItem("event_team_id", String(teamId));
      localStorage.setItem("event_team_pass", pass);
      navigate("team-dashboard");
    }
    fetchState();
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentTeamId(null);
    setGMPassword("");
    setTeamPassword("");
    
    localStorage.removeItem("event_role");
    localStorage.removeItem("event_team_id");
    localStorage.removeItem("event_gm_pass");
    localStorage.removeItem("event_team_pass");

    setNavHistory([]);
    setActivePage("login-select");
  };

  const navigate = (page: string) => {
    setNavHistory((prev) => [...prev, activePage]);
    setActivePage(page);
  };

  const navigateBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory((prevList) => prevList.slice(0, -1));
      setActivePage(prev);
    } else {
      // Fallback
      if (userRole === "gm") {
        setActivePage("main-gm-hub");
      } else if (userRole === "group") {
        setActivePage("team-dashboard");
      } else {
        setActivePage("login-select");
      }
    }
  };

  const currentTeamObj = state?.teams.find((t) => t.id === currentTeamId) || null;
  const currentProgress: CSIProgress = currentTeamId && state?.teamProgress[String(currentTeamId)]
    ? state.teamProgress[String(currentTeamId)]
    : { answered: [], hintsBought: [], currentQ: 0 };

  // Dynamic backdrop label matching activePage
  const getBackdropText = () => {
    switch (activePage) {
      case "csi-game": return "FORENSICS";
      case "leaderboard": return "STANDINGS";
      case "score-card": return "METRICS";
      case "camera": return "GALLERY";
      case "gm-settings": return "SETTINGS";
      case "main-gm-hub": return "ADMIN";
      case "team-dashboard": return "DASHBOARD";
      default: return "METRIC";
    }
  };

  return (
    <div className="min-h-screen bg-stark-dark text-white font-sans selection:bg-white/20 pb-12 relative overflow-hidden">
      
      {/* Bold Typography backdrop watermark */}
      <div className="massive-text select-none uppercase tracking-tighter" style={{ pointerEvents: 'none' }}>
        {getBackdropText()}
      </div>

      {/* Main Container Layer */}
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        
        {/* Top bar styled with Stark layout */}
        <header className="flex items-center justify-between border-b border-white/10 py-5 px-1 relative z-10">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-accent-gold animate-pulse shrink-0" />
            <h1 className="font-display font-black text-sm sm:text-base tracking-widest bg-clip-text text-white uppercase flex items-center gap-1.5">
              <span>{state?.customTitle || "CHAMPIONSHIP"}</span>
              <span className="text-accent-gold font-black">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Sync trigger */}
            <button
              onClick={() => fetchState(true)}
              disabled={refreshing}
              className="p-1.5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-all cursor-pointer"
              title="Refresh database state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-accent-gold" : ""}`} />
            </button>

            {/* Quick dashboard role identifier tags */}
            {userRole === "gm" && (
              <span className="text-[10px] tracking-widest font-black uppercase border border-white/20 bg-white/5 px-3 py-1 rounded-none text-white font-mono">
                👑 ADMIN
              </span>
            )}
            {userRole === "group" && currentTeamObj && (
              <span
                className="text-[10px] tracking-widest font-black uppercase border px-3 py-1 rounded-none text-white font-mono"
                style={{ borderColor: `${currentTeamObj.color}88`, backgroundColor: `${currentTeamObj.color}15` }}
              >
                👥 {currentTeamObj.name}
              </span>
            )}
          </div>
        </header>

        {/* Dynamic Screen Renders */}
        <main>
          {state === null ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mb-3" />
              <p className="text-sm">Connecting to championship server...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activePage === "login-select" && (
                <motion.div
                  key="login-select-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <LoginScreen
                    teams={state.teams}
                    onLoginSuccess={handleLoginSuccess}
                  />
                </motion.div>
              )}

              {/* Game Master Main Hub View */}
              {activePage === "main-gm-hub" && userRole === "gm" && (
                <motion.div
                  key="main-gm-hub"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Hero welcome card */}
                  <div className="border border-white/15 bg-black/60 p-6 sm:p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 space-y-4">
                      <div className="space-y-1">
                        <span className="micro-label">Championship Hub</span>
                        <h2 className="font-display font-black text-2xl sm:text-3xl text-white uppercase tracking-tight leading-none">
                          THE <span className="outline-heading">ADMIN</span><br />
                          CENTRAL CONSOLE
                        </h2>
                      </div>
                      <p className="text-sm text-slate-400 leading-relaxed max-w-xl font-light">
                        Welcome, Game Master! Adjust points presets in real-time, toggle active tournament rounds, configure invite keys, and monitor team uploads.
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard snippet inside hub */}
                  <div className="border border-white/10 bg-black/30 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="micro-label">Live Championship Podium</span>
                      <button
                        onClick={() => navigate("leaderboard")}
                        className="text-xs font-black uppercase tracking-widest hover:underline text-white/80 cursor-pointer"
                      >
                        Open Full Rankings →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[...state.teams].sort((a, b) => b.score - a.score).slice(0, 3).map((team, idx) => (
                        <div
                          key={team.id}
                          className="p-4 bg-black/40 border border-white/10 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black text-accent-gold">
                              0{idx + 1}
                            </span>
                            <span className="font-black uppercase tracking-wider text-xs" style={{ color: team.color }}>
                              {team.name}
                            </span>
                          </div>
                          <span className="font-mono font-black text-sm text-white">{team.score} PTS</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GM Action grid with stark buttons */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => navigate("score-card")}
                      className="p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <span className="text-xl mb-2 group-hover:scale-110 transition-transform">📝</span>
                      <span className="font-black text-xs uppercase tracking-widest">Score Card</span>
                      <span className="text-[9px] text-slate-500 uppercase mt-1 group-hover:text-black/50">Edit Points</span>
                    </button>

                    <button
                      onClick={() => navigate("leaderboard")}
                      className="p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <span className="text-xl mb-2 group-hover:scale-110 transition-transform">🏆</span>
                      <span className="font-black text-xs uppercase tracking-widest">Standings</span>
                      <span className="text-[9px] text-slate-500 uppercase mt-1 group-hover:text-black/50">Leaderboard</span>
                    </button>

                    <button
                      onClick={() => navigate("camera")}
                      className="p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <span className="text-xl mb-2 group-hover:scale-110 transition-transform">📷</span>
                      <span className="font-black text-xs uppercase tracking-widest">Lens Gallery</span>
                      <span className="text-[9px] text-slate-500 uppercase mt-1 group-hover:text-black/50">Event Feed</span>
                    </button>

                    <button
                      onClick={() => navigate("gm-settings")}
                      className="p-6 border border-white/10 bg-black/60 hover:bg-white hover:text-black hover:border-white transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group"
                    >
                      <span className="text-xl mb-2 group-hover:scale-110 transition-transform">⚙️</span>
                      <span className="font-black text-xs uppercase tracking-widest">Settings</span>
                      <span className="text-[9px] text-slate-500 uppercase mt-1 group-hover:text-black/50">Controls</span>
                    </button>
                  </div>

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-black border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white hover:border-red-500 text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    🚪 Terminate Administration Session
                  </button>
                </motion.div>
              )}

              {/* Score card controls page */}
              {activePage === "score-card" && userRole === "gm" && (
                <motion.div
                  key="score-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <ScoreCard
                    teams={state.teams}
                    gmPassword={gmPassword}
                    onScoreUpdated={fetchState}
                    onBack={navigateBack}
                  />
                </motion.div>
              )}

              {/* Leaderboard page */}
              {activePage === "leaderboard" && (
                <motion.div
                  key="leaderboard"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <Leaderboard
                    teams={state.teams}
                    userRole={userRole}
                    currentTeamId={currentTeamId}
                    onBack={navigateBack}
                  />
                </motion.div>
              )}

              {/* GM settings dashboard page */}
              {activePage === "gm-settings" && userRole === "gm" && (
                <motion.div
                  key="gm-settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <GMDashboard
                    state={state}
                    gmPassword={gmPassword}
                    onStateUpdated={fetchState}
                    onBack={navigateBack}
                  />
                </motion.div>
              )}

              {/* Camera & Gallery page */}
              {activePage === "camera" && (
                <motion.div
                  key="camera"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <CameraGallery
                    userRole={userRole}
                    currentTeam={currentTeamObj}
                    gallery={state.gallery}
                    gmPassword={gmPassword}
                    onPhotoUploaded={fetchState}
                    onBack={navigateBack}
                  />
                </motion.div>
              )}

              {/* Team Participant Portal Dashboard */}
              {activePage === "team-dashboard" && userRole === "group" && currentTeamObj && (
                <motion.div
                  key="team-dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <TeamDashboard
                    currentTeam={currentTeamObj}
                    state={state}
                    onStateUpdated={fetchState}
                    onNavigate={navigate}
                    onLogout={handleLogout}
                  />
                </motion.div>
              )}

              {/* CSI Clue Hunting page */}
              {activePage === "csi-game" && userRole === "group" && currentTeamObj && (
                <motion.div
                  key="csi-game"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <CSIHunt
                    currentTeam={currentTeamObj}
                    teamProgress={currentProgress}
                    onStateUpdated={fetchState}
                    onBack={navigateBack}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
