import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, Compass, CheckCircle2, AlertCircle, HelpCircle, Loader2, ArrowLeft, Camera, ShieldCheck, FolderHeart } from "lucide-react";
import { Team, CSIProgress, Question } from "../types";

interface CSIHuntProps {
  currentTeam: Team;
  teamProgress: CSIProgress;
  onStateUpdated: () => void;
  onBack: () => void;
}

export default function CSIHunt({ currentTeam, teamProgress, onStateUpdated, onBack }: CSIHuntProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  
  // Gameplay states
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingPreview, setAnalyzingPreview] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<{ match: boolean; confidence: number; reason: string } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [selectedClueIndex, setSelectedClueIndex] = useState<number>(teamProgress.currentQ);

  // Fetch clue questions metadata from server
  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/csi/questions");
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
          // Set to active progress clue
          setSelectedClueIndex(Math.min(teamProgress.currentQ, data.length - 1));
        }
      } catch (err) {
        console.error("Failed to load CSI questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [teamProgress.currentQ]);

  // Adjust selected index when progress changes
  React.useEffect(() => {
    if (questions.length > 0) {
      setSelectedClueIndex(Math.min(teamProgress.currentQ, questions.length - 1));
    }
  }, [teamProgress.currentQ, questions.length]);

  // Utility to compress base64 images before upload
  const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 600): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.75));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const handleBuyHint = async () => {
    const activeQ = questions[selectedClueIndex];
    if (!activeQ) return;

    if (currentTeam.score < activeQ.hintCost) {
      alert(`❌ Insufficient score. Buying a hint costs ${activeQ.hintCost} pts, but your team has ${currentTeam.score} pts.`);
      return;
    }

    if (!confirm(`Are you sure you want to buy a hint for ${activeQ.hintCost} points? This will deduct points from your team's score.`)) return;

    setHintLoading(true);
    try {
      const res = await fetch("/api/csi/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: currentTeam.id,
          password: currentTeam.password,
          qIndex: selectedClueIndex
        })
      });

      if (res.ok) {
        onStateUpdated();
        alert("💡 Hint purchased successfully!");
      } else {
        const d = await res.json();
        alert(d.error || "Failed to purchase hint.");
      }
    } catch (err) {
      alert("Error reaching server.");
    } finally {
      setHintLoading(false);
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setApiResult(null);
    setAnalyzing(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const rawBase64 = event.target?.result as string;
      setAnalyzingPreview(rawBase64);

      try {
        const compressedBase64 = await compressImage(rawBase64);

        const res = await fetch("/api/csi/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: currentTeam.id,
            password: currentTeam.password,
            qIndex: selectedClueIndex,
            imageBase64: compressedBase64
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setApiResult({
            match: data.match,
            confidence: data.confidence,
            reason: data.reason
          });
          onStateUpdated();
        } else {
          alert(data.error || "Failed to process photo analysis.");
          setAnalyzing(false);
        }
      } catch (err) {
        alert("Verification request failed. Please try again.");
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const closeAnalysisModal = () => {
    setAnalyzing(false);
    setAnalyzingPreview(null);
    setApiResult(null);
  };

  if (loadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-2" />
        <p className="text-sm">Initiating crime scene databases...</p>
      </div>
    );
  }

  const activeQ = questions[selectedClueIndex];
  const isSolved = teamProgress.answered.includes(selectedClueIndex);
  const hintBought = teamProgress.hintsBought.includes(selectedClueIndex);
  const isLocked = selectedClueIndex > teamProgress.currentQ;
  const isFinished = teamProgress.currentQ >= questions.length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/15 bg-black/60 flex items-center justify-center text-white">
            <Search className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wider text-white">C.S.I. Forensic Hunt</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Scan crime scene locations and analyze target evidence</p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-black border border-white/10 text-white hover:bg-white hover:text-black hover:border-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      {/* Shared Google Drive Photo Upload Banner */}
      <div className="border border-white/15 bg-black/60 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-white/10 bg-black flex items-center justify-center text-white shrink-0">
            <FolderHeart className="w-4 h-4 text-accent-gold" />
          </div>
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-white block">Group Photos Shared Drive</span>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest">Share high-quality team photos directly with the event coordinators</span>
          </div>
        </div>
        <a
          href="https://drive.google.com/drive/folders/1nn30TVMmXzemFAKHTmEUHEj9hkCtcI1v?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-center px-4 py-2.5 bg-black border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shrink-0"
        >
          Upload Group Photos
        </a>
      </div>

      {/* CSI Clue Progress Slider */}
      <div className="border border-white/10 bg-black/30 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="micro-label">Clue Progress Navigator</span>
          <span className="font-mono text-xs font-black text-accent-gold uppercase tracking-wider">
            {teamProgress.answered.length} / {questions.length} Solved
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" id="csi-progress-track">
          {questions.map((q, idx) => {
            const isQSolved = teamProgress.answered.includes(idx);
            const isQActive = idx === teamProgress.currentQ;
            const isQLocked = idx > teamProgress.currentQ;

            let borderStyle = "border-white/10 bg-black/40 text-gray-500";
            if (isQSolved) {
              borderStyle = "border-emerald-500/55 bg-emerald-500/10 text-emerald-400";
            } else if (isQActive) {
              borderStyle = "border-white bg-white/10 text-white";
            }

            const isSelected = selectedClueIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => {
                  if (idx <= teamProgress.currentQ) {
                    setSelectedClueIndex(idx);
                  } else {
                    alert("🔒 This clue is locked! You must solve current clues in sequence.");
                  }
                }}
                disabled={isQLocked}
                className={`w-10 h-10 flex items-center justify-center font-mono font-black text-xs border transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${borderStyle} ${
                  isSelected ? "ring-2 ring-accent-gold ring-offset-2 ring-offset-black" : ""
                }`}
              >
                {isQSolved ? "✓" : idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Clue Card Panel */}
      {isFinished ? (
        <div className="border border-white/15 bg-black/60 p-10 text-center space-y-6">
          <div className="w-16 h-16 border border-accent-gold/20 bg-black flex items-center justify-center mx-auto text-accent-gold">
            <ShieldCheck className="w-8 h-8 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-black text-2xl text-white uppercase tracking-tight">CASE CLOSED</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto uppercase tracking-wider leading-relaxed">
              Sensational work! All clues solved and forensic databases secured.
            </p>
          </div>
          <div className="text-sm font-mono font-black text-emerald-400 bg-emerald-500/10 inline-block px-6 py-2.5 border border-emerald-500/20 uppercase tracking-widest">
            Total Solved: {teamProgress.answered.length} / {questions.length}
          </div>
          <button
            onClick={onBack}
            className="block w-full py-4 bg-white text-black hover:bg-black hover:text-white border border-white font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer"
          >
            Return to Team Dashboard
          </button>
        </div>
      ) : (
        activeQ && (
          <div className="border border-white/15 bg-black/60 p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Clue Category tag */}
            <div className="flex justify-between items-start">
              <span className="text-[10px] tracking-widest font-black uppercase border border-white/20 bg-white/5 px-3 py-1 font-mono text-white">
                Forensics Mission #{selectedClueIndex + 1}
              </span>
              <span className="font-mono text-xs font-bold bg-black px-2.5 py-1 border border-white/10">
                Reward: <span className="text-emerald-400 font-black">+{activeQ.solvePoints} PTS</span>
              </span>
            </div>

            {/* Clue statement */}
            <div className="space-y-2">
              <span className="micro-label">Mission Clue Description</span>
              <p className="text-lg font-black text-white leading-relaxed font-display uppercase tracking-tight">
                "{activeQ.clue}"
              </p>
            </div>

            {/* Hint reveal or purchase block */}
            <div className="border-t border-white/10 pt-5">
              {hintBought ? (
                <div className="bg-accent-gold/5 border border-accent-gold/20 p-4 space-y-1">
                  <span className="text-[9px] uppercase font-black tracking-widest text-accent-gold block">💡 Forensic Clue Analysis (Unlocked Hint)</span>
                  <p className="text-xs text-white leading-relaxed">
                    {activeQ.hint}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-black/40 border border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 border border-accent-gold/20 bg-black flex items-center justify-center text-accent-gold shrink-0">
                      <HelpCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white block">Stuck on this location?</span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest">Deduct score points to unlock coordinates</span>
                    </div>
                  </div>

                  <button
                    onClick={handleBuyHint}
                    disabled={hintLoading || currentTeam.score < activeQ.hintCost}
                    className="w-full sm:w-auto px-4 py-2.5 bg-black border border-accent-gold text-accent-gold hover:bg-accent-gold hover:text-black font-black text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {hintLoading ? "Purchasing..." : `Buy Hint (-${activeQ.hintCost} PTS)`}
                  </button>
                </div>
              )}
            </div>

            {/* Evidence Submission upload panel */}
            <div className="border-t border-white/10 pt-5 space-y-4">
              <span className="micro-label">Submit Evidence</span>

              {isSolved ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 p-5 space-y-3 text-center">
                  <div className="w-10 h-10 border border-emerald-500/20 bg-black flex items-center justify-center text-emerald-400 mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-black text-xs uppercase tracking-widest text-emerald-400">Evidence Confirmed</h5>
                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">This clue has been solved successfully. Your points have been synchronized.</p>
                  </div>
                  
                  {/* Display group's uploaded photo answer */}
                  {(() => {
                    const uploadedPhoto = teamProgress.answers?.[selectedClueIndex] || teamProgress.answers?.[String(selectedClueIndex)];
                    if (uploadedPhoto) {
                      return (
                        <div className="mt-4 pt-4 border-t border-emerald-500/20 max-w-xs mx-auto space-y-2">
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 block text-left">
                            📸 Submitting Group Evidence Image
                          </span>
                          <div className="border border-white/10 bg-black/80 p-2 shadow-inner">
                            <img
                              src={uploadedPhoto}
                              alt="Group evidence"
                              className="w-full aspect-[4/3] object-cover border border-white/5"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    id="csi-upload-input"
                    accept="image/*"
                    onChange={handleEvidenceUpload}
                    className="hidden"
                    disabled={analyzing}
                  />
                  <button
                    onClick={() => document.getElementById("csi-upload-input")?.click()}
                    disabled={analyzing}
                    className="w-full py-8 border border-dashed border-white/15 hover:border-white bg-black/40 hover:bg-black/70 flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all duration-300"
                  >
                    <div className="w-12 h-12 border border-white/10 bg-black flex items-center justify-center text-white mb-3">
                      <Camera className="w-5 h-5 text-accent-gold" />
                    </div>
                    <span className="font-black text-xs uppercase tracking-widest text-white">Upload Photo Evidence</span>
                    <span className="text-[9px] text-gray-500 mt-1.5 uppercase tracking-widest max-w-xs leading-relaxed">Take a snapshot on location or select an existing photo. Our AI forensics analyzer will match the evidence.</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Case Logs Solved History */}
      {teamProgress.answered.length > 0 && (
        <div className="border border-white/10 bg-black/30 p-6 space-y-3">
          <span className="micro-label flex items-center gap-2">
            <FolderHeart className="w-3.5 h-3.5 text-accent-gold" />
            <span>📁 Solved Case Dossiers</span>
          </span>
          <div className="space-y-2">
            {teamProgress.answered.map((qIdx) => {
              const q = questions[qIdx];
              if (!q) return null;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3.5 bg-black/40 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 border border-emerald-500/20 bg-black flex items-center justify-center text-xs font-mono font-black text-emerald-400 shrink-0">
                      ✓
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-gray-300 truncate max-w-xs sm:max-w-md">
                      Clue #{qIdx + 1}: "{q.clue}"
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 shrink-0">
                    +{q.solvePoints} PTS
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Screen AI Scanning / Verification Modal Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-black border border-white/15 p-8 text-center space-y-6 relative overflow-hidden">
            
            <div className="space-y-2">
              <h3 className="font-display font-black text-sm uppercase tracking-[0.2em] text-white">AI Forensic Lab</h3>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Processing evidence against crime scene target data...</p>
            </div>

            {/* Scan Image block with sweeping line */}
            {analyzingPreview && (
              <div className="aspect-[4/3] w-full max-w-xs mx-auto bg-black border border-white/15 overflow-hidden relative shadow-lg">
                <img
                  src={analyzingPreview}
                  alt="Scanning Preview"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                
                {/* Visual Sweeper */}
                <div className="absolute left-0 right-0 h-1 bg-accent-gold/80 shadow-[0_0_15px_rgba(212,175,55,0.8)] animate-bounce animate-duration-1000" style={{ top: "45%", animation: "bounce 2s infinite ease-in-out" }} />
              </div>
            )}

            {!apiResult ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
                <span className="text-[9px] font-mono text-accent-gold font-black animate-pulse tracking-widest uppercase">
                  COMPARING PIXELS & SIGNATURES...
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                {apiResult.match ? (
                  <div className="space-y-4">
                    <div className="w-14 h-14 border border-emerald-500/20 bg-black flex items-center justify-center text-emerald-400 mx-auto">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm uppercase tracking-wider text-emerald-400">EVIDENCE APPROVED</h4>
                      <div className="text-3xl font-mono font-black text-emerald-400">{apiResult.confidence}% Match</div>
                    </div>
                    <p className="text-xs text-gray-300 bg-black/80 border border-white/10 p-3 max-w-sm mx-auto leading-relaxed uppercase tracking-wider font-light text-[11px]">
                      "{apiResult.reason}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-14 h-14 border border-red-500/20 bg-black flex items-center justify-center text-red-400 mx-auto">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-black text-sm uppercase tracking-wider text-red-400">EVIDENCE REJECTED</h4>
                      <div className="text-3xl font-mono font-black text-red-400">{apiResult.confidence}% Match</div>
                    </div>
                    <p className="text-xs text-gray-300 bg-black/80 border border-white/10 p-3 max-w-sm mx-auto leading-relaxed uppercase tracking-wider font-light text-[11px]">
                      "{apiResult.reason}"
                    </p>
                  </div>
                )}

                <button
                  onClick={closeAnalysisModal}
                  className="w-full py-4 bg-white text-black hover:bg-black hover:text-white border border-white font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer"
                >
                  {apiResult.match ? "Accept & Proceed" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
