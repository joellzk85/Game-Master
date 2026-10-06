import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon, Trash2, StopCircle, ArrowLeft, UploadCloud, Film } from "lucide-react";
import { GalleryPhoto, Team } from "../types";
import { formatRealTime, formatRelativeTime } from "../utils/time";

interface CameraGalleryProps {
  userRole: "gm" | "group" | null;
  currentTeam: Team | null;
  gallery: GalleryPhoto[];
  gmPassword: string;
  onPhotoUploaded: () => void;
  onBack: () => void;
}

export default function CameraGallery({
  userRole,
  currentTeam,
  gallery,
  gmPassword,
  onPhotoUploaded,
  onBack
}: CameraGalleryProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

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

  const startCamera = async () => {
    setCameraError("");
    setStatusMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      setCameraStream(stream);
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setCameraError("Camera access denied or unavailable. Please verify browser permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawBase64 = canvas.toDataURL("image/png");

    setLoading(true);
    setStatusMessage("");
    try {
      const compressedBase64 = await compressImage(rawBase64);
      const teamLabel = userRole === "gm" ? "Game Master" : currentTeam?.name || "Participant";

      const res = await fetch("/api/gallery/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamName: teamLabel,
          imageBase64: compressedBase64
        })
      });

      if (res.ok) {
        onPhotoUploaded();
        setStatusMessage("Photo captured and saved to the event gallery.");
      } else {
        setStatusMessage("Failed to sync captured photo with server.");
      }
    } catch (err) {
      setStatusMessage("Error saving captured photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    setStatusMessage("");
    try {
      const teamLabel = userRole === "gm" ? "Game Master" : currentTeam?.name || "Participant";

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const rawBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result as string);
          reader.readAsDataURL(file);
        });

        const compressedBase64 = await compressImage(rawBase64);

        await fetch("/api/gallery/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamName: teamLabel,
            imageBase64: compressedBase64
          })
        });
      }
      onPhotoUploaded();
      setStatusMessage("Photos uploaded to the gallery.");
    } catch (err) {
      setStatusMessage("Failed to upload some images.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    setStatusMessage("");
    try {
      const passwordKey =
        userRole === "gm"
          ? gmPassword
          : currentTeam?.password || localStorage.getItem("event_team_pass") || "";

      const res = await fetch("/api/gallery/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          password: passwordKey
        })
      });

      if (res.ok) {
        onPhotoUploaded();
        setStatusMessage("Photo deleted.");
      } else {
        setStatusMessage("Unauthorized to delete this photo.");
      }
    } catch (err) {
      setStatusMessage("Failed to delete photo.");
    }
  };

  const switchTab = (tab: "camera" | "gallery") => {
    if (tab === "gallery" && cameraActive) {
      stopCamera();
    }
    setActiveTab(tab);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {flash && (
        <div
          className="fixed inset-0 bg-white z-50 pointer-events-none duration-200"
          style={{ animation: "flash 0.25s ease-out" }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#58585a]/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-[#5bc09f] bg-[#5bc09f]/10 flex items-center justify-center text-[#5bc09f]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base uppercase tracking-wider text-[#58585a]">
              Photo Gallery
            </h2>
            <p className="text-xs text-[#58585a]/70 mt-0.5">
              Capture team snapshots and browse shared photos
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#ffffff] border border-[#58585a]/25 text-[#58585a] hover:bg-[#58585a] hover:text-[#ffffff] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 border border-[#5bc09f] bg-[#5bc09f]/10 text-xs font-bold text-[#58585a]">
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#ffffff] border border-[#58585a]/20">
        <button
          onClick={() => switchTab("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${
            activeTab === "camera"
              ? "bg-[#5bc09f] text-[#ffffff]"
              : "text-[#58585a] hover:bg-[#58585a]/5"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Capture</span>
        </button>
        <button
          onClick={() => switchTab("gallery")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${
            activeTab === "gallery"
              ? "bg-[#5bc09f] text-[#ffffff]"
              : "text-[#58585a] hover:bg-[#58585a]/5"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Event Gallery ({gallery.length})</span>
        </button>
      </div>

      {/* Camera View */}
      {activeTab === "camera" && (
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-[#ffffff] border border-[#58585a]/20 overflow-hidden relative">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-[#58585a]">
                <div className="w-12 h-12 border border-[#5bc09f] bg-[#5bc09f]/10 flex items-center justify-center mb-4 text-[#5bc09f]">
                  <Film className="w-5 h-5" />
                </div>
                {cameraError ? (
                  <p className="text-[#58585a] text-xs font-bold max-w-sm mb-4">
                    {cameraError}
                  </p>
                ) : (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                      Camera Feed Inactive
                    </p>
                    <p className="text-xs text-[#58585a]/70 mt-1 max-w-xs">
                      Start your camera to capture team photos
                    </p>
                  </>
                )}
                <button
                  onClick={startCamera}
                  className="mt-5 px-5 py-2.5 bg-[#5bc09f] text-[#ffffff] hover:bg-[#58585a] text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Turn On Camera
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-[#5bc09f] hover:bg-[#58585a] disabled:opacity-50 text-[#ffffff] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{loading ? "Capturing..." : "Capture Photo"}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-5 py-3.5 bg-[#ffffff] border border-[#58585a]/30 hover:bg-[#58585a] hover:text-[#ffffff] text-[#58585a] transition-colors cursor-pointer"
                >
                  <StopCircle className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="w-full text-center">
                <input
                  type="file"
                  id="file-upload-input"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={loading}
                />
                <button
                  onClick={() => document.getElementById("file-upload-input")?.click()}
                  disabled={loading}
                  className="w-full py-4 bg-[#ffffff] border border-dashed border-[#58585a]/35 hover:border-[#5bc09f] text-[#58585a] font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-5 h-5 text-[#5bc09f]" />
                  <span>{loading ? "Uploading..." : "Select Photos From Device"}</span>
                </button>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}

      {/* Gallery View */}
      {activeTab === "gallery" && (
        <div className="space-y-4">
          {gallery.length === 0 ? (
            <div className="border border-[#58585a]/20 bg-[#ffffff] p-12 text-center text-[#58585a]">
              <ImageIcon className="w-8 h-8 text-[#58585a]/50 mx-auto mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#58585a]">
                No photos in the gallery yet
              </p>
              <p className="text-xs text-[#58585a]/70 mt-1">
                Uploaded and captured photos will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="global-gallery-grid">
              {gallery.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="aspect-square bg-[#58585a]/5 border border-[#58585a]/20 overflow-hidden relative group"
                >
                  <img
                    src={photo.url}
                    alt="Captured Moment"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                    <p className="font-bold text-xs text-[#ffffff] uppercase tracking-wider truncate">
                      {photo.teamName}
                    </p>
                    <span className="text-[10px] font-mono text-[#ffffff]/80 block mt-0.5">
                      {formatRealTime(photo.timestamp)}{" "}
                      {formatRelativeTime(photo.timestamp) ? `· ${formatRelativeTime(photo.timestamp)}` : ""}
                    </span>

                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-[#58585a] text-[#ffffff] flex items-center justify-center hover:bg-[#5bc09f] transition-colors cursor-pointer"
                      title="Delete snapshot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
