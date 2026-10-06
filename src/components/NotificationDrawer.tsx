import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Volume2,
  VolumeX,
  Radio,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock
} from "lucide-react";
import { NotificationItem } from "../types";
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
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-[#ffffff] border-l border-[#58585a]/25 shadow-xl flex flex-col h-full z-10"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#58585a]/20 flex items-center justify-between bg-[#ffffff]">
              <div>
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a] flex items-center gap-2">
                  <span>Live Transmission Log</span>
                  <span className="text-xs font-mono text-[#5bc09f]">
                    ({notifications.length})
                  </span>
                </h3>
                <p className="text-xs text-[#58585a]/70 flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5bc09f]" />
                  <span>Real-time feed</span>
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onToggleMute}
                  title={isMuted ? "Unmute alert chimes" : "Mute alert chimes"}
                  className="p-2 text-[#58585a] hover:text-[#5bc09f] transition-colors cursor-pointer"
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-[#58585a]/60" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-[#5bc09f]" />
                  )}
                </button>

                <button
                  onClick={onClose}
                  className="p-2 text-[#58585a] hover:bg-[#58585a]/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="p-3 bg-[#ffffff] border-b border-[#58585a]/15 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFilter("all")}
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    filter === "all"
                      ? "bg-[#5bc09f] text-[#ffffff]"
                      : "text-[#58585a] hover:bg-[#58585a]/10"
                  }`}
                >
                  All ({notifications.length})
                </button>
                {userRole === "group" && (
                  <button
                    onClick={() => setFilter("team")}
                    className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                      filter === "team"
                        ? "bg-[#5bc09f] text-[#ffffff]"
                        : "text-[#58585a] hover:bg-[#58585a]/10"
                    }`}
                  >
                    My Team
                  </button>
                )}
                <button
                  onClick={() => setFilter("broadcast")}
                  className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                    filter === "broadcast"
                      ? "bg-[#5bc09f] text-[#ffffff]"
                      : "text-[#58585a] hover:bg-[#58585a]/10"
                  }`}
                >
                  Broadcasts
                </button>
              </div>

              {onClearNotifications && notifications.length > 0 && (
                <button
                  onClick={onClearNotifications}
                  className="text-xs text-[#58585a]/70 hover:text-[#58585a] underline cursor-pointer"
                >
                  Clear log
                </button>
              )}
            </div>

            {/* Notification Stream List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filtered.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#58585a]/25 bg-[#ffffff]">
                  <Radio className="w-7 h-7 text-[#5bc09f] mb-3" />
                  <p className="text-xs font-display font-bold uppercase tracking-wider text-[#58585a]">
                    No Transmissions Recorded Yet
                  </p>
                  <p className="text-xs text-[#58585a]/70 mt-1 max-w-xs">
                    Announcements, point awards, and directives will appear here in real time.
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
                      className={`p-3.5 border transition-colors ${
                        isCurrentTeam
                          ? "bg-[#5bc09f]/10 border-[#5bc09f]"
                          : "bg-[#ffffff] border-[#58585a]/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5">
                          {isScoreUpdate ? (
                            points >= 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-[#5bc09f]" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-[#58585a]" />
                            )
                          ) : item.type === "alert" ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#5bc09f]" />
                          ) : (
                            <Radio className="w-3.5 h-3.5 text-[#5bc09f]" />
                          )}
                          <span className="text-[10px] font-mono font-bold uppercase text-[#58585a]/75">
                            {item.targetTeamId === "all" ? "GLOBAL BROADCAST" : item.targetTeamName}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#58585a]/70 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#5bc09f]" />
                          <span>{formatRealTime(item.timestamp)}</span>
                          <span className="hidden sm:inline">· {formatRelativeTime(item.timestamp)}</span>
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-display font-bold text-xs uppercase tracking-wider text-[#58585a]">
                          {item.title}
                        </h4>
                        {isScoreUpdate && points !== 0 && (
                          <span className="text-xs font-mono font-bold text-[#5bc09f] tabular-nums">
                            {points > 0 ? `+${points}` : points} PTS
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#58585a]/85 mt-1 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Status */}
            <div className="p-3 border-t border-[#58585a]/20 bg-[#ffffff] flex items-center justify-between text-xs text-[#58585a]/70">
              <span>Real-Time Dispatch</span>
              <button
                onClick={onClose}
                className="text-xs font-bold uppercase tracking-wider text-[#5bc09f] hover:underline cursor-pointer"
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
