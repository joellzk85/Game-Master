import React, { useState } from "react";
import { Search, CheckCircle2, AlertCircle, HelpCircle, Loader2, ArrowLeft, Camera, ShieldCheck, FolderHeart } from "lucide-react";
import { Team, CSIProgress, Question } from "../types";

interface CSIHuntProps {
  currentTeam: Team;
  teamPassword?: string;
  teamProgress: CSIProgress;
  onStateUpdated: () => void;
  onBack: () => void;
}

export default function CSIHunt({
  currentTeam,
  teamPassword,
  teamProgress,
  onStateUpdated,
  onBack
}: CSIHuntProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzingPreview, setAnalyzingPreview] = useState<string | null>(null);
  const [apiResult, setApiResult] = useState<{ match: boolean; confidence: number; reason: string } | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [selectedClueIndex, setSelectedClueIndex] = useState<number>(teamProgress.currentQ);
  const [notice, setNotice] = useState<string>("");

  const resolvedPassword =
    teamPassword || currentTeam.password || localStorage.getItem("event_team_pass") || "";

  React.useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`/api/csi/questions?teamId=${currentTeam.id}`);
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
          setSelectedClueIndex(Math.min(teamProgress.currentQ, data.length - 1));
        }
      } catch (err) {
        console.error("Failed to load CSI questions", err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchQuestions();
  }, [teamProgress.currentQ, teamProgress.hintsBought.length, currentTeam.id]);

  React.useEffect(() => {
    if (questions.length > 0) {
      setSelectedClueIndex(Math.min(teamProgress.currentQ, questions.length - 1));
    }
  }, [teamProgress.currentQ, questions.length]);

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
      setNotice(`Insufficient score. Hint costs ${activeQ.hintCost} PTS.`);
      return;
    }

    setHintLoading(true);
    setNotice("");
    try {
      const res = await fetch("/api/csi/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: currentTeam.id,
          password: resolvedPassword,
          qIndex: selectedClueIndex
        })
      });

      const d = await res.json();
      if (res.ok && d.success) {
        onStateUpdated();
        setNotice("Hint unlocked.");
      } else {
        setNotice(d.error || "Failed to unlock hint.");
      }
    } catch (err) {
      setNotice("Error reaching server.");
    } finally {
      setHintLoading(false);
    }
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setApiResult(null);
    setAnalyzing(true);
    setNotice("");

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
            password: resolvedPassword,
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
          setNotice(data.error || "Failed to process photo analysis.");
          setAnalyzing(false);
        }
      } catch (err) {
        setNotice("Verification request failed. Please try again.");
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
      <div className="flex flex-col items-center justify-center p-12 text-[#58585a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#5bc09f] mb-2" />
        <p className="text-sm font-bold">Loading clues...</p>
      </div>
    );
  }

  const activeQ = questions[selectedClueIndex];
  const isSolved = teamProgress.answered.includes(selectedClueIndex);
  const hintBought = teamProgress.hintsBought.includes(selectedClueIndex);
  const isFinished = teamProgress.currentQ >= questions.length;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#5bc09f] bg-[#5bc09f]/10 flex items-center justify-center text-[#5bc09f]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
              C.S.I. Forensic Hunt
            </h2>
            <p className="text-xs text-[#58585a]/70 mt-0.5">
              Scan locations and verify target evidence
            </p>
          </div>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] border border-[#58585a]/25 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {notice && (
        <div className="p-3.5 border border-[#5bc09f] bg-[#5bc09f]/10 text-xs font-bold text-[#58585a]">
          {notice}
        </div>
      )}

      {/* Shared Google Drive Photo Upload Banner */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border border-[#58585a]/20 bg-[#ffffff] flex items-center justify-center text-[#5bc09f] shrink-0">
            <FolderHeart className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#58585a] block">
              Group Photos Shared Drive
            </span>
            <span className="text-xs text-[#58585a]/70">
              Share high-quality team photos directly with event coordinators
            </span>
          </div>
        </div>
        <a
          href="https://drive.google.com/drive/folders/1nn30TVMmXzemFAKHTmEUHEj9hkCtcI1v?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto text-center px-4 py-2.5 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shrink-0"
        >
          Upload Group Photos
        </a>
      </div>

      {/* CSI Clue Progress Slider */}
      <div className="border border-[#58585a]/20 bg-[#ffffff] p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="micro-label">Clue Progress</span>
          <span className="font-mono text-xs font-bold text-[#5bc09f] uppercase tracking-wider tabular-nums">
            {teamProgress.answered.length} / {questions.length} Solved
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2" id="csi-progress-track">
          {questions.map((q, idx) => {
            const isQSolved = teamProgress.answered.includes(idx);
            const isQActive = idx === teamProgress.currentQ;
            const isQLocked = idx > teamProgress.currentQ;

            let borderStyle = "border-[#58585a]/20 bg-[#ffffff] text-[#58585a]/50";
            if (isQSolved) {
              borderStyle = "border-[#5bc09f] bg-[#5bc09f] text-[#ffffff]";
            } else if (isQActive) {
              borderStyle = "border-[#58585a] bg-[#ffffff] text-[#58585a]";
            }

            const isSelected = selectedClueIndex === idx;

            return (
              <button
                key={q.id}
                onClick={() => {
                  if (idx <= teamProgress.currentQ) {
                    setSelectedClueIndex(idx);
                  }
                }}
                disabled={isQLocked}
                className={`w-10 h-10 flex items-center justify-center font-mono font-bold text-xs border transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${borderStyle} ${
                  isSelected ? "ring-2 ring-[#5bc09f] ring-offset-2" : ""
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
        <div className="border border-[#58585a]/20 bg-[#ffffff] p-10 text-center space-y-6">
          <div className="w-16 h-16 border border-[#5bc09f] bg-[#5bc09f]/10 flex items-center justify-center mx-auto text-[#5bc09f]">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl text-[#58585a] uppercase tracking-tight">
              All Clues Completed
            </h3>
            <p className="text-xs text-[#58585a]/75 max-w-sm mx-auto leading-relaxed">
              Every clue in this challenge has been solved and verified.
            </p>
          </div>
          <div className="text-sm font-mono font-bold text-[#5bc09f] uppercase tracking-wider">
            Total Solved: {teamProgress.answered.length} / {questions.length}
          </div>
          <button
            onClick={onBack}
            className="block w-full py-3.5 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
          >
            Return to Team Portal
          </button>
        </div>
      ) : (
        activeQ && (
          <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 sm:p-8 space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                Mission #{selectedClueIndex + 1}
              </span>
              <span className="font-mono text-xs font-bold text-[#5bc09f] tabular-nums">
                Reward: +{activeQ.solvePoints} PTS
              </span>
            </div>

            <div className="space-y-2">
              <span className="micro-label">Clue Description</span>
              <p className="text-lg font-bold text-[#58585a] leading-relaxed font-display">
                "{activeQ.clue}"
              </p>
            </div>

            {/* Hint block */}
            <div className="border-t border-[#58585a]/15 pt-5">
              {hintBought ? (
                <div className="bg-[#5bc09f]/10 border border-[#5bc09f] p-4 space-y-1">
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#58585a] block">
                    Unlocked Hint
                  </span>
                  <p className="text-xs text-[#58585a] leading-relaxed">
                    {activeQ.hint || "Inspect the clue surroundings closely."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-[#ffffff] border border-[#58585a]/20">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="w-5 h-5 text-[#5bc09f] shrink-0" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#58585a] block">
                        Need a hint?
                      </span>
                      <span className="text-xs text-[#58585a]/70">
                        Unlock location guidance for this clue
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleBuyHint}
                    disabled={hintLoading || currentTeam.score < activeQ.hintCost}
                    className="w-full sm:w-auto px-4 py-2.5 bg-[#ffffff] border border-[#5bc09f] text-[#58585a] hover:bg-[#5bc09f] hover:text-[#ffffff] font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {hintLoading ? "Unlocking..." : `Buy Hint (-${activeQ.hintCost} PTS)`}
                  </button>
                </div>
              )}
            </div>

            {/* Evidence Submission */}
            <div className="border-t border-[#58585a]/15 pt-5 space-y-4">
              <span className="micro-label">Submit Evidence</span>

              {isSolved ? (
                <div className="bg-[#5bc09f]/10 border border-[#5bc09f] p-5 space-y-3 text-center">
                  <CheckCircle2 className="w-6 h-6 text-[#5bc09f] mx-auto" />
                  <div>
                    <h5 className="font-bold text-xs uppercase tracking-wider text-[#58585a]">
                      Evidence Confirmed
                    </h5>
                    <p className="text-xs text-[#58585a]/75 mt-1">
                      This clue has been solved and points have been awarded.
                    </p>
                  </div>

                  {(() => {
                    const uploadedPhoto =
                      teamProgress.answers?.[selectedClueIndex] ||
                      teamProgress.answers?.[String(selectedClueIndex)];
                    if (uploadedPhoto) {
                      return (
                        <div className="mt-4 pt-4 border-t border-[#5bc09f]/30 max-w-xs mx-auto space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#58585a] block text-left">
                            Submitted Evidence Image
                          </span>
                          <div className="border border-[#58585a]/20 bg-[#ffffff] p-2">
                            <img
                              src={uploadedPhoto}
                              alt="Group evidence"
                              className="w-full aspect-[4/3] object-cover"
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
                    className="w-full py-8 border border-dashed border-[#58585a]/35 hover:border-[#5bc09f] bg-[#ffffff] hover:bg-[#5bc09f]/5 flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-colors"
                  >
                    <Camera className="w-6 h-6 text-[#5bc09f] mb-2.5" />
                    <span className="font-bold text-xs uppercase tracking-wider text-[#58585a]">
                      Upload Photo Evidence
                    </span>
                    <span className="text-xs text-[#58585a]/70 mt-1 max-w-xs">
                      Take a photo on location or choose an image from your device for verification.
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Solved History */}
      {teamProgress.answered.length > 0 && (
        <div className="border border-[#58585a]/20 bg-[#ffffff] p-6 space-y-3">
          <span className="micro-label">Solved Clues</span>
          <div className="space-y-2">
            {teamProgress.answered.map((qIdx) => {
              const q = questions[qIdx];
              if (!q) return null;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between p-3.5 bg-[#ffffff] border border-[#58585a]/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-[#5bc09f] text-[#ffffff] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                      ✓
                    </span>
                    <span className="text-xs font-bold text-[#58585a] truncate max-w-xs sm:max-w-md">
                      Clue #{qIdx + 1}: "{q.clue}"
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#5bc09f] shrink-0 tabular-nums">
                    +{q.solvePoints} PTS
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification Modal Overlay */}
      {analyzing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#ffffff] border border-[#58585a]/30 p-8 text-center space-y-6">
            <div className="space-y-1">
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-[#58585a]">
                Evidence Verification
              </h3>
              <p className="text-xs text-[#58585a]/70">
                Analyzing uploaded photo against clue target...
              </p>
            </div>

            {analyzingPreview && (
              <div className="aspect-[4/3] w-full max-w-xs mx-auto bg-[#58585a]/5 border border-[#58585a]/20 overflow-hidden relative">
                <img
                  src={analyzingPreview}
                  alt="Scanning Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {!apiResult ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-[#5bc09f]" />
                <span className="text-xs font-mono text-[#58585a] font-bold uppercase">
                  Verifying evidence...
                </span>
              </div>
            ) : (
              <div className="space-y-5">
                {apiResult.match ? (
                  <div className="space-y-3">
                    <ShieldCheck className="w-10 h-10 text-[#5bc09f] mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wider text-[#5bc09f]">
                        Evidence Approved
                      </h4>
                      <div className="text-2xl font-mono font-bold text-[#58585a] tabular-nums">
                        {apiResult.confidence}% Match
                      </div>
                    </div>
                    <p className="text-xs text-[#58585a] bg-[#5bc09f]/10 border border-[#5bc09f] p-3">
                      {apiResult.reason}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AlertCircle className="w-10 h-10 text-[#58585a] mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm uppercase tracking-wider text-[#58585a]">
                        Evidence Not Matched
                      </h4>
                      <div className="text-2xl font-mono font-bold text-[#58585a] tabular-nums">
                        {apiResult.confidence}% Match
                      </div>
                    </div>
                    <p className="text-xs text-[#58585a] bg-[#58585a]/5 border border-[#58585a]/20 p-3">
                      {apiResult.reason}
                    </p>
                  </div>
                )}

                <button
                  onClick={closeAnalysisModal}
                  className="w-full py-3.5 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  {apiResult.match ? "Continue" : "Try Again"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
