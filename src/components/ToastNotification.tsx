import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  X, 
  Megaphone, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  Bell, 
  Radio, 
  RefreshCw 
} from "lucide-react";
import { NotificationItem } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

export interface ActiveToast {
  id: string;
  item: NotificationItem;
  isDirectTarget?: boolean;
}

export interface ToastNotificationProps {
  key?: React.Key;
  toast: ActiveToast;
  onDismiss: (id: string) => void;
  duration?: number; // ms, default 5500
}

export default function ToastNotification({
  toast,
  onDismiss,
  duration = 5500
}: ToastNotificationProps) {
  const { item, isDirectTarget } = toast;
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 50;
    const step = (intervalMs / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss(toast.id);
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, duration, toast.id, onDismiss]);

  // Determine styling based on type and points
  const isScoreUpdate = item.type === "score_update";
  const points = item.points ?? 0;
  const isPositiveScore = isScoreUpdate && points > 0;
  const isNegativeScore = isScoreUpdate && points < 0;
  const isResetScore = isScoreUpdate && item.points === 0;

  // Icon & Theme colors
  let borderColor = "border-[#F9B800]/40";
  let leftStripeColor = "bg-[#F9B800]";
  let glowColor = "shadow-[0_4px_20px_rgba(249,184,0,0.15)]";
  let badgeLabel = "GM TRANSMISSION";
  let badgeIcon = <Radio className="w-3.5 h-3.5 text-[#F9B800]" />;

  if (isPositiveScore) {
    borderColor = isDirectTarget ? "border-emerald-500/80" : "border-emerald-500/40";
    leftStripeColor = "bg-emerald-500";
    glowColor = "shadow-[0_4px_24px_rgba(16,185,129,0.25)]";
    badgeLabel = "SCORE AWARD";
    badgeIcon = <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  } else if (isNegativeScore) {
    borderColor = isDirectTarget ? "border-rose-500/80" : "border-rose-500/40";
    leftStripeColor = "bg-rose-500";
    glowColor = "shadow-[0_4px_24px_rgba(244,63,94,0.25)]";
    badgeLabel = "POINT DEDUCTION";
    badgeIcon = <TrendingDown className="w-3.5 h-3.5 text-rose-400" />;
  } else if (isResetScore) {
    borderColor = "border-amber-500/60";
    leftStripeColor = "bg-amber-500";
    badgeLabel = "SCORE RESET";
    badgeIcon = <RefreshCw className="w-3.5 h-3.5 text-amber-400" />;
  } else if (item.type === "alert") {
    borderColor = "border-[#BE2403]";
    leftStripeColor = "bg-[#BE2403]";
    glowColor = "shadow-[0_4px_24px_rgba(190,36,3,0.35)]";
    badgeLabel = "PRIORITY ALERT";
    badgeIcon = <AlertTriangle className="w-3.5 h-3.5 text-[#BE2403]" />;
  } else if (item.type === "praise") {
    borderColor = "border-[#F9B800]";
    leftStripeColor = "bg-[#F9B800]";
    badgeLabel = "SHOUTOUT";
    badgeIcon = <Sparkles className="w-3.5 h-3.5 text-[#F9B800]" />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full max-w-sm sm:max-w-md bg-[#181412]/95 backdrop-blur-md border ${borderColor} ${glowColor} overflow-hidden transition-all`}
      role="alert"
    >
      {/* Left accent color stripe */}
      <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${leftStripeColor}`} />

      {/* Direct Target Banner indicator if this user's team is directly affected */}
      {isDirectTarget && (
        <div className="bg-[#BE2403] px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#F9B800] border-b border-[#F9B800]/20 pl-4">
          <div className="flex items-center gap-1.5">
            <TexasDrumstickBadge size="xs" />
            <span>DIRECT NOTICE FOR YOUR TEAM</span>
          </div>
          <span className="animate-pulse">● LIVE</span>
        </div>
      )}

      {/* Main Toast Content */}
      <div className="p-3.5 pl-4 sm:p-4 sm:pl-5 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-[#14110F] border border-white/10 rounded-xs flex items-center justify-center">
              {badgeIcon}
            </div>
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-gray-400">
              {badgeLabel}
            </span>
            {item.targetTeamName && item.targetTeamId !== "all" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#BE2403]/30 border border-[#BE2403]/50 text-white rounded-xs">
                {item.targetTeamName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500">
              {item.timestamp}
            </span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-white p-1 hover:bg-white/10 rounded-xs transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Points Row */}
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-display font-black text-sm uppercase tracking-wider text-white">
            {item.title}
          </h4>

          {/* Points Pill for score updates */}
          {isScoreUpdate && points !== 0 && (
            <div
              className={`shrink-0 px-2 py-0.5 text-xs font-mono font-black rounded-xs border ${
                points > 0
                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/40 text-rose-400"
              }`}
            >
              {points > 0 ? `+${points}` : points} PTS
            </div>
          )}
        </div>

        {/* Message Body */}
        <p className="text-xs text-gray-300 leading-relaxed font-sans">
          {item.message}
        </p>
      </div>

      {/* Auto-dismiss progress countdown bar */}
      <div className="h-1 w-full bg-black/40 overflow-hidden">
        <div
          className={`h-full ${leftStripeColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
