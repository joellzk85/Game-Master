import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Sparkles,
  Radio,
  RefreshCw
} from "lucide-react";
import { NotificationItem } from "../types";
import { formatRealTime } from "../utils/time";

export interface ActiveToast {
  id: string;
  item: NotificationItem;
  isDirectTarget?: boolean;
}

export interface ToastNotificationProps {
  key?: React.Key;
  toast: ActiveToast;
  onDismiss: (id: string) => void;
  duration?: number;
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

  const isScoreUpdate = item.type === "score_update";
  const points = item.points ?? 0;
  const isPositiveScore = isScoreUpdate && points > 0;
  const isNegativeScore = isScoreUpdate && points < 0;
  const isResetScore = isScoreUpdate && item.points === 0;

  let badgeLabel = "GM TRANSMISSION";
  let badgeIcon = <Radio className="w-3.5 h-3.5 text-[#5bc09f]" />;

  if (isPositiveScore) {
    badgeLabel = "SCORE AWARD";
    badgeIcon = <TrendingUp className="w-3.5 h-3.5 text-[#5bc09f]" />;
  } else if (isNegativeScore) {
    badgeLabel = "POINT DEDUCTION";
    badgeIcon = <TrendingDown className="w-3.5 h-3.5 text-[#58585a]" />;
  } else if (isResetScore) {
    badgeLabel = "SCORE RESET";
    badgeIcon = <RefreshCw className="w-3.5 h-3.5 text-[#58585a]" />;
  } else if (item.type === "alert") {
    badgeLabel = "PRIORITY ALERT";
    badgeIcon = <AlertTriangle className="w-3.5 h-3.5 text-[#5bc09f]" />;
  } else if (item.type === "praise") {
    badgeLabel = "SHOUTOUT";
    badgeIcon = <Sparkles className="w-3.5 h-3.5 text-[#5bc09f]" />;
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 30, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full max-w-sm sm:max-w-md bg-[#ffffff] border border-[#58585a]/30 shadow-lg overflow-hidden"
      role="alert"
    >
      {/* Left accent stripe */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#5bc09f]" />

      {isDirectTarget && (
        <div className="bg-[#5bc09f] px-3 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#ffffff] pl-4">
          <span>DIRECT NOTICE FOR YOUR TEAM</span>
          <span>● LIVE</span>
        </div>
      )}

      <div className="p-3.5 pl-4 sm:p-4 sm:pl-5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {badgeIcon}
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#58585a]/75">
              {badgeLabel}
            </span>
            {item.targetTeamName && item.targetTeamId !== "all" && (
              <span className="text-[10px] font-bold text-[#5bc09f]">
                · {item.targetTeamName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#58585a]/70">
              {formatRealTime(item.timestamp)}
            </span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#58585a]/70 hover:text-[#58585a] p-1 transition-colors cursor-pointer"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <h4 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
            {item.title}
          </h4>

          {isScoreUpdate && points !== 0 && (
            <span className="shrink-0 text-xs font-mono font-bold text-[#5bc09f] tabular-nums">
              {points > 0 ? `+${points}` : points} PTS
            </span>
          )}
        </div>

        <p className="text-xs text-[#58585a]/85 leading-relaxed font-sans">
          {item.message}
        </p>
      </div>

      {/* Auto-dismiss progress countdown bar */}
      <div className="h-1 w-full bg-[#58585a]/10 overflow-hidden">
        <div
          className="h-full bg-[#5bc09f] transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
