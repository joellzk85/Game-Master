import React, { useState } from "react";
import { motion } from "motion/react";
import { Send, Radio, Megaphone, AlertTriangle, Sparkles, Lightbulb, Check, ArrowLeft } from "lucide-react";
import { Team, NotificationType } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

interface GMDispatchPanelProps {
  teams: Team[];
  gmPassword: string;
  onMessageSent?: () => void;
  onBack?: () => void;
  compact?: boolean;
}

export default function GMDispatchPanel({
  teams,
  gmPassword,
  onMessageSent,
  onBack,
  compact = false
}: GMDispatchPanelProps) {
  const [targetTeamId, setTargetTeamId] = useState<string>("all");
  const [notifType, setNotifType] = useState<NotificationType>("broadcast");
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const quickTemplates = [
    {
      label: "⚡ 10m Left",
      type: "alert" as NotificationType,
      title: "10-Minute Warning!",
      text: "⚡ 10 minutes remaining on the current round! Rush your evidence photos to the terminal!"
    },
    {
      label: "🔍 CSI Hint Tip",
      type: "hint" as NotificationType,
      title: "Forensics Coordinator Tip",
      text: "🔍 Coordinator Notice: Inspect the outdoor stone perimeter carefully for subtle markings!"
    },
    {
      label: "🎉 Great Momentum",
      type: "praise" as NotificationType,
      title: "Championship Momentum!",
      text: "🍗 Incredible teamwork! Top teams are separated by less than 20 points!"
    },
    {
      label: "⭐ Bonus Challenge",
      type: "broadcast" as NotificationType,
      title: "★ Flash Bonus Challenge!",
      text: "🎯 The next team to upload a verified clue photo will receive a +50 PTS speed bonus!"
    }
  ];

  const handleApplyTemplate = (tmpl: typeof quickTemplates[0]) => {
    setNotifType(tmpl.type);
    setCustomTitle(tmpl.title);
    setMessage(tmpl.text);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg("Please enter a message to broadcast.");
      return;
    }

    setSending(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          targetTeamId: targetTeamId === "all" ? "all" : Number(targetTeamId),
          title: customTitle.trim() || undefined,
          message: message.trim(),
          type: notifType
        })
      });

      if (res.ok) {
        setSuccessMsg(
          targetTeamId === "all"
            ? "Broadcast sent! All teams received live Toast alert."
            : `Direct message delivered to team successfully!`
        );
        setMessage("");
        setCustomTitle("");
        if (onMessageSent) onMessageSent();
      } else {
        const d = await res.json();
        setErrorMsg(d.error || "Failed to send dispatch.");
      }
    } catch (err) {
      setErrorMsg("Network error connecting to server.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`border border-[#F9B800]/25 bg-[#1C1815]/95 p-5 sm:p-6 shadow-xl space-y-5 ${compact ? "" : "w-full max-w-2xl mx-auto"}`}>
      {/* Header if not compact */}
      {!compact && onBack && (
        <div className="flex items-center justify-between pb-4 border-b border-[#F9B800]/20">
          <div className="flex items-center gap-3">
            <TexasDrumstickBadge size="sm" />
            <div>
              <h2 className="font-display font-black text-base uppercase tracking-wider text-white">GM Live Radio Dispatch</h2>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Push instant real-time Toast alerts to all connected teams</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#14110F] border border-[#F9B800]/30 text-white hover:bg-[#BE2403] hover:border-[#F9B800] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Header if compact */}
      {compact && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TexasDrumstickBadge size="xs" />
            <span className="micro-label">🍗 Real-Time Dispatch Console</span>
          </div>
          <span className="text-[10px] font-mono text-[#F9B800] flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Instant Live Broadcast
          </span>
        </div>
      )}

      {successMsg && (
        <div className="text-xs font-mono font-black uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/40 p-3.5 text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs font-mono font-black uppercase tracking-wider bg-[#BE2403]/30 border border-[#BE2403] p-3.5 text-red-200">
          ERROR: {errorMsg}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        {/* Row 1: Target Team + Notification Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Target Selector */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
              Dispatch Recipient
            </label>
            <select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              className="w-full bg-[#14110F] border border-[#F9B800]/30 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#F9B800] text-white cursor-pointer"
            >
              <option value="all">📢 ALL TEAMS (GLOBAL BROADCAST)</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  👥 TARGET ONLY: {t.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Type / Alert Category */}
          <div>
            <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
              Transmission Priority
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { type: "broadcast" as NotificationType, label: "Notice", icon: <Megaphone className="w-3 h-3" /> },
                { type: "alert" as NotificationType, label: "Alert", icon: <AlertTriangle className="w-3 h-3 text-[#BE2403]" /> },
                { type: "hint" as NotificationType, label: "Clue", icon: <Lightbulb className="w-3 h-3 text-amber-400" /> },
                { type: "praise" as NotificationType, label: "Cheer", icon: <Sparkles className="w-3 h-3 text-[#F9B800]" /> }
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setNotifType(item.type)}
                  className={`py-2 px-1 text-[10px] font-mono font-bold uppercase rounded-none border transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    notifType === item.type
                      ? "bg-[#BE2403] text-white border-[#F9B800]"
                      : "bg-[#14110F] border-[#F9B800]/20 text-gray-400 hover:text-white hover:border-[#F9B800]/40"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Preset Templates */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
            Quick Templates
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickTemplates.map((tmpl) => (
              <button
                type="button"
                key={tmpl.label}
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-1.5 bg-[#14110F] border border-[#F9B800]/20 hover:border-[#F9B800] text-gray-300 hover:text-white text-[10px] font-mono tracking-wider text-left transition-all cursor-pointer truncate"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
            Alert Headline (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. FLASH DIRECTIVE / HINT UPDATE"
            className="w-full bg-[#14110F] border border-[#F9B800]/30 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#F9B800] text-white"
          />
        </div>

        {/* Message Textarea */}
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block mb-1.5 font-bold">
            Broadcast Message Body *
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type transmission here... All recipients will receive a real-time Toast visual alert immediately."
            className="w-full bg-[#14110F] border border-[#F9B800]/30 p-3 text-xs font-sans tracking-wide outline-none focus:border-[#F9B800] text-white resize-none"
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="w-full bg-[#F9B800] text-[#120F0D] hover:bg-[#BE2403] hover:text-white hover:border-[#BE2403] border border-[#F9B800] font-display font-black text-xs uppercase tracking-[0.2em] py-3.5 px-6 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <>
              <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              <span>Broadcasting Alert...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {targetTeamId === "all" ? "Transmit Global Broadcast Alert" : "Send Direct Alert to Team"}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
