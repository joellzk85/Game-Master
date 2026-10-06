import React, { useState } from "react";
import { Send, Megaphone, AlertTriangle, Sparkles, Lightbulb, Check, ArrowLeft } from "lucide-react";
import { Team, NotificationType } from "../types";

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
      label: "10m Warning",
      type: "alert" as NotificationType,
      title: "10-Minute Warning",
      text: "10 minutes remaining on the current round. Submit your photos promptly."
    },
    {
      label: "Momentum Update",
      type: "praise" as NotificationType,
      title: "Standings Update",
      text: "Great teamwork across the board. Top teams are separated by less than 20 points."
    },
    {
      label: "Bonus Challenge",
      type: "broadcast" as NotificationType,
      title: "Flash Bonus Challenge",
      text: "The next team to complete the active challenge will receive a +50 PTS speed bonus."
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
            ? "Broadcast sent to all teams."
            : "Direct message delivered to team."
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
    <div
      className={`border border-[#58585a]/20 bg-[#ffffff] p-5 sm:p-6 space-y-5 ${
        compact ? "" : "w-full max-w-2xl mx-auto"
      }`}
    >
      {/* Header if not compact */}
      {!compact && onBack && (
        <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
          <div>
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
              GM Live Dispatch
            </h2>
            <p className="text-xs text-[#58585a]/70 mt-0.5">
              Send real-time alerts to connected teams
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] border border-[#58585a]/25 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      )}

      {/* Header if compact */}
      {compact && (
        <div className="flex items-center justify-between">
          <span className="micro-label">Real-Time Dispatch Console</span>
          <span className="text-xs font-bold text-[#5bc09f] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#5bc09f]" />
            Instant Broadcast
          </span>
        </div>
      )}

      {successMsg && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#5bc09f]/10 border border-[#5bc09f] p-3.5 text-[#58585a] flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-[#5bc09f]" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#58585a]/10 border border-[#58585a] p-3.5 text-[#58585a]">
          ERROR: {errorMsg}
        </div>
      )}

      <form onSubmit={handleSend} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#58585a] block mb-1.5 font-bold">
              Dispatch Recipient
            </label>
            <select
              value={targetTeamId}
              onChange={(e) => setTargetTeamId(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#5bc09f] text-[#58585a] cursor-pointer"
            >
              <option value="all">ALL TEAMS (GLOBAL BROADCAST)</option>
              {teams.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  TARGET ONLY: {t.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#58585a] block mb-1.5 font-bold">
              Transmission Priority
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { type: "broadcast" as NotificationType, label: "Notice", icon: <Megaphone className="w-3.5 h-3.5" /> },
                { type: "alert" as NotificationType, label: "Alert", icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                { type: "praise" as NotificationType, label: "Cheer", icon: <Sparkles className="w-3.5 h-3.5" /> }
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setNotifType(item.type)}
                  className={`py-2 px-1 text-[10px] font-bold uppercase border transition-colors flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    notifType === item.type
                      ? "bg-[#5bc09f] text-[#ffffff] border-[#5bc09f]"
                      : "bg-[#ffffff] border-[#58585a]/20 text-[#58585a] hover:border-[#5bc09f]"
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
          <span className="text-[11px] uppercase tracking-wider text-[#58585a] block mb-1.5 font-bold">
            Quick Templates
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {quickTemplates.map((tmpl) => (
              <button
                type="button"
                key={tmpl.label}
                onClick={() => handleApplyTemplate(tmpl)}
                className="px-2.5 py-2 bg-[#ffffff] border border-[#58585a]/20 hover:border-[#5bc09f] text-[#58585a] hover:bg-[#5bc09f]/5 text-xs font-bold tracking-wider text-left transition-colors cursor-pointer truncate"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title Input */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#58585a] block mb-1.5 font-bold">
            Alert Headline (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g. FLASH DIRECTIVE / ROUND UPDATE"
            className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#5bc09f] text-[#58585a]"
          />
        </div>

        {/* Message Textarea */}
        <div>
          <label className="text-[11px] uppercase tracking-wider text-[#58585a] block mb-1.5 font-bold">
            Broadcast Message Body *
          </label>
          <textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type transmission here..."
            className="w-full bg-[#ffffff] border border-[#58585a]/30 p-3 text-xs font-sans outline-none focus:border-[#5bc09f] text-[#58585a] resize-none"
            required
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="w-full bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] hover:border-[#58585a] border border-[#5bc09f] font-display font-bold text-xs uppercase tracking-widest py-3.5 px-6 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <span>Broadcasting Alert...</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>
                {targetTeamId === "all" ? "Transmit Global Broadcast" : "Send Direct Team Alert"}
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
