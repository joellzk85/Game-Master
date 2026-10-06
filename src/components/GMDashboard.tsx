import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Plus, Trash2, Check, ArrowLeft, Key, Image as ImageIcon, Edit3 } from "lucide-react";
import { AppState, Team } from "../types";
import GMDispatchPanel from "./GMDispatchPanel";
import GMTimerControl from "./GMTimerControl";
import BannerModal from "./BannerModal";

interface GMDashboardProps {
  state: AppState;
  gmPassword: string;
  onStateUpdated: () => void;
  onBack: () => void;
}

export default function GMDashboard({ state, gmPassword, onStateUpdated, onBack }: GMDashboardProps) {
  const [title, setTitle] = useState(
    state.customTitle && !state.customTitle.toUpperCase().includes("TEXAS")
      ? state.customTitle
      : "TEAM EVENT PORTAL"
  );
  const [updatingTitle, setUpdatingTitle] = useState(false);

  const [newGMPw, setNewGMPw] = useState("");
  const [newCreateTeamPw, setNewCreateTeamPw] = useState("");
  const [updatingCredentials, setUpdatingCredentials] = useState(false);

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#5bc09f");
  const [newTeamPassword, setNewTeamPassword] = useState("");
  const [verifyCreatePw, setVerifyCreatePw] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [teamsWithPasswords, setTeamsWithPasswords] = useState<Team[]>([]);
  const [editingNames, setEditingNames] = useState<Record<number, string>>({});
  const [updatingTeamNameId, setUpdatingTeamNameId] = useState<number | null>(null);
  const [editingPasswords, setEditingPasswords] = useState<Record<number, string>>({});
  const [updatingTeamPwId, setUpdatingTeamPwId] = useState<number | null>(null);
  const [editingBannerTeam, setEditingBannerTeam] = useState<Team | null>(null);

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

  const handleNameChangeState = (teamId: number, value: string) => {
    setEditingNames((prev) => ({ ...prev, [teamId]: value }));
  };

  const handleUpdateTeamName = async (targetTeamId: number) => {
    clearMessages();
    const newName = editingNames[targetTeamId];
    if (newName === undefined) return;

    if (!newName.trim()) {
      setError("Group name cannot be empty.");
      return;
    }

    setUpdatingTeamNameId(targetTeamId);
    try {
      const res = await fetch("/api/teams/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmPassword,
          teamId: targetTeamId,
          newName: newName.trim()
        })
      });
      const d = await res.json();
      if (res.ok && d.success) {
        setSuccess(`Group renamed to "${d.name}"!`);
        onStateUpdated();
        if (d.teams) {
          setTeamsWithPasswords(d.teams);
        }
      } else {
        setError(d.error || "Failed to update group name.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setUpdatingTeamNameId(null);
    }
  };

  const handlePasswordChangeState = (teamId: number, value: string) => {
    setEditingPasswords((prev) => ({ ...prev, [teamId]: value }));
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
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div>
          <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
            GM Settings
          </h2>
          <p className="text-xs text-[#58585a]/70 mt-0.5">
            Game parameters, group names, team passcodes & management security
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

      {success && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#5bc09f]/10 border border-[#5bc09f] p-4 text-[#58585a] flex items-center gap-2">
          <Check className="w-4 h-4 text-[#5bc09f]" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="text-xs font-mono font-bold uppercase tracking-wider bg-[#58585a]/10 border border-[#58585a] p-4 text-[#58585a]">
          ERROR: {error}
        </div>
      )}

      {/* Real-time GM Live Dispatch */}
      <GMDispatchPanel
        teams={state.teams}
        gmPassword={gmPassword}
        onMessageSent={onStateUpdated}
        compact={true}
      />

      {/* Synchronized Event / Round Timer Control */}
      <GMTimerControl
        timer={state.timer}
        gmPassword={gmPassword}
        onTimerUpdated={onStateUpdated}
      />

      {/* Title Config Section */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-3">
        <span className="micro-label">Portal Header Title</span>
        <div className="flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-[#ffffff] border border-[#58585a]/30 px-4 py-3 text-xs font-mono uppercase tracking-wider outline-none focus:border-[#5bc09f] text-[#58585a]"
            placeholder="Event title..."
          />
          <button
            onClick={handleUpdateTitle}
            disabled={updatingTitle || !title.trim()}
            className="px-5 py-3 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] border border-[#5bc09f] hover:border-[#58585a] text-xs font-display font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
          >
            {updatingTitle ? "..." : "Save"}
          </button>
        </div>
      </div>

      {/* Game status selectors */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <span className="micro-label">Approved Interactive Games</span>
        <div className="space-y-3">
          {state.games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 bg-[#ffffff] border border-[#58585a]/20"
            >
              <div>
                <span className="font-display font-bold text-sm text-[#58585a] uppercase tracking-wider block">
                  {game.name}
                </span>
                <span
                  className={`font-mono text-[10px] font-bold mt-1 block tracking-wider ${
                    game.open ? "text-[#5bc09f]" : "text-[#58585a]/50"
                  }`}
                >
                  {game.open ? "● APPROVED & ACTIVE" : "○ HIDDEN FROM TEAMS"}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={game.open}
                  onChange={(e) => handleToggleGame(game.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 border border-[#58585a]/30 bg-[#58585a]/10 peer-focus:outline-none peer peer-checked:bg-[#5bc09f] peer-checked:border-[#5bc09f] peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#ffffff] after:border after:border-[#58585a]/20 after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Team Management */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="micro-label">Groups, Names & Passcodes</span>
          <button
            onClick={() => setShowCreateTeam(!showCreateTeam)}
            className="flex items-center gap-1 text-xs font-bold text-[#5bc09f] uppercase tracking-wider hover:underline transition-colors cursor-pointer"
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
            className="p-5 bg-[#ffffff] border border-[#5bc09f] space-y-4"
          >
            <span className="text-xs font-bold text-[#58585a] uppercase tracking-wider block border-b border-[#58585a]/15 pb-2">
              New Team Registration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#58585a]">
                  Team Name
                </label>
                <input
                  type="text"
                  placeholder="Alpha, Omega, etc..."
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#58585a] outline-none focus:border-[#5bc09f]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#58585a]">
                  Color Tag
                </label>
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
                    className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-xs font-mono uppercase text-[#58585a] outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#58585a]">
                  Team Passcode
                </label>
                <input
                  type="text"
                  placeholder="Passcode for logins..."
                  value={newTeamPassword}
                  onChange={(e) => setNewTeamPassword(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-xs font-mono uppercase tracking-wider text-[#58585a] outline-none focus:border-[#5bc09f]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-wider text-[#58585a]">
                  Verify Management Key
                </label>
                <input
                  type="password"
                  placeholder="Verify GM Creation key..."
                  value={verifyCreatePw}
                  onChange={(e) => setVerifyCreatePw(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-xs font-mono text-[#58585a] outline-none focus:border-[#5bc09f]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateTeam(false)}
                className="px-4 py-2 border border-[#58585a]/25 text-xs font-bold uppercase tracking-wider hover:bg-[#58585a] hover:text-[#ffffff] transition-colors text-[#58585a] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creatingTeam}
                className="px-4 py-2 bg-[#5bc09f] text-[#ffffff] border border-[#5bc09f] hover:bg-[#58585a] hover:border-[#58585a] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer font-display"
              >
                Create Team
              </button>
            </div>
          </motion.form>
        )}

        {/* Teams List */}
        <div className="space-y-3">
          {(teamsWithPasswords.length > 0 ? teamsWithPasswords : state.teams).map((team) => {
            const currentNameValue =
              editingNames[team.id] !== undefined ? editingNames[team.id] : team.name;
            const currentPasswordValue =
              editingPasswords[team.id] !== undefined
                ? editingPasswords[team.id]
                : team.password || "";

            return (
              <div
                key={team.id}
                className="p-4 bg-[#ffffff] border border-[#58585a]/20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 shrink-0"
                      style={{ backgroundColor: team.color || "#5bc09f" }}
                    />
                    <div>
                      <span className="font-display font-bold text-sm text-[#58585a] uppercase tracking-wider block">
                        {team.name}
                      </span>
                      <span className="text-[11px] text-[#5bc09f] font-mono uppercase tracking-wider tabular-nums">
                        {team.score} Points awarded
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBannerTeam(team)}
                      className="px-2.5 py-1.5 border border-[#58585a]/25 bg-[#ffffff] hover:bg-[#5bc09f] hover:border-[#5bc09f] text-[#58585a] hover:text-[#ffffff] flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      title="Customize Team Banner"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>Banner</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTeam(team.id)}
                      className="w-8 h-8 border border-[#58585a]/25 bg-[#ffffff] hover:bg-[#58585a] text-[#58585a] hover:text-[#ffffff] flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete Team"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Group Name Modifier */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#58585a]/10">
                  <div className="flex items-center gap-1.5 text-[#58585a] w-24 shrink-0">
                    <Edit3 className="w-3.5 h-3.5 text-[#5bc09f]" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">Group Name:</span>
                  </div>
                  <input
                    type="text"
                    value={currentNameValue}
                    onChange={(e) => handleNameChangeState(team.id, e.target.value)}
                    placeholder="Enter group name..."
                    className="flex-1 bg-[#ffffff] border border-[#58585a]/25 px-2.5 py-1 text-xs text-[#58585a] outline-none focus:border-[#5bc09f]"
                  />
                  <button
                    onClick={() => handleUpdateTeamName(team.id)}
                    disabled={
                      updatingTeamNameId === team.id ||
                      !currentNameValue.trim() ||
                      currentNameValue.trim() === team.name
                    }
                    className="px-3 py-1 bg-[#5bc09f] text-[#ffffff] border border-[#5bc09f] text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-[#58585a] hover:border-[#58585a] disabled:opacity-50"
                  >
                    {updatingTeamNameId === team.id ? "Saving..." : "Rename"}
                  </button>
                </div>

                {/* Password / Passcode Modifier */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#58585a]/10">
                  <div className="flex items-center gap-1.5 text-[#58585a] w-24 shrink-0">
                    <Key className="w-3.5 h-3.5 text-[#5bc09f]" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">Passcode:</span>
                  </div>
                  <input
                    type="text"
                    value={currentPasswordValue}
                    onChange={(e) => handlePasswordChangeState(team.id, e.target.value)}
                    placeholder="Enter team passcode..."
                    className="flex-1 bg-[#ffffff] border border-[#58585a]/25 px-2.5 py-1 text-xs font-mono text-[#58585a] outline-none focus:border-[#5bc09f]"
                  />
                  <button
                    onClick={() => handleUpdateTeamPassword(team.id)}
                    disabled={updatingTeamPwId === team.id || !currentPasswordValue.trim()}
                    className="px-3 py-1 bg-[#5bc09f] text-[#ffffff] border border-[#5bc09f] text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer hover:bg-[#58585a] hover:border-[#58585a] disabled:opacity-50"
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
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-4">
        <span className="micro-label">Security & Passcodes Management</span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] text-[#58585a] uppercase tracking-wider font-bold">
              New GM Admin Password
            </label>
            <input
              type="password"
              value={newGMPw}
              onChange={(e) => setNewGMPw(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-4 py-2.5 text-xs font-mono text-[#58585a] outline-none focus:border-[#5bc09f]"
              placeholder="Keep current key..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] text-[#58585a] uppercase tracking-wider font-bold">
              New Team Invite Password
            </label>
            <input
              type="password"
              value={newCreateTeamPw}
              onChange={(e) => setNewCreateTeamPw(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#58585a]/30 px-4 py-2.5 text-xs font-mono text-[#58585a] outline-none focus:border-[#5bc09f]"
              placeholder="Keep current key..."
            />
          </div>
        </div>

        <button
          onClick={handleUpdatePasswords}
          disabled={updatingCredentials || (!newGMPw && !newCreateTeamPw)}
          className="w-full py-3 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] hover:border-[#58585a] border border-[#5bc09f] font-display font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
        >
          {updatingCredentials ? "Saving..." : "Update Administration Passwords"}
        </button>
      </div>

      {/* GM Banner Management Modal */}
      {editingBannerTeam && (
        <BannerModal
          isOpen={Boolean(editingBannerTeam)}
          onClose={() => setEditingBannerTeam(null)}
          team={editingBannerTeam}
          gmPassword={gmPassword}
          onBannerUpdated={() => {
            onStateUpdated();
            fetchTeamsWithPasswords();
          }}
        />
      )}
    </div>
  );
}
