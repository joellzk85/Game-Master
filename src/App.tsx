import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RefreshCw, Bell, Volume2, VolumeX, Megaphone, FileText, Trophy, Camera, Settings, LogOut } from "lucide-react";
import { AppState, CSIProgress, NotificationItem } from "./types";

import LoginScreen from "./components/LoginScreen";
import TeamDashboard from "./components/TeamDashboard";
import GMDashboard from "./components/GMDashboard";
import ScoreCard from "./components/ScoreCard";
import Leaderboard from "./components/Leaderboard";
import CameraGallery from "./components/CameraGallery";
import CSIHunt from "./components/CSIHunt";
import ToastContainer from "./components/ToastContainer";
import { ActiveToast } from "./components/ToastNotification";
import NotificationDrawer from "./components/NotificationDrawer";
import GMDispatchPanel from "./components/GMDispatchPanel";
import RealTimeClock from "./components/RealTimeClock";
import EventTimerBanner from "./components/EventTimerBanner";
import { soundManager } from "./utils/audio";
import { setServerTimeFromWS, syncServerTime } from "./utils/time";

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
    syncServerTime();

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

            if (data.type === "connected") {
              if (data.serverTime) {
                setServerTimeFromWS(data.serverTime);
              }
              if (data.timer) {
                setState((prev) => (prev ? { ...prev, timer: data.timer } : prev));
              }
            } else if (data.type === "timer_update" && data.timer) {
              setState((prev) => (prev ? { ...prev, timer: data.timer } : prev));
            } else if (data.type === "state_update") {
              fetchState();
            } else if (data.type === "notification" && data.notification) {
              const notif: NotificationItem = data.notification;

              setState((prev) => {
                if (!prev) return prev;
                const exists = (prev.notifications || []).some((n) => n.id === notif.id);
                if (exists) return prev;
                return {
                  ...prev,
                  notifications: [notif, ...(prev.notifications || [])].slice(0, 50)
                };
              });

              if (notif.type === "score_update") {
                fetchState();
              }

              const isDirect = currentTeamId !== null && notif.targetTeamId === currentTeamId;
              const isBroadcast = notif.targetTeamId === "all";
              const isGM = userRole === "gm";

              let shouldShow = false;
              if (isGM) {
                shouldShow = true;
              } else if (userRole === "group") {
                if (isDirect || isBroadcast || notif.type === "score_update") {
                  shouldShow = true;
                }
              } else {
                shouldShow = true;
              }

              if (shouldShow) {
                const toastId = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);
                setToasts((prev) => [
                  ...prev.slice(-3),
                  { id: toastId, item: notif, isDirectTarget: isDirect }
                ]);
                setUnreadCount((c) => c + 1);

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
    setState((prev) => (prev ? { ...prev, notifications: [] } : prev));
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
  const currentProgress: CSIProgress =
    currentTeamId && state?.teamProgress[String(currentTeamId)]
      ? state.teamProgress[String(currentTeamId)]
      : { answered: [], hintsBought: [], currentQ: 0 };

  const headerTitle =
    state?.customTitle && !state.customTitle.toUpperCase().includes("TEXAS")
      ? state.customTitle
      : "TEAM EVENT PORTAL";

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#58585a] font-sans selection:bg-[#5bc09f] selection:text-[#ffffff] pb-12 relative">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

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

      {/* Main Container Layer */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Clean Unbranded Top Bar */}
        <header className="flex items-center justify-between border-b border-[#58585a]/20 py-4 px-1">
          <button
            type="button"
            onClick={() => {
              if (userRole === "gm") setActivePage("main-gm-hub");
              else if (userRole === "group") setActivePage("team-dashboard");
              else setActivePage("login-select");
            }}
            className="text-left cursor-pointer"
          >
            <h1 className="font-display font-bold text-base sm:text-lg tracking-wider text-[#58585a] uppercase leading-none">
              {headerTitle}
            </h1>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            {/* Real-time Synchronized Clock */}
            <RealTimeClock />

            {/* Real-time Connection Indicator */}
            <div
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ffffff] border border-[#58585a]/20 text-[10px] font-mono text-[#58585a]"
              title={wsConnected ? "Connected to Real-Time Server" : "Reconnecting to Real-Time Server..."}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? "bg-[#5bc09f]" : "bg-[#58585a]/40"}`} />
              <span className="uppercase font-bold">{wsConnected ? "LIVE" : "SYNC"}</span>
            </div>

            {/* Notification Bell with unread counter */}
            <button
              onClick={() => {
                setIsDrawerOpen(true);
                setUnreadCount(0);
              }}
              className="relative p-2 bg-[#ffffff] border border-[#58585a]/25 hover:border-[#5bc09f] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
              title="Live Transmission History"
            >
              <Bell className="w-3.5 h-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#5bc09f] rounded-full" />
              )}
            </button>

            {/* Audio chime toggle */}
            <button
              onClick={handleToggleMute}
              className="p-2 bg-[#ffffff] border border-[#58585a]/25 hover:border-[#5bc09f] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
              title={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#58585a]/60" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#5bc09f]" />
              )}
            </button>

            {/* Manual Sync trigger */}
            <button
              onClick={() => fetchState(true)}
              disabled={refreshing}
              className="p-2 bg-[#ffffff] border border-[#58585a]/25 hover:border-[#5bc09f] hover:bg-[#5bc09f] text-[#58585a] hover:text-[#ffffff] transition-colors cursor-pointer"
              title="Refresh database state"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-[#5bc09f]" : ""}`} />
            </button>

            {/* Role identifier */}
            {userRole === "gm" && (
              <span className="text-[11px] tracking-wider font-bold uppercase border border-[#5bc09f] bg-[#5bc09f]/10 px-2.5 py-1 text-[#58585a]">
                ADMIN
              </span>
            )}
            {userRole === "group" && currentTeamObj && (
              <span className="text-[11px] tracking-wider font-bold uppercase border border-[#58585a]/30 bg-[#ffffff] px-2.5 py-1 text-[#58585a]">
                {currentTeamObj.name}
              </span>
            )}
          </div>
        </header>

        {/* Synchronized Event / Round Countdown Banner */}
        <EventTimerBanner
          timer={state?.timer}
          userRole={userRole}
          gmPassword={gmPassword}
          onTimerUpdated={fetchState}
        />

        {/* Dynamic Screen Renders */}
        <main>
          {state === null ? (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center text-[#58585a]">
              <RefreshCw className="w-7 h-7 animate-spin text-[#5bc09f] mb-3" />
              <p className="text-sm font-bold text-[#58585a]">Loading event portal...</p>
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
                  <LoginScreen teams={state.teams} onLoginSuccess={handleLoginSuccess} />
                </motion.div>
              )}

              {/* Game Master Main Hub View */}
              {activePage === "main-gm-hub" && userRole === "gm" && (
                <motion.div
                  key="main-gm-hub"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="space-y-6"
                >
                  {/* Clean GM Header Card */}
                  <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 sm:p-8 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#5bc09f] block">
                      Game Master Console
                    </span>
                    <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#58585a] uppercase tracking-tight">
                      Event Control Center
                    </h2>
                    <p className="text-sm text-[#58585a]/80 leading-relaxed max-w-xl">
                      Broadcast live messages to teams, award challenge points, and monitor standings in real time.
                    </p>
                  </div>

                  {/* Leaderboard snippet inside hub */}
                  <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="micro-label">Live Standings</span>
                      <button
                        onClick={() => navigate("leaderboard")}
                        className="text-xs font-bold uppercase tracking-wider text-[#5bc09f] hover:text-[#58585a] cursor-pointer"
                      >
                        Full Rankings →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[...state.teams]
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 3)
                        .map((team, idx) => (
                          <div
                            key={team.id}
                            className="p-4 bg-[#ffffff] border border-[#58585a]/20 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-xs font-bold text-[#5bc09f] tabular-nums">
                                0{idx + 1}
                              </span>
                              <span className="font-bold uppercase tracking-wider text-xs text-[#58585a]">
                                {team.name}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-sm text-[#58585a] tabular-nums">
                              {team.score} PTS
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* GM Action grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <button
                      onClick={() => navigate("gm-dispatch")}
                      className="p-5 border border-[#5bc09f] bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] hover:border-[#58585a] transition-colors text-center flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Megaphone className="w-5 h-5 mb-2" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Dispatch</span>
                      <span className="text-[10px] opacity-85 mt-0.5">Live Alert</span>
                    </button>

                    <button
                      onClick={() => navigate("score-card")}
                      className="p-5 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center flex flex-col items-center justify-center cursor-pointer"
                    >
                      <FileText className="w-5 h-5 mb-2" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Score Card</span>
                      <span className="text-[10px] opacity-75 mt-0.5">Adjust Points</span>
                    </button>

                    <button
                      onClick={() => navigate("leaderboard")}
                      className="p-5 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Trophy className="w-5 h-5 mb-2" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Standings</span>
                      <span className="text-[10px] opacity-75 mt-0.5">Leaderboard</span>
                    </button>

                    <button
                      onClick={() => navigate("camera")}
                      className="p-5 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center flex flex-col items-center justify-center cursor-pointer"
                    >
                      <Camera className="w-5 h-5 mb-2" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Gallery</span>
                      <span className="text-[10px] opacity-75 mt-0.5">Event Feed</span>
                    </button>

                    <button
                      onClick={() => navigate("gm-settings")}
                      className="p-5 border border-[#58585a]/20 bg-[#ffffff] text-[#58585a] hover:border-[#5bc09f] hover:bg-[#5bc09f] hover:text-[#ffffff] transition-colors text-center flex flex-col items-center justify-center cursor-pointer col-span-2 md:col-span-1"
                    >
                      <Settings className="w-5 h-5 mb-2" />
                      <span className="font-display font-bold text-xs uppercase tracking-wider">Settings</span>
                      <span className="text-[10px] opacity-75 mt-0.5">GM Controls</span>
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
                    className="w-full py-3.5 bg-[#ffffff] border border-[#58585a]/30 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Administration Session</span>
                  </button>
                </motion.div>
              )}

              {/* Dedicated GM Dispatch Page */}
              {activePage === "gm-dispatch" && userRole === "gm" && (
                <motion.div
                  key="gm-dispatch"
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
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
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
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
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <TeamDashboard
                    currentTeam={currentTeamObj}
                    state={state}
                    teamPassword={teamPassword}
                    gmPassword={gmPassword}
                    onTeamPasswordUpdated={(newPw) => {
                      setTeamPassword(newPw);
                      localStorage.setItem("event_team_pass", newPw);
                    }}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CSIHunt
                    currentTeam={currentTeamObj}
                    teamPassword={teamPassword}
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
