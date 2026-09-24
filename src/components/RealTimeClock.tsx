import React, { useState, useEffect } from "react";
import { Clock, Globe, CheckCircle2, ChevronDown } from "lucide-react";
import {
  getSyncedNow,
  getIsTimeSynced,
  getTimeOffsetMs,
  formatRealTime,
  formatRealDate,
  TimezoneMode,
  syncServerTime
} from "../utils/time";

interface RealTimeClockProps {
  compact?: boolean;
}

export default function RealTimeClock({ compact = false }: RealTimeClockProps) {
  const [nowEpoch, setNowEpoch] = useState<number>(getSyncedNow());
  const [tzMode, setTzMode] = useState<TimezoneMode>(() => {
    return (localStorage.getItem("event_tz_mode") as TimezoneMode) || "local";
  });
  const [showDetails, setShowDetails] = useState(false);
  const isSynced = getIsTimeSynced();
  const offset = getTimeOffsetMs();

  // Tick every second with synced epoch time
  useEffect(() => {
    // Initial sync
    syncServerTime();

    const interval = setInterval(() => {
      setNowEpoch(getSyncedNow());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleTz = (mode: TimezoneMode) => {
    setTzMode(mode);
    localStorage.setItem("event_tz_mode", mode);
  };

  const currentDateObj = new Date(nowEpoch);
  const timeFormatted = formatRealTime(nowEpoch, {
    showSeconds: true,
    timezone: tzMode,
    hour12: true
  });
  const dateFormatted = formatRealDate(currentDateObj, tzMode);

  // Timezone label
  const tzLabel = tzMode === "myt" ? "MYT (UTC+8)" : "LOCAL TIME";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`group flex items-center gap-2 border bg-[#14110F] transition-all cursor-pointer ${
          compact
            ? "px-2 py-1 text-xs border-[#F9B800]/30 hover:border-[#F9B800]"
            : "px-2.5 py-1.5 border-[#F9B800]/30 hover:border-[#F9B800] hover:bg-[#1C1815]"
        }`}
        title="Real-Time Synchronized Clock (Click to view details or switch timezone)"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#F9B800] group-hover:rotate-12 transition-transform" />
          <span className="font-mono font-black text-xs sm:text-sm tracking-widest text-white">
            {timeFormatted}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 border-l border-[#F9B800]/20 pl-2">
          <span className="text-[9px] font-mono font-bold text-[#F9B800] uppercase tracking-wider">
            {tzMode === "myt" ? "MYT" : "LOCAL"}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSynced ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
            }`}
            title={isSynced ? `Synced (${Math.abs(offset)}ms offset)` : "Connecting to time server..."}
          />
        </div>

        <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-white transition-colors" />
      </button>

      {/* Popover with real-time status and timezone toggles */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-[#1C1815] border border-[#F9B800]/50 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#F9B800]/20">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F9B800]" />
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  Real-Time Clock
                </span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> SYNCED
              </span>
            </div>

            {/* Current Real Time Display */}
            <div className="bg-[#14110F] p-3 border border-[#F9B800]/20 text-center mb-3">
              <div className="font-mono font-black text-xl text-white tracking-widest">
                {timeFormatted}
              </div>
              <div className="text-[10px] text-gray-300 font-medium uppercase tracking-wider mt-0.5">
                {dateFormatted}
              </div>
              <div className="text-[9px] text-[#F9B800] font-mono uppercase tracking-widest mt-1">
                {tzLabel}
              </div>
            </div>

            {/* Timezone Switcher */}
            <div className="space-y-1.5 mb-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#F9B800]" /> Select Clock Display:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleToggleTz("local")}
                  className={`px-2 py-1.5 text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                    tzMode === "local"
                      ? "bg-[#BE2403] border-[#F9B800] text-white shadow-sm"
                      : "bg-[#14110F] border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                  }`}
                >
                  Local Device
                </button>
                <button
                  onClick={() => handleToggleTz("myt")}
                  className={`px-2 py-1.5 text-xs font-mono font-bold uppercase transition-all cursor-pointer border ${
                    tzMode === "myt"
                      ? "bg-[#BE2403] border-[#F9B800] text-white shadow-sm"
                      : "bg-[#14110F] border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                  }`}
                >
                  Malaysia (UTC+8)
                </button>
              </div>
            </div>

            {/* Sync telemetry info */}
            <div className="pt-2 border-t border-[#F9B800]/10 flex items-center justify-between text-[9px] font-mono text-gray-400">
              <span>Drift: ±{Math.abs(offset)}ms</span>
              <button
                onClick={() => syncServerTime()}
                className="text-[#F9B800] hover:underline cursor-pointer uppercase font-bold"
              >
                Re-sync Now
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
