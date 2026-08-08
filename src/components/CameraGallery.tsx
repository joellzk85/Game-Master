import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Camera, Image as ImageIcon, Trash2, StopCircle, Play, ArrowLeft, UploadCloud, Film } from "lucide-react";
import { GalleryPhoto, Team } from "../types";

interface CameraGalleryProps {
  userRole: "gm" | "group" | null;
  currentTeam: Team | null;
  gallery: GalleryPhoto[];
  gmPassword: string;
  onPhotoUploaded: () => void;
  onBack: () => void;
}

export default function CameraGallery({ userRole, currentTeam, gallery, gmPassword, onPhotoUploaded, onBack }: CameraGalleryProps) {
  const [activeTab, setActiveTab] = useState<"camera" | "gallery">("camera");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [flash, setFlash] = useState(false);
  const [loading, setLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Utility to compress base64 images using Canvas to keep payloads small and fast
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
          resolve(canvas.toDataURL("image/jpeg", 0.75)); // compress as JPEG with 75% quality
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera on mobile
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
    
    // Trigger flash animation
    setFlash(true);
    setTimeout(() => setFlash(false), 250);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw the current video frame onto canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const rawBase64 = canvas.toDataURL("image/png");

    setLoading(true);
    try {
      const compressedBase64 = await compressImage(rawBase64);
      
      const teamLabel = userRole === "gm" ? "Game Master" : (currentTeam?.name || "Spectator");
      
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
        alert("📸 Photo captured and saved directly to the event gallery!");
      } else {
        alert("Failed to sync captured photo with server.");
      }
    } catch (err) {
      alert("Error saving captured photo.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const teamLabel = userRole === "gm" ? "Game Master" : (currentTeam?.name || "Spectator");

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
      alert("📁 Photos uploaded and synced with gallery!");
    } catch (err) {
      alert("Failed to upload some images.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo from the global gallery?")) return;
    
    try {
      const passwordKey = userRole === "gm" ? gmPassword : (currentTeam?.password || "");
      
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
        alert("🗑️ Photo deleted.");
      } else {
        alert("Unauthorized. You can only delete photos if you are the GM or of a matching team password.");
      }
    } catch (err) {
      alert("Failed to delete photo.");
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
      {flash && <div className="fixed inset-0 bg-white z-50 pointer-events-none animate-flash duration-200" style={{ animation: "flash 0.25s ease-out" }} />}
      
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-white/15 bg-black/60 flex items-center justify-center text-white">
            <Camera className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wider text-white">Live Lens Gallery</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">Capture team snapshots and browse active moments</p>
          </div>
        </div>
        <button
          onClick={() => {
            stopCamera();
            onBack();
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-black border border-white/10 text-white hover:bg-white hover:text-black hover:border-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-black border border-white/10">
        <button
          onClick={() => switchTab("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-black text-xs uppercase tracking-widest cursor-pointer transition-all ${
            activeTab === "camera"
              ? "bg-white text-black border border-white"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Capture</span>
        </button>
        <button
          onClick={() => switchTab("gallery")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 font-black text-xs uppercase tracking-widest cursor-pointer transition-all ${
            activeTab === "gallery"
              ? "bg-white text-black border border-white"
              : "text-gray-500 hover:text-white"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Event Gallery ({gallery.length})</span>
        </button>
      </div>

      {/* Camera View */}
      {activeTab === "camera" && (
        <div className="space-y-4">
          <div className="aspect-[4/3] bg-black border border-white/10 overflow-hidden relative">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
                <div className="w-12 h-12 border border-white/10 bg-black flex items-center justify-center mb-4 text-white">
                  <Film className="w-5 h-5 text-accent-gold" />
                </div>
                {cameraError ? (
                  <p className="text-red-400 text-xs font-mono font-black uppercase tracking-wider max-w-sm mb-4">{cameraError}</p>
                ) : (
                  <>
                    <p className="text-xs font-mono font-black uppercase tracking-wider text-white">Camera Feed Closed</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 max-w-xs leading-relaxed">Start your environment lens to capture championship moments</p>
                  </>
                )}
                <button
                  onClick={startCamera}
                  className="mt-6 px-5 py-3 bg-white text-black hover:bg-black hover:text-white hover:border-white border border-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Turn On Camera
                </button>
              </div>
            )}

            {/* Scanning overlay frame */}
            {cameraActive && (
              <div className="absolute inset-4 border border-white/10 pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-white/40" />
                  <span className="w-4 h-4 border-t-2 border-r-2 border-white/40" />
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-white/40" />
                  <span className="w-4 h-4 border-b-2 border-r-2 border-white/40" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            {cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  disabled={loading}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>{loading ? "Capturing..." : "Capture Moment"}</span>
                </button>
                <button
                  onClick={stopCamera}
                  className="px-5 py-4 bg-black border border-white/10 hover:border-white text-white transition-all cursor-pointer"
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
                  className="w-full py-4 bg-black border border-dashed border-white/15 hover:border-white text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-5 h-5 text-accent-gold" />
                  <span>{loading ? "Processing..." : "Select Photos From Local Device"}</span>
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
            <div className="border border-white/10 bg-black/30 p-12 text-center text-gray-500">
              <ImageIcon className="w-10 h-10 text-gray-500 mx-auto mb-4" />
              <p className="text-xs font-mono font-black uppercase tracking-wider text-white">No photos in the gallery yet</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Captured moment snapshots will automatically sync here</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4" id="global-gallery-grid">
              {gallery.map((photo) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square bg-black border border-white/10 overflow-hidden relative group"
                >
                  <img
                    src={photo.url}
                    alt="Captured Moment"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Photo details on hover overlay */}
                  <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <p className="font-black text-xs text-white uppercase tracking-wider truncate">{photo.teamName}</p>
                    <span className="text-[9px] font-mono text-accent-gold block mt-1 uppercase tracking-widest">{photo.timestamp}</span>
                    
                    {/* Delete button (displays on group-hover overlay) */}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700 cursor-pointer"
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

      {/* Style for flash animation */}
      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
