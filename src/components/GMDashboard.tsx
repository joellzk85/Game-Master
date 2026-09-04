import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Settings, Shield, Plus, Trash2, Eye, EyeOff, LayoutGrid, Check, ArrowLeft, RefreshCw, Key } from "lucide-react";
import { AppState, Team, Game } from "../types";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

interface GMDashboardProps {
  state: AppState;
  gmPassword: string;
  onStateUpdated: () => void;
  onBack: () => void;
}

export default function GMDashboard({ state, gmPassword, onStateUpdated, onBack }: GMDashboardProps) {
  // Title update states
  const [title, setTitle] = useState(state.customTitle);
  const [updatingTitle, setUpdatingTitle] = useState(false);

  // Password modification states
  const [newGMPw, setNewGMPw] = useState("");
  const [newCreateTeamPw, setNewCreateTeamPw] = useState("");
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  // New team states
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#8b5cf6");
  const [newTeamPassword, setNewTeamPassword] = useState("");
  const [verifyCreatePw, setVerifyCreatePw] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  // General messages
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Team password management states
  const [teamsWithPasswords, setTeamsWithPasswords] = useState<Team[]>([]);
  const [editingPasswords, setEditingPasswords] = useState<Record<number, string>>({});
  const [updatingTeamPwId, setUpdatingTeamPwId] = useState<number | null>(null);

  const fetchTeamsWithPasswords = async () => {
    try {
      const res = await fetch("/api/gm/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmPassword })
      });
      if (res.ok) {
        const d = await res.json();
        if (d.success) {
          setTeamsWithPasswords(d.teams);
        }
      }
    } catch (err) {
      console.error("Error fetching teams with passwords", err);
    }
  };

  useEffect(() => {
    fetchTeamsWithPasswords();
  }, [gmPassword, state.teams]);

  const handlePasswordChangeState = (teamId: number, value: string) => {
    setEditingPasswords(prev => ({ ...prev, [teamId]: value }));
  };

  const handleUpdateTeamPassword = async (targetTeamId: number) => {
    clearMessages();
    const newPassword = editingPasswords[targetTeamId];
    if (newPassword === undefined) return;
    
    if (!newPassword.trim()) {
      setError("Password cannot be empty.");
      return;
    }

    setUpdatingTeamPwId(targetTeamId);
    try {
      const res = await fetch("/api/gm/teams/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          targetTeamId,
          newPassword
        })
      });
      if (res.ok) {
        setSuccess("Team password modified successfully!");
        onStateUpdated();
        const d = await res.json();
        if (d.success) {
          setTeamsWithPasswords(d.teams);
        }
      } else {
        const d = await res.json();
        setError(d.error || "Failed to update team password.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setUpdatingTeamPwId(null);
    }
  };

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleUpdateTitle = async () => {
    clearMessages();
    setUpdatingTitle(true);
    try {
      const res = await fetch("/api/title/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmPassword, title })
      });
      if (res.ok) {
        setSuccess("Event title updated successfully!");
        onStateUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to update title");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setUpdatingTitle(false);
    }
  };

  const handleToggleGame = async (gameId: number, open: boolean) => {
    clearMessages();
    try {
      const res = await fetch("/api/games/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmPassword, gameId, open })
      });
      if (res.ok) {
        onStateUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to toggle game");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleDeleteTeam = async (targetTeamId: number) => {
    if (!confirm("Are you sure you want to delete this team? All their scores and progress will be lost permanently.")) return;
    clearMessages();
    try {
      const res = await fetch("/api/teams/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmPassword, targetTeamId })
      });
      if (res.ok) {
        setSuccess("Team deleted successfully!");
        onStateUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to delete team");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setCreatingTeam(true);

    try {
      const res = await fetch("/api/teams/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          color: newTeamColor,
          password: newTeamPassword,
          createTeamPassword: verifyCreatePw
        })
      });

      if (res.ok) {
        setSuccess(`Team "${newTeamName}" created successfully!`);
        setNewTeamName("");
        setNewTeamPassword("");
        setVerifyCreatePw("");
        setShowCreateTeam(false);
        onStateUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to create team.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleUpdatePasswords = async () => {
    clearMessages();
    setUpdatingCredentials(true);
    try {
      const res = await fetch("/api/passwords/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          newGMPw: newGMPw || undefined,
          newCreateTeamPw: newCreateTeamPw || undefined
        })
      });
      if (res.ok) {
        setSuccess("Security passwords updated!");
        setNewGMPw("");
        setNewCreateTeamPw("");
        onStateUpdated();
      } else {
        const d = await res.json();
        setError(d.error || "Failed to update security credentials.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setUpdatingCredentials(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#F9B800]/20">
        <div className="flex items-center gap-3">
          <TexasDrumstickBadge size="sm" />
          <div>
            <h2 className="font-display font-black text-base uppercase tracking-wider text-white">Texas Chicken GM Settings</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Game parameters, team passwords & management security</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#14110F] border border-[#F9B800]/30 text-white hover:bg-[#BE2403] hover:border-[#F9B800] text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      {success && (
        <div className="text-xs font-mono font-black uppercase tracking-wider bg-emerald-950/40 border border-emerald-900/40 p-4 text-emerald-400 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>SUCCESS: {success}</span>
        </div>
      )}

      {error && (
        <div className="text-xs font-mono font-black uppercase tracking-wider bg-[#BE2403]/30 border border-[#BE2403] p-4 text-red-200">
          ERROR: {error}
        </div>
      )}

      {/* Title Config Section */}
      <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 space-y-3 shadow-md">
        <span className="micro-label block">🍗 Championship Banner / Title</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-[#14110F] border border-[#F9B800]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#F9B800] text-white"
            placeholder="Event title..."
          />
          <button
            onClick={handleUpdateTitle}
            disabled={updatingTitle || !title.trim()}
            className="px-5 py-3 bg-[#F9B800] text-[#120F0D] hover:bg-[#BE2403] hover:text-white border border-[#F9B800] hover:border-[#BE2403] text-xs font-display font-black uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50"
          >
            {updatingTitle ? "..." : "Save"}
          </button>
        </div>
      </div>

      {/* Game status selectors */}
      <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 space-y-4 shadow-md">
        <span className="micro-label block">🍗 Approved Tournament Interactive Games</span>
        <div className="space-y-3">
          {state.games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 bg-[#14110F] border border-[#F9B800]/20"
            >
              <div>
                <span className="font-display font-black text-sm text-white uppercase tracking-wider block">{game.name}</span>
                <span className={`font-mono text-[9px] font-black mt-1 block tracking-widest ${game.open ? "text-[#F9B800]" : "text-gray-500"}`}>
                  {game.open ? "🍗 ACTIVE" : "○ CLOSED"}
                </span>
              </div>

              {/* Texas Custom Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={game.open}
                  onChange={(e) => handleToggleGame(game.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 border border-[#F9B800]/30 bg-[#14110F] peer-focus:outline-none rounded-none peer peer-checked:bg-[#BE2403] peer-checked:border-[#F9B800] peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#F9B800] after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Team Management */}
      <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <span className="micro-label">🍗 Compo Teams & Passwords Management</span>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="flex items-center gap-1 text-[10px] font-black text-[#F9B800] uppercase tracking-wider hover:underline transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Team</span>
          </button>
        </div>

        {/* Team Addition Form */}
        {showCreateTeam && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            onSubmit={handleCreateTeam}
            className="p-5 bg-[#14110F] border border-[#F9B800]/30 space-y-4"
          >
            <span className="text-[10px] font-black text-[#F9B800] uppercase tracking-widest block border-b border-[#F9B800]/20 pb-2">🍗 New Team Registration</span>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">Team Name</label>
                <input
                  type="text"
                  placeholder="Alpha, Omega, etc..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-[#1C1815] border border-[#F9B800]/30 px-3 py-2 text-xs font-mono uppercase tracking-wider text-white outline-none focus:border-[#F9B800]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">Color Tag</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-10 h-8 p-0 bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    value={newTeamColor}
                    onChange={(e) => setNewTeamColor(e.target.value)}
                    className="w-full bg-[#1C1815] border border-[#F9B800]/30 px-3 py-2 text-xs font-mono uppercase text-white outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">Team Passcode</label>
                <input
                  type="text"
                  placeholder="Password for logins..."
                  value={newTeamPassword}
                  onChange={(e) => setNewTeamPassword(e.target.value)}
                  className="w-full bg-[#1C1815] border border-[#F9B800]/30 px-3 py-2 text-xs font-mono uppercase tracking-wider text-white outline-none focus:border-[#F9B800]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black tracking-widest text-gray-400">Verify Management Key</label>
                <input
                  type="password"
                  placeholder="Verify GM Creation key..."
                  value={verifyCreatePw}
                  onChange={(e) => setVerifyCreatePw(e.target.value)}
                  className="w-full bg-[#1C1815] border border-[#F9B800]/30 px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#F9B800]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateTeam(false)}
                className="px-4 py-2 border border-white/10 text-xs font-black uppercase tracking-wider hover:bg-white hover:text-black transition-all text-gray-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingTeam}
                className="px-4 py-2 bg-[#F9B800] text-[#120F0D] border border-[#F9B800] hover:bg-[#BE2403] hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer font-display"
              >
                Create Registered Team
              </button>
            </div>
          </motion.form>
        )}

        {/* Teams List */}
        <div className="space-y-3">
          {(teamsWithPasswords.length > 0 ? teamsWithPasswords : state.teams).map((team) => {
            const currentPasswordValue = editingPasswords[team.id] !== undefined 
              ? editingPasswords[team.id] 
              : (team.password || "");

            return (
              <div
                key={team.id}
                className="p-4 bg-[#14110F] border border-[#F9B800]/20 space-y-3 shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 shrink-0" style={{ backgroundColor: team.color }} />
                    <div>
                      <span className="font-display font-black text-sm text-white uppercase tracking-wider block">{team.name}</span>
                      <span className="text-[9px] text-[#F9B800] font-mono uppercase tracking-widest">{team.score} Points awarded</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteTeam(team.id)}
                    className="w-8 h-8 border border-red-500/30 bg-[#1C1815] hover:bg-[#BE2403] text-red-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Delete Team"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Password / Passcode Modifier */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#F9B800]/10">
                  <div className="flex items-center gap-1.5 text-[#F9B800]">
                    <Key className="w-3 h-3 text-[#F9B800]" />
                    <span className="text-[9px] font-mono uppercase tracking-widest">Passcode:</span>
                  </div>
                  <input
                    type="text"
                    value={currentPasswordValue}
                    onChange={(e) => handlePasswordChangeState(team.id, e.target.value)}
                    placeholder="Enter team passcode..."
                    className="flex-1 bg-[#1C1815] border border-[#F9B800]/20 px-2 py-1 text-xs font-mono text-white outline-none focus:border-[#F9B800]"
                  />
                  <button
                    onClick={() => handleUpdateTeamPassword(team.id)}
                    disabled={updatingTeamPwId === team.id || !currentPasswordValue.trim()}
                    className="px-3 py-1 bg-[#F9B800] text-[#120F0D] border border-[#F9B800] text-[9px] font-display font-black uppercase tracking-wider transition-all cursor-pointer hover:bg-[#BE2403] hover:text-white disabled:opacity-50"
                  >
                    {updatingTeamPwId === team.id ? "Saving..." : "Modify"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Configurations */}
      <div className="border border-[#F9B800]/20 bg-[#1C1815]/90 p-6 space-y-4 shadow-md">
        <span className="micro-label block">🔑 Security & Passcodes Management</span>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-300 uppercase tracking-wider font-black">New GM Admin Password</label>
            <input
              type="password"
              value={newGMPw}
              onChange={(e) => setNewGMPw(e.target.value)}
              className="w-full bg-[#14110F] border border-[#F9B800]/30 px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-[#F9B800]"
              placeholder="Keep current key..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-300 uppercase tracking-wider font-black">New Team Invite Password</label>
            <input
              type="password"
              value={newCreateTeamPw}
              onChange={(e) => setNewCreateTeamPw(e.target.value)}
              className="w-full bg-[#14110F] border border-[#F9B800]/30 px-4 py-2.5 text-xs font-mono text-white outline-none focus:border-[#F9B800]"
              placeholder="Keep current key..."
            />
          </div>
        </div>

        <button
          onClick={handleUpdatePasswords}
          disabled={updatingCredentials || (!newGMPw && !newCreateTeamPw)}
          className="w-full py-3 bg-[#F9B800] text-[#120F0D] hover:bg-[#BE2403] hover:text-white hover:border-[#BE2403] border border-[#F9B800] font-display font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer disabled:opacity-50 shadow-lg"
        >
          {updatingCredentials ? "Saving..." : "Update Administration Passwords"}
        </button>
      </div>
    </div>
  );
}
