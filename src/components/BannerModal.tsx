import React, { useState, useRef } from "react";
import { X, Upload, Image as ImageIcon, Check, AlertCircle, Link, RefreshCw } from "lucide-react";
import { Team } from "../types";
import { compressBannerImage } from "../utils/imageCompressor";

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
    id: "mint-geometric",
    name: "Mint Clean Slate",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='1200' height='400' fill='%235bc09f'/><circle cx='1050' cy='80' r='220' fill='%23ffffff' fill-opacity='0.12'/><circle cx='200' cy='360' r='180' fill='%2358585a' fill-opacity='0.12'/></svg>",
    theme: "Primary Accent"
  },
  {
    id: "slate-minimal",
    name: "Slate Minimalist",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='1200' height='400' fill='%2358585a'/><rect x='750' y='-100' width='350' height='600' transform='rotate(18 750 200)' fill='%235bc09f' fill-opacity='0.25'/></svg>",
    theme: "Charcoal Slate"
  },
  {
    id: "duo-diagonal",
    name: "Dual Split Horizon",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='1200' height='400' fill='%2358585a'/><polygon points='0,0 720,0 480,400 0,400' fill='%235bc09f'/></svg>",
    theme: "Mint & Slate"
  },
  {
    id: "grid-matrix",
    name: "Architectural Grid",
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='400'><rect width='1200' height='400' fill='%2343967b'/><line x1='0' y1='100' x2='1200' y2='100' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/><line x1='0' y1='200' x2='1200' y2='200' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/><line x1='0' y1='300' x2='1200' y2='300' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/><line x1='300' y1='0' x2='300' y2='400' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/><line x1='600' y1='0' x2='600' y2='400' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/><line x1='900' y1='0' x2='900' y2='400' stroke='%23ffffff' stroke-opacity='0.15' stroke-width='2'/></svg>",
    theme: "Clean Structure"
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
        }, 900);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-[#ffffff] border border-[#58585a]/30 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#58585a]/20 bg-[#ffffff]">
          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
              Customize Team Banner
            </h3>
            <p className="text-xs text-[#58585a]/70 mt-0.5">
              {team.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#58585a]/70 hover:text-[#58585a] hover:bg-[#58585a]/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Live Preview Card */}
          <div>
            <label className="micro-label mb-1.5">
              Live Banner Preview
            </label>
            <div className="relative h-40 w-full overflow-hidden border border-[#58585a]/25 bg-[#58585a]/10">
              <div
                className="w-full h-full bg-cover bg-center transition-all duration-300"
                style={{ backgroundImage: `url("${selectedBanner}")` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <h4 className="font-display font-bold text-xl uppercase tracking-tight text-[#ffffff]">
                  {team.name}
                </h4>
              </div>
            </div>
            {compressionInfo && (
              <p className="text-xs font-mono text-[#5bc09f] mt-1.5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> {compressionInfo}
              </p>
            )}
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3 bg-[#58585a]/10 border border-[#58585a] text-[#58585a] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-[#5bc09f]/15 border border-[#5bc09f] text-[#58585a] text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-[#5bc09f]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#58585a]/20">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "upload"
                  ? "border-[#5bc09f] text-[#58585a] bg-[#5bc09f]/5"
                  : "border-transparent text-[#58585a]/60 hover:text-[#58585a]"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "presets"
                  ? "border-[#5bc09f] text-[#58585a] bg-[#5bc09f]/5"
                  : "border-transparent text-[#58585a]/60 hover:text-[#58585a]"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Clean Presets
            </button>
            <button
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                activeTab === "url"
                  ? "border-[#5bc09f] text-[#58585a] bg-[#5bc09f]/5"
                  : "border-transparent text-[#58585a]/60 hover:text-[#58585a]"
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
                className="border border-dashed border-[#58585a]/35 hover:border-[#5bc09f] bg-[#ffffff] p-6 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-7 h-7 text-[#5bc09f] mx-auto mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                  Select an image from your device
                </p>
                <p className="text-[11px] text-[#58585a]/70 mt-1">
                  Supports JPG, PNG, WEBP · Automatically optimized for instant loading
                </p>
              </div>
            </div>
          )}

          {/* Tab 2: Presets */}
          {activeTab === "presets" && (
            <div className="grid grid-cols-2 gap-3 p-1">
              {PRESET_BANNERS.map((preset) => {
                const isCurrent = selectedBanner === preset.url;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedBanner(preset.url);
                      setCompressionInfo(`Selected preset: ${preset.name}`);
                    }}
                    className={`relative h-20 overflow-hidden border text-left cursor-pointer transition-all ${
                      isCurrent
                        ? "border-[#5bc09f] ring-2 ring-[#5bc09f]/40"
                        : "border-[#58585a]/20 hover:border-[#5bc09f]"
                    }`}
                  >
                    <div
                      className="w-full h-full bg-cover bg-center"
                      style={{ backgroundImage: `url("${preset.url}")` }}
                    />
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute bottom-2 left-2.5 right-2.5">
                      <p className="text-xs font-bold text-[#ffffff] uppercase tracking-wider truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-[#ffffff]/80">
                        {preset.theme}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Tab 3: Direct URL */}
          {activeTab === "url" && (
            <div className="space-y-2">
              <label className="micro-label">
                Image Web Address
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 bg-[#ffffff] border border-[#58585a]/30 px-3 py-2 text-xs font-mono text-[#58585a] outline-none focus:border-[#5bc09f]"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-4 py-2 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Preview
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 p-4 border-t border-[#58585a]/20 bg-[#ffffff]">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-[#58585a]/25 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveBanner}
            disabled={loading}
            className="px-5 py-2 bg-[#5bc09f] hover:bg-[#58585a] text-[#ffffff] border border-[#5bc09f] hover:border-[#58585a] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
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
