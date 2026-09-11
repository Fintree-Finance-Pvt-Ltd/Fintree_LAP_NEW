import { useEffect, useRef, useState } from "react";
import {
  FiAlertCircle,
  FiCamera,
  FiLoader,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";

export default function LiveCameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [facingMode, setFacingMode] = useState("environment"); // "environment" (back) | "user" (front)
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function startCamera() {
      setIsInitializing(true);
      setErrorMsg("");

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setErrorMsg("Camera access is not supported by your browser or insecure connection (HTTP).");
          setIsInitializing(false);
        }
        return;
      }

      // Check available video devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        if (isMounted) {
          setHasMultipleCameras(videoInputs.length > 1);
        }
      } catch (e) {
        console.warn("Could not enumerate devices:", e);
      }

      // Stop any existing tracks
      stopTracks();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((err) => {
              console.warn("Auto-play error:", err);
            });
          };
        }
        setIsInitializing(false);
      } catch (err) {
        console.error("Camera access failed:", err);
        if (isMounted) {
          setErrorMsg(
            "Unable to access camera. Please allow camera permissions in your browser settings."
          );
          setIsInitializing(false);
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopTracks();
    };
  }, [isOpen, facingMode]);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleCapturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `bill_receipt_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        stopTracks();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.95
    );
  };

  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fadeIn">
      <div className="relative flex flex-col w-full max-w-lg bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <FiCamera className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Live Camera Snap
              </h3>
              <p className="text-[11px] text-slate-400">
                Align receipt inside the frame
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasMultipleCameras && (
              <button
                type="button"
                onClick={handleToggleCamera}
                className="flex items-center gap-1 p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                title="Switch Camera (Front/Back)"
              >
                <FiRefreshCw className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                stopTracks();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:bg-rose-600/30 hover:text-rose-400 transition cursor-pointer"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Video Stream Area */}
        <div className="relative aspect-4/3 sm:aspect-16/10 bg-black flex items-center justify-center overflow-hidden select-none">
          {isInitializing && (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <FiLoader className="h-8 w-8 animate-spin text-blue-500" />
              <span className="text-xs font-semibold">
                Starting Camera Feed...
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="flex flex-col items-center gap-2 p-6 text-center text-rose-400">
              <FiAlertCircle className="h-8 w-8" />
              <p className="text-xs font-medium max-w-xs">{errorMsg}</p>
            </div>
          )}

          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${
              isInitializing || errorMsg ? "hidden" : "block"
            }`}
          />

          {/* Receipt Guide Framing Corners */}
          {!isInitializing && !errorMsg && (
            <div className="pointer-events-none absolute inset-6 sm:inset-10 border-2 border-white/40 rounded-2xl">
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-900/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-cyan-300 backdrop-blur-xs">
                Position Bill Inside Frame
              </div>
            </div>
          )}
        </div>

        {/* Shutter / Capture Action Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/80">
          <button
            type="button"
            onClick={() => {
              stopTracks();
              onClose();
            }}
            className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>

          {/* Shutter button */}
          <button
            type="button"
            onClick={handleCapturePhoto}
            disabled={isInitializing || !!errorMsg}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-cyan-600 active:scale-95 disabled:opacity-40 transition cursor-pointer"
          >
            <FiCamera className="h-4 w-4" />
            <span>Snap Bill Photo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
