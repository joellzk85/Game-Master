import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  Radio, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  RefreshCw,
  Clock,
  Filter
} from "lucide-react";
import { NotificationItem, Team } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";
import { formatRealTime, formatRelativeTime } from "../utils/time";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  currentTeamId: number | null;
  userRole: "gm" | "group" | null;
  isMuted: boolean;
  onToggleMute: () => void;
  onClearNotifications?: () => void;
}

export default function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  currentTeamId,
  userRole,
  isMuted,
  onToggleMute,
  onClearNotifications
}: NotificationDrawerProps) {
  const [filter, setFilter] = useState<"all" | "team" | "broadcast">("all");

  const filtered = notifications.filter((item) => {
    if (filter === "team") {
      if (currentTeamId) {
        return item.targetTeamId === currentTeamId;
      }
      return item.targetTeamId !== "all";
    }
    if (filter === "broadcast") {
      return item.targetTeamId === "all";
    }
    return true;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9990] flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#181412] border-l border-[#F9B800]/30 shadow-2xl flex flex-col h-full z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#F9B800]/20 flex items-center justify-between bg-[#14110F]">
              <div className="flex items-center gap-2.5">
                <TexasDrumstickBadge size="xs" />
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-white flex items-center gap-2">
                    <span>Live Transmission Log</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#BE2403] text-[#F9B800] rounded-xs">
                      {notifications.length}
                    </span>
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Real-time WebSocket feed</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Audio chime toggle */}
                <button
                  onClick={onToggleMute}
                  title={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
                  className="p-2 text-gray-400 hover:text-[#F9B800] hover:bg-white/5 rounded-xs transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="p-3 bg-[#14110F]/60 border-b border-[#F9B800]/10 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                    filter === "all"
                      ? "bg-[#BE2403] text-white border border-[#F9B800]/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  All ({notifications.length})
                </button>
                {userRole === "group" && (
                  <button
                    onClick={() => setFilter("team")}
                    className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                      filter === "team"
                        ? "bg-[#BE2403] text-white border border-[#F9B800]/40"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    My Team
                  </button>
                )}
                <button
                  onClick={() => setFilter("broadcast")}
                  className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xs transition-all cursor-pointer ${
                    filter === "broadcast"
                      ? "bg-[#BE2403] text-white border border-[#F9B800]/40"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  Broadcasts
                </button>
              </div>

              {onClearNotifications && notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-[10px] text-gray-400 hover:text-rose-400 font-mono underline cursor-pointer"
                >
                  Clear log
                </button>
              )}
            </div>

            {/* Notification Stream List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#F9B800]/20 bg-[#14110F]/40">
                  <Radio className="w-8 h-8 text-[#F9B800]/40 mb-3 animate-pulse" />
                  <p className="text-xs font-display font-black uppercase tracking-wider text-gray-300">
                    No Transmissions Recorded Yet
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                    Game Master announcements, point awards, and urgent directives will appear here in real time.
                  </p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isCurrentTeam = currentTeamId && item.targetTeamId === currentTeamId;
                  const isScoreUpdate = item.type === "score_update";
                  const points = item.points ?? 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 border transition-all ${
                        isCurrentTeam
                          ? "bg-[#BE2403]/15 border-[#BE2403]"
                          : "bg-[#14110F] border-[#F9B800]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isScoreUpdate ? (
                            points >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                            )
                          ) : item.type === "alert" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#BE2403]" />
                          ) : (
                            <Radio className="w-3.5 h-3.5 text-[#F9B800]" />
                          )}
                          <span className="text-[10px] font-mono font-black uppercase text-gray-400">
                            {item.targetTeamId === "all" ? "GLOBAL BROADCAST" : item.targetTeamName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#F9B800]" />
                          <span>{formatRealTime(item.timestamp)}</span>
                          <span className="text-gray-500 text-[9px] hidden sm:inline">({formatRelativeTime(item.timestamp)})</span>
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-black text-xs uppercase tracking-wider text-white">
                          {item.title}
                        </h4>
                        {isScoreUpdate && points !== 0 && (
                          <span
                            className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-xs border ${
                              points > 0
                                ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/30"
                                : "text-rose-400 bg-rose-500/10 border-rose-500/30"
                            }`}
                          >
                            {points > 0 ? `+${points}` : points}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Status */}
            <div className="p-3 border-t border-[#F9B800]/20 bg-[#14110F] flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span>Texas Real-Time Dispatch</span>
              <button
                onClick={onClose}
                className="text-xs font-black uppercase tracking-wider text-[#F9B800] hover:underline cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
