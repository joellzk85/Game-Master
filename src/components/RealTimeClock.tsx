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

  useEffect(() => {
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
  const tzLabel = tzMode === "myt" ? "UTC+8" : "LOCAL TIME";

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowDetails(!showDetails)}
        className={`group flex items-center gap-2 border bg-[#ffffff] transition-colors cursor-pointer ${
          compact
            ? "px-2 py-1 text-xs border-[#58585a]/25 hover:border-[#5bc09f]"
            : "px-2.5 py-1.5 border-[#58585a]/25 hover:border-[#5bc09f]"
        }`}
        title="Real-Time Synchronized Clock"
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#5bc09f]" />
          <span className="font-mono font-bold text-xs sm:text-sm tracking-wider text-[#58585a] tabular-nums">
            {timeFormatted}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 border-l border-[#58585a]/20 pl-2">
          <span className="text-[10px] font-mono font-bold text-[#58585a] uppercase">
            {tzMode === "myt" ? "UTC+8" : "LOCAL"}
          </span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSynced ? "bg-[#5bc09f]" : "bg-[#58585a]/40"
            }`}
          />
        </div>

        <ChevronDown className="w-3 h-3 text-[#58585a]/60" />
      </button>

      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDetails(false)}
          />
          <div className="absolute right-0 mt-2 w-72 bg-[#ffffff] border border-[#58585a]/30 p-4 shadow-xl z-50">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#58585a]/15">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5bc09f]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                  Real-Time Clock
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#5bc09f] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> SYNCED
              </span>
            </div>

            <div className="bg-[#ffffff] p-3 border border-[#58585a]/20 text-center mb-3">
              <div className="font-mono font-bold text-xl text-[#58585a] tracking-wider tabular-nums">
                {timeFormatted}
              </div>
              <div className="text-xs text-[#58585a]/75 mt-0.5">
                {dateFormatted}
              </div>
              <div className="text-[10px] text-[#5bc09f] font-mono uppercase tracking-wider mt-1 font-bold">
                {tzLabel}
              </div>
            </div>

            <div className="space-y-1.5 mb-3">
              <label className="text-[10px] uppercase font-bold tracking-wider text-[#58585a] flex items-center gap-1">
                <Globe className="w-3 h-3 text-[#5bc09f]" /> Clock Timezone:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleToggleTz("local")}
                  className={`px-2 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    tzMode === "local"
                      ? "bg-[#5bc09f] border-[#5bc09f] text-[#ffffff]"
                      : "bg-[#ffffff] border-[#58585a]/20 text-[#58585a] hover:border-[#5bc09f]"
                  }`}
                >
                  Local Device
                </button>
                <button
                  onClick={() => handleToggleTz("myt")}
                  className={`px-2 py-1.5 text-xs font-bold uppercase transition-colors cursor-pointer border ${
                    tzMode === "myt"
                      ? "bg-[#5bc09f] border-[#5bc09f] text-[#ffffff]"
                      : "bg-[#ffffff] border-[#58585a]/20 text-[#58585a] hover:border-[#5bc09f]"
                  }`}
                >
                  UTC+8
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-[#58585a]/15 flex items-center justify-between text-[10px] font-mono text-[#58585a]/70">
              <span>Drift: ±{Math.abs(offset)}ms</span>
              <button
                onClick={() => syncServerTime()}
                className="text-[#5bc09f] hover:underline cursor-pointer uppercase font-bold"
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
