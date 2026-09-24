import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Key, ShieldAlert, RefreshCw, Radio, Bell, Volume2, VolumeX, Send, Megaphone } from "lucide-react";
import { AppState, Team, CSIProgress, NotificationItem } from "./types";

import LoginScreen from "./components/LoginScreen";
import TeamDashboard from "./components/TeamDashboard";
import GMDashboard from "./components/GMDashboard";
import ScoreCard from "./components/ScoreCard";
import Leaderboard from "./components/Leaderboard";
import CameraGallery from "./components/CameraGallery";
import CSIHunt from "./components/CSIHunt";
import TexasDrumstickBadge from "./components/TexasDrumstickBadge";
import ToastContainer from "./components/ToastContainer";
import { ActiveToast } from "./components/ToastNotification";
import NotificationDrawer from "./components/NotificationDrawer";
import GMDispatchPanel from "./components/GMDispatchPanel";
import { soundManager } from "./utils/audio";

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

  // Real-Time Notification & Toast State
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());
  const [unreadCount, setUnreadCount] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch unified server state
  const fetchState = async (showLoadingIndicator = false) => {
    if (showLoadingIndicator) setRefreshing(true);
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data: AppState = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error("Failed to fetch state:", err);
    } finally {
      if (showLoadingIndicator) setRefreshing(false);
    }
  };

  // On initial mount: restore stored credentials
  useEffect(() => {
    fetchState();

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

    // Polling fallback every 8s as backup
    const interval = setInterval(() => {
      fetchState();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Native WebSocket Real-time client
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isMounted = true;

    const connectWS = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);

            if (data.type === "state_update") {
              fetchState();
            } else if (data.type === "notification" && data.notification) {
              const notif: NotificationItem = data.notification;

              // Immediately sync state with new notification
              setState((prev) => {
                if (!prev) return prev;
                const exists = (prev.notifications || []).some((n) => n.id === notif.id);
                if (exists) return prev;
                return {
                  ...prev,
                  notifications: [notif, ...(prev.notifications || [])].slice(0, 50)
                };
              });

              // If score update, trigger instant state fetch so scoreboards update with zero delay
              if (notif.type === "score_update") {
                fetchState();
              }

              // Determine whether to display a visual Toast alert to this client
              const isDirect = currentTeamId !== null && notif.targetTeamId === currentTeamId;
              const isBroadcast = notif.targetTeamId === "all";
              const isGM = userRole === "gm";

              let shouldShow = false;
              if (isGM) {
                // GM receives confirmation toast for all alerts
                shouldShow = true;
              } else if (userRole === "group") {
                if (isDirect || isBroadcast) {
                  shouldShow = true;
                } else if (notif.type === "score_update") {
                  // Other team scored: show alert so user is aware of leaderboard shifts
                  shouldShow = true;
                }
              } else {
                // Spectator
                shouldShow = true;
              }

              if (shouldShow) {
                const toastId = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
                setToasts((prev) => [
                  ...prev.slice(-3), // keep maximum 4 toasts visible at once to avoid clutter
                  { id: toastId, item: notif, isDirectTarget: isDirect }
                ]);
                setUnreadCount((c) => c + 1);

                // Play audio chime
                if (notif.type === "score_update") {
                  const pts = notif.points ?? 0;
                  soundManager.playNotification(pts >= 0 ? "positive" : "negative");
                } else if (notif.type === "alert") {
                  soundManager.playNotification("alert");
                } else {
                  soundManager.playNotification("broadcast");
                }
              }
            }
          } catch (e) {
            console.error("WS error parsing message:", e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };

        ws.onerror = () => {
          if (ws) ws.close();
        };
      } catch (e) {
        if (isMounted) {
          reconnectTimeout = setTimeout(connectWS, 3000);
        }
      }
    };

    connectWS();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, [userRole, currentTeamId]);

  const handleDismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundManager.setMuted(next);
  };

  const handleClearNotifications = () => {
    setState((prev) => prev ? { ...prev, notifications: [] } : prev);
  };

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

    setActivePage("login-select");
    setNavHistory([]);
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

  const getBackdropText = () => {
    switch (activePage) {
      case "csi-game": return "FORENSICS";
      case "leaderboard": return "STANDINGS";
      case "score-card": return "METRICS";
      case "camera": return "GALLERY";
      case "gm-settings": return "SETTINGS";
      case "gm-dispatch": return "DISPATCH";
      case "main-gm-hub": return "TEXAS GM";
      case "team-dashboard": return "DASHBOARD";
      default: return "TEXAS";
    }
  };

  return (
    <div className="min-h-screen bg-texas-dark text-white font-sans selection:bg-texas-red selection:text-white pb-12 relative overflow-hidden">
      
      {/* Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
      />

      {/* Slide-over Notification Log Drawer */}
      <NotificationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        notifications={state?.notifications || []}
        currentTeamId={currentTeamId}
        userRole={userRole}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onClearNotifications={handleClearNotifications}
      />

      {/* Warm Ambient Texas Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[340px] bg-gradient-to-b from-[#BE2403]/20 via-[#F9B800]/5 to-transparent blur-3xl pointer-events-none" />

      {/* Bold Typography backdrop watermark */}
      <div className="massive-text select-none uppercase tracking-tighter" style={{ pointerEvents: 'none' }}>
        {getBackdropText()}
      </div>

      {/* Main Container Layer */}
      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        
        {/* Top bar styled with Texas Chicken Malaysia branding */}
        <header className="flex items-center justify-between border-b border-[#F9B800]/20 py-4 px-1 relative z-10">
          <div className="flex items-center gap-3">
            <TexasDrumstickBadge size="sm" />
            <div className="flex flex-col">
              <h1 className="font-display font-black text-base sm:text-lg tracking-wider text-white uppercase flex items-center gap-1.5 leading-none">
                <span>{state?.customTitle || "TEXAS CHICKEN"}</span>
              </h1>
              <span className="text-[9px] font-black tracking-widest text-[#F9B800] uppercase mt-1">
                MALAYSIA • BOLD HUNT & CSI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Real-time Connection Indicator */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-[#1C1815] border border-[#F9B800]/20 text-[10px] font-mono"
              title={wsConnected ? "Connected to Real-Time Server" : "Reconnecting to Real-Time Server..."}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
              <span className="text-gray-400 uppercase">{wsConnected ? "LIVE" : "SYNC"}</span>
            </div>

            {/* Notification Bell with unread counter */}
            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setUnreadCount(0);
              }}
              className="relative p-2 bg-[#1C1815] border border-[#F9B800]/30 hover:border-[#F9B800] hover:bg-[#BE2403] rounded-none text-white/80 hover:text-white transition-all cursor-pointer"
              title="Live Transmission History"
            >
              <Bell className="w-3.5 h-3.5 text-[#F9B800]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              )}
            </button>

            {/* Audio chime toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 bg-[#1C1815] border border-[#F9B800]/30 hover:border-[#F9B800] hover:bg-[#BE2403] rounded-none text-white/80 hover:text-white transition-all cursor-pointer"
              title={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>

            {/* Manual Sync trigger */}
            <button
              onClick={() => fetchState(true)}
              disabled={refreshing}
              className="p-2 bg-[#1C1815] border border-[#F9B800]/30 hover:border-[#F9B800] hover:bg-[#BE2403] rounded-none text-white/80 hover:text-white transition-all cursor-pointer"
              title="Refresh database state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-texas-gold" : ""}`} />
            </button>

            {/* Quick dashboard role identifier tags */}
            {userRole === "gm" && (
              <span className="text-[10px] tracking-widest font-black uppercase border border-[#F9B800]/40 bg-[#BE2403]/30 px-2.5 py-1.5 rounded-none text-[#F9B800] font-mono flex items-center gap-1.5">
                <TexasDrumstickBadge size="xs" showBorder={false} /> ADMIN
              </span>
            )}
            {userRole === "group" && currentTeamObj && (
              <span
                className="text-[10px] tracking-widest font-black uppercase border px-2.5 py-1.5 rounded-none text-white font-mono"
                style={{ borderColor: `${currentTeamObj.color}AA`, backgroundColor: `${currentTeamObj.color}25` }}
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
              <RefreshCw className="w-8 h-8 animate-spin text-texas-gold mb-3" />
              <p className="text-sm font-bold text-gray-400">Connecting to Texas Chicken Championship...</p>
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
                  {/* Hero welcome card styled with Texas Chicken brand */}
                  <div className="border border-[#F9B800]/30 bg-gradient-to-br from-[#241E1A] via-[#1C1714] to-[#2B211B] p-6 sm:p-8 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#BE2403]/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10 space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#BE2403] text-white text-[10px] font-black uppercase tracking-widest border border-[#F9B800]/40 shadow-sm">
                        <TexasDrumstickBadge size="xs" showBorder={false} />
                        <span>TEXAS CHICKEN GM HEADQUARTERS</span>
                      </div>
                      <h2 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-tight leading-none">
                        THE <span className="text-[#F9B800]">COMMAND</span><br />
                        CENTRAL CONSOLE
                      </h2>
                      <p className="text-sm text-gray-300 leading-relaxed max-w-xl font-normal">
                        Broadcast live messages to teams, award instant challenge points, and monitor tournament standings in real-time.
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard snippet inside hub */}
                  <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TexasDrumstickBadge size="xs" showBorder={false} />
                        <span className="micro-label">Live Championship Standings</span>
                      </div>
                      <button
                        onClick={() => navigate("leaderboard")}
                        className="text-xs font-black uppercase tracking-widest hover:text-[#F9B800] text-gray-300 cursor-pointer flex items-center gap-1"
                      >
                        Full Rankings →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[...state.teams].sort((a, b) => b.score - a.score).slice(0, 3).map((team, idx) => (
                        <div
                          key={team.id}
                          className="p-4 bg-[#14110F] border border-[#F9B800]/20 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono text-xs font-black text-[#F9B800]">
                              0{idx + 1}
                            </span>
                            <span className="font-black uppercase tracking-wider text-xs" style={{ color: team.color }}>
                              {team.name}
                            </span>
                          </div>
                          <span className="font-mono font-black text-sm text-[#F9B800]">{team.score} PTS</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* GM Action grid with Texas Chicken styling */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      onClick={() => navigate("gm-dispatch")}
                      className="p-5 border border-[#F9B800]/40 bg-[#BE2403]/20 hover:bg-[#BE2403] hover:text-white hover:border-[#F9B800] transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group shadow-md"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">📢</span>
                      <span className="font-display font-black text-xs uppercase tracking-widest text-[#F9B800] group-hover:text-white">Dispatch</span>
                      <span className="text-[9px] text-gray-300 uppercase mt-0.5 group-hover:text-white/80">Radio Alert</span>
                    </button>

                    <button
                      onClick={() => navigate("score-card")}
                      className="p-5 border border-[#F9B800]/20 bg-[#1C1815] hover:bg-[#BE2403] hover:text-white hover:border-[#F9B800] transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group shadow-md"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">📝</span>
                      <span className="font-display font-black text-xs uppercase tracking-widest">Score Card</span>
                      <span className="text-[9px] text-gray-400 uppercase mt-0.5 group-hover:text-white/80">Adjust Points</span>
                    </button>

                    <button
                      onClick={() => navigate("leaderboard")}
                      className="p-5 border border-[#F9B800]/20 bg-[#1C1815] hover:bg-[#BE2403] hover:text-white hover:border-[#F9B800] transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group shadow-md"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">🏆</span>
                      <span className="font-display font-black text-xs uppercase tracking-widest">Standings</span>
                      <span className="text-[9px] text-gray-400 uppercase mt-0.5 group-hover:text-white/80">Leaderboard</span>
                    </button>

                    <button
                      onClick={() => navigate("camera")}
                      className="p-5 border border-[#F9B800]/20 bg-[#1C1815] hover:bg-[#BE2403] hover:text-white hover:border-[#F9B800] transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group shadow-md"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">📷</span>
                      <span className="font-display font-black text-xs uppercase tracking-widest">Gallery</span>
                      <span className="text-[9px] text-gray-400 uppercase mt-0.5 group-hover:text-white/80">Event Feed</span>
                    </button>

                    <button
                      onClick={() => navigate("gm-settings")}
                      className="p-5 border border-[#F9B800]/20 bg-[#1C1815] hover:bg-[#BE2403] hover:text-white hover:border-[#F9B800] transition-all duration-200 text-center flex flex-col items-center justify-center cursor-pointer group shadow-md col-span-2 md:col-span-1"
                    >
                      <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">⚙️</span>
                      <span className="font-display font-black text-xs uppercase tracking-widest">Settings</span>
                      <span className="text-[9px] text-gray-400 uppercase mt-0.5 group-hover:text-white/80">GM Controls</span>
                    </button>
                  </div>

                  {/* Embedded Quick Dispatch Console */}
                  <GMDispatchPanel
                    teams={state.teams}
                    gmPassword={gmPassword}
                    onMessageSent={fetchState}
                    compact={true}
                  />

                  {/* Logout button */}
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-[#14110F] border border-[#BE2403]/40 text-[#FF7A7A] hover:bg-[#BE2403] hover:text-white hover:border-[#BE2403] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg"
                  >
                    🚪 Terminate Administration Session
                  </button>
                </motion.div>
              )}

              {/* Dedicated GM Dispatch Page */}
              {activePage === "gm-dispatch" && userRole === "gm" && (
                <motion.div
                  key="gm-dispatch"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <GMDispatchPanel
                    teams={state.teams}
                    gmPassword={gmPassword}
                    onMessageSent={fetchState}
                    onBack={navigateBack}
                    compact={false}
                  />
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
