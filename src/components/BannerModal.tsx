import React, { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Sparkles, Check, AlertCircle, Link, RefreshCw } from "lucide-react";
import { Team } from "../types";
import { compressBannerImage } from "../utils/imageCompressor";
import TexasDrumstickBadge from "./TexasDrumstickBadge";

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  teamPassword?: string;
  gmPassword?: string;
  onBannerUpdated: () => void;
}

const PRESET_BANNERS = [
  {
    id: "spicy-fire",
    name: "Spicy Fire Blaze",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&auto=format&fit=crop&q=80",
    theme: "Texas Spicy Red"
  },
  {
    id: "golden-crunch",
    name: "Golden Crunch Championship",
    url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
    theme: "Gold Trophy"
  },
  {
    id: "neon-cyber",
    name: "Cyber Neon Circuit",
    url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80",
    theme: "High Tech Hunt"
  },
  {
    id: "midnight-stars",
    name: "Midnight Bold Stars",
    url: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80",
    theme: "Night Sky"
  },
  {
    id: "emerald-speed",
    name: "Emerald Velocity",
    url: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&auto=format&fit=crop&q=80",
    theme: "Green Turbo"
  },
  {
    id: "blue-horizon",
    name: "Cobalt Horizon",
    url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&auto=format&fit=crop&q=80",
    theme: "Royal Blue"
  }
];

export default function BannerModal({
  isOpen,
  onClose,
  team,
  teamPassword,
  gmPassword,
  onBannerUpdated
}: BannerModalProps) {
  const [selectedBanner, setSelectedBanner] = useState<string>(team.banner || PRESET_BANNERS[0].url);
  const [activeTab, setActiveTab] = useState<"upload" | "presets" | "url">("upload");
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [compressionInfo, setCompressionInfo] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    setCompressionInfo("Compressing image...");

    try {
      const origSizeKb = Math.round(file.size / 1024);
      const compressedDataUrl = await compressBannerImage(file);
      const compressedSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

      setSelectedBanner(compressedDataUrl);
      setCompressionInfo(
        origSizeKb > 1024
          ? `Optimized: ${(origSizeKb / 1024).toFixed(1)}MB → ${compressedSizeKb}KB`
          : `Optimized: ${origSizeKb}KB → ${compressedSizeKb}KB`
      );
    } catch (err: any) {
      setErrorMsg("Failed to read image. Please try another file.");
      setCompressionInfo("");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg("Please enter an image URL.");
      return;
    }
    setErrorMsg("");
    setSelectedBanner(urlInput.trim());
    setCompressionInfo("URL loaded");
  };

  const handleSaveBanner = async () => {
    if (!selectedBanner) {
      setErrorMsg("Please select or upload a banner image.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    // Resolve credentials
    const resolvedPassword =
      teamPassword ||
      localStorage.getItem("event_team_pass") ||
      "";

    try {
      const res = await fetch("/api/teams/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: team.id,
          password: resolvedPassword,
          gmPassword: gmPassword || localStorage.getItem("event_gm_pass") || undefined,
          banner: selectedBanner
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg("Team banner updated successfully!");
        onBannerUpdated();
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || "Failed to update banner. Please check credentials.");
      }
    } catch (err) {
      setErrorMsg("Network error updating banner. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#1C1815] border border-[#F9B800]/50 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#F9B800]/20 bg-[#14110F]">
          <div className="flex items-center gap-2.5">
            <TexasDrumstickBadge size="xs" />
            <div>
              <h3 className="font-display font-black text-sm uppercase tracking-wider text-white">
                Customize Team Card Art & Banner
              </h3>
              <p className="text-[10px] text-gray-400 font-mono uppercase">
                {team.name} • Texas Chicken Championship
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Live Preview Card */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-[#F9B800] mb-1.5">
              Live Banner Preview
            </label>
            <div className="relative h-40 w-full overflow-hidden border border-[#F9B800]/40 bg-[#14110F]">
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-300"
                style={{ backgroundImage: `url('${selectedBanner}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1C1815] via-[#1C1815]/50 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h4
                  className="font-display font-black text-xl uppercase tracking-tight"
                  style={{ color: team.color }}
                >
                  {team.name}
                </h4>
                <p className="text-[9px] text-gray-300 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-[#F9B800]" />
                  <span>Championship Contender</span>
                </p>
              </div>
            </div>
            {compressionInfo && (
              <p className="text-[10px] font-mono text-emerald-400 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" /> {compressionInfo}
              </p>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-[#BE2403]/20 border border-[#BE2403] text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#FF4A3D]" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#F9B800]/20">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "upload"
                  ? "border-[#BE2403] text-white bg-[#BE2403]/10"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "presets"
                  ? "border-[#BE2403] text-white bg-[#BE2403]/10"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Preset Themes
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "url"
                  ? "border-[#BE2403] text-white bg-[#BE2403]/10"
                  : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              <Link className="w-3.5 h-3.5" /> Direct URL
            </button>
          </div>

          {/* Tab 1: Upload File */}
          {activeTab === "upload" && (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#F9B800]/30 hover:border-[#F9B800] bg-[#14110F] p-6 text-center cursor-pointer transition-all group"
              >
                <Upload className="w-8 h-8 text-[#F9B800] mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-black uppercase tracking-wider text-white">
                  Tap to select an image from your device
                </p>
                <p className="text-[10px] text-gray-400 font-mono mt-1">
                  Supports JPG, PNG, WEBP • Automatically optimized for instant loading
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Presets */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {PRESET_BANNERS.map((preset) => {
                const isCurrent = selectedBanner === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedBanner(preset.url);
                      setCompressionInfo(`Selected preset: ${preset.name}`);
                    }}
                    className={`relative h-20 overflow-hidden border text-left cursor-pointer transition-all group ${
                      isCurrent
                        ? "border-[#F9B800] ring-2 ring-[#F9B800]/60 scale-[1.02]"
                        : "border-white/10 hover:border-white/40 opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundImage: `url('${preset.url}')` }}
                    />
                    <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors" />
                    <div className="absolute bottom-1.5 left-2 right-2">
                      <p className="text-[10px] font-black text-white uppercase tracking-wider truncate">
                        {preset.name}
                      </p>
                      <p className="text-[8px] font-mono text-[#F9B800] uppercase">
                        {preset.theme}
                      </p>
                    </div>
                    {isCurrent && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-[#F9B800] text-black flex items-center justify-center rounded-full">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeTab === "url" && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-gray-400">
                Paste Image Web Address
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-[#14110F] border border-[#F9B800]/30 px-3 py-2 text-xs font-mono text-white outline-none focus:border-[#F9B800]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#F9B800] text-black hover:bg-[#BE2403] hover:text-white text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#F9B800]/20 bg-[#14110F]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveBanner}
            disabled={loading}
            className="px-5 py-2.5 bg-[#BE2403] hover:bg-[#8F1A02] text-white border border-[#F9B800] text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 shadow-lg disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Save Banner</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
