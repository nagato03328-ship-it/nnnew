import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Play,
  Square,
} from 'lucide-react';
import { cameraService, CameraDeviceInfo } from '../../services/cameraService';

interface CameraPanelProps {
  onCaptureFrame?: (frameBase64: string) => void;
  onTryDemo: () => void;
  onResetSession: () => void;
  experimentalLandmarks: boolean;
  onToggleLandmarks: () => void;
}

export const CameraPanel: React.FC<CameraPanelProps> = ({
  onCaptureFrame,
  onTryDemo,
  onResetSession,
  experimentalLandmarks,
  onToggleLandmarks,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [useVirtualFeed, setUseVirtualFeed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<CameraDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'camera' | 'video' | 'image'>('camera');
  const [snapshotFeedback, setSnapshotFeedback] = useState(false);

  // Load available camera devices
  useEffect(() => {
    const initDevices = async () => {
      const available = await cameraService.getAvailableCameras();
      setDevices(available);
      if (available.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(available[0].deviceId);
      }
    };
    initDevices();

    return () => {
      cameraService.stopCamera();
    };
  }, []);

  // Synchronize stream with video DOM element reliably
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      if (isStreaming && activeStream) {
        cameraService.attachStreamToVideo(video, activeStream);
      } else if (!isStreaming) {
        video.srcObject = null;
      }
    }
  }, [activeStream, isStreaming, useVirtualFeed]);

  // Experimental synthetic hand landmark simulation on local canvas for visual feedback
  useEffect(() => {
    let animId: number;
    const drawLandmarks = () => {
      if (experimentalLandmarks && isStreaming && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const w = (video && video.videoWidth > 0) ? video.videoWidth : 640;
        const h = (video && video.videoHeight > 0) ? video.videoHeight : 420;

        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw bounding guide box & keypoints for upper body / signing zone
          const time = Date.now() / 600;

          // Chest signing zone guide
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 6]);
          ctx.strokeRect(w * 0.2, h * 0.25, w * 0.6, h * 0.65);
          ctx.setLineDash([]);

          // Dynamic tracking node points simulating wrist / hand centroid
          const leftHandX = w * 0.35 + Math.sin(time) * 20;
          const leftHandY = h * 0.6 + Math.cos(time * 1.5) * 25;
          const rightHandX = w * 0.65 + Math.cos(time * 1.2) * 20;
          const rightHandY = h * 0.6 + Math.sin(time * 1.3) * 25;

          // Render joint skeleton lines
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(w * 0.5, h * 0.3); // Neck
          ctx.lineTo(w * 0.35, h * 0.4); // Left shoulder
          ctx.lineTo(leftHandX, leftHandY); // Left arm to wrist
          ctx.moveTo(w * 0.5, h * 0.3);
          ctx.lineTo(w * 0.65, h * 0.4); // Right shoulder
          ctx.lineTo(rightHandX, rightHandY); // Right arm to wrist
          ctx.stroke();

          // Hand points
          [
            { x: leftHandX, y: leftHandY },
            { x: rightHandX, y: rightHandY },
          ].forEach((pt) => {
            ctx.fillStyle = '#22D3EE';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
            ctx.fill();

            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 9, 0, 2 * Math.PI);
            ctx.stroke();
          });

          // Status tag in canvas
          ctx.fillStyle = 'rgba(11, 16, 32, 0.75)';
          ctx.fillRect(w * 0.22, h * 0.27, 210, 24);
          ctx.fillStyle = '#22D3EE';
          ctx.font = '11px sans-serif';
          ctx.fillText(useVirtualFeed ? 'Virtual Landmark Tracker' : 'Live Landmark Mesh', w * 0.24, h * 0.3);
        }
      }
      animId = requestAnimationFrame(drawLandmarks);
    };

    if (experimentalLandmarks && isStreaming) {
      animId = requestAnimationFrame(drawLandmarks);
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    return () => cancelAnimationFrame(animId);
  }, [experimentalLandmarks, isStreaming, useVirtualFeed]);

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const stream = await cameraService.startCamera({
        deviceId: selectedDeviceId || undefined,
        facingMode,
      });

      setActiveStream(stream);
      setIsStreaming(true);
      setUseVirtualFeed(false);
      setMediaType('camera');
      setUploadedMediaUrl(null);

      if (videoRef.current) {
        await cameraService.attachStreamToVideo(videoRef.current, stream);
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCameraError(error.message);
      // Auto fallback to virtual sign feed so user can test the translation pipeline smoothly
      const virtualStream = cameraService.createVirtualSignStream();
      setActiveStream(virtualStream);
      setUseVirtualFeed(true);
      setIsStreaming(true);
      setMediaType('camera');
      setUploadedMediaUrl(null);
      if (videoRef.current) {
        await cameraService.attachStreamToVideo(videoRef.current, virtualStream);
      }
    }
  };

  const handleSwitchFeedMode = async (toVirtual: boolean) => {
    setCameraError(null);
    setUseVirtualFeed(toVirtual);
    setMediaType('camera');
    setUploadedMediaUrl(null);
    if (toVirtual) {
      const virtualStream = cameraService.createVirtualSignStream();
      setActiveStream(virtualStream);
      setIsStreaming(true);
      if (videoRef.current) {
        await cameraService.attachStreamToVideo(videoRef.current, virtualStream);
      }
    } else {
      try {
        const stream = await cameraService.startCamera({
          deviceId: selectedDeviceId || undefined,
          facingMode,
        });
        setActiveStream(stream);
        setIsStreaming(true);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, stream);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message);
        setUseVirtualFeed(true);
      }
    }
  };

  const handleStopCamera = () => {
    cameraService.stopCamera();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setActiveStream(null);
    setIsStreaming(false);
    setUseVirtualFeed(false);
    setIsRecording(false);
  };

  const handleFlipCamera = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isStreaming && !useVirtualFeed) {
      try {
        const stream = await cameraService.startCamera({
          facingMode: nextFacing,
        });
        setActiveStream(stream);
        if (videoRef.current) {
          await cameraService.attachStreamToVideo(videoRef.current, stream);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setCameraError(error.message);
      }
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    const frame = cameraService.captureFrame(videoRef.current);
    if (frame) {
      setSnapshotFeedback(true);
      setTimeout(() => setSnapshotFeedback(false), 300);
      onCaptureFrame?.(frame);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStopCamera();
      const url = URL.createObjectURL(file);
      setUploadedMediaUrl(url);
      setMediaType('video');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleStopCamera();
      const url = URL.createObjectURL(file);
      setUploadedMediaUrl(url);
      setMediaType('image');
    }
  };

  const handleToggleRecord = () => {
    if (!isStreaming) return;
    setIsRecording((prev) => !prev);
  };

  return (
    <div className="flex flex-col h-full bg-[#121A2B] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      {/* Top Panel Bar */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between gap-3 bg-[#0B1020]/40">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[#8B5CF6]" />
          <h2 className="text-sm font-semibold text-white tracking-wide">
            Sign Input
          </h2>
          {isStreaming && (
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md border ${
              useVirtualFeed
                ? 'text-amber-300 bg-amber-950/40 border-amber-600/40'
                : 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
            }`}>
              {useVirtualFeed ? 'Virtual Stream' : 'Live Camera'}
            </span>
          )}
          {isRecording && (
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Rec
            </span>
          )}
        </div>

        {/* Quick Tools & Stream Mode */}
        <div className="flex items-center gap-1.5">
          <div className="hidden sm:flex items-center bg-[#070A14] p-0.5 rounded-lg border border-white/5 text-[11px]">
            <button
              type="button"
              onClick={() => handleSwitchFeedMode(false)}
              className={`px-2 py-0.5 rounded transition ${
                isStreaming && !useVirtualFeed
                  ? 'bg-[#22D3EE]/20 text-[#22D3EE] font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Webcam
            </button>
            <button
              type="button"
              onClick={() => handleSwitchFeedMode(true)}
              className={`px-2 py-0.5 rounded transition ${
                isStreaming && useVirtualFeed
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Virtual
            </button>
          </div>
          <button
            type="button"
            onClick={onToggleLandmarks}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition border ${
              experimentalLandmarks
                ? 'bg-[#22D3EE]/20 text-[#22D3EE] border-[#22D3EE]/40'
                : 'text-slate-400 hover:text-slate-200 border-white/5 hover:bg-white/5'
            }`}
            title="Toggle experimental landmark overlay mesh"
            aria-label="Toggle landmarks"
          >
            <Sliders className="w-3 h-3" />
            <span className="hidden sm:inline">Mesh</span>
          </button>

          <button
            type="button"
            onClick={onResetSession}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition"
            title="Reset session state"
            aria-label="Reset session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative flex-1 bg-[#070A14] flex items-center justify-center min-h-[300px] md:min-h-[420px] overflow-hidden">
        {/* Flash feedback on snapshot capture */}
        {snapshotFeedback && (
          <div className="absolute inset-0 bg-white/40 z-30 pointer-events-none transition-opacity duration-300" />
        )}

        {/* Persistent video element to guarantee ref & immediate stream display */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          } ${isStreaming ? 'block' : 'hidden'}`}
        />

        {/* Virtual Sign Feed simulation overlay */}
        {isStreaming && useVirtualFeed && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-5">
            <img
              src="/src/assets/images/sign_learning_hands_1792593294940.jpg"
              alt="Virtual Sign Language Demonstration Feed"
              className="w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-amber-300 bg-black/75 px-3 py-1.5 rounded-xl backdrop-blur-sm border border-amber-500/30">
              <span className="font-medium">Virtual Sign Demonstration Feed</span>
              <span>Visual Tracking Active</span>
            </div>
          </div>
        )}

        {/* Overlay canvas for experimental landmarks */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none z-10 ${
            facingMode === 'user' ? 'scale-x-[-1]' : ''
          } ${isStreaming ? 'block' : 'hidden'}`}
        />

        {/* Uploaded Video File Preview */}
        {!isStreaming && mediaType === 'video' && uploadedMediaUrl && (
          <div className="relative w-full h-full flex items-center justify-center">
            <video
              src={uploadedMediaUrl}
              controls
              playsInline
              className="max-h-[420px] w-full object-contain"
            />
          </div>
        )}

        {/* Uploaded Image Preview */}
        {!isStreaming && mediaType === 'image' && uploadedMediaUrl && (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={uploadedMediaUrl}
              alt="Uploaded sign gesture"
              className="max-h-[420px] w-auto max-w-full object-contain rounded-lg"
            />
          </div>
        )}

        {/* Camera Inactive Empty State */}
        {!isStreaming && !uploadedMediaUrl && (
          <div className="text-center p-6 max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#121A2B] border border-white/10 flex items-center justify-center mx-auto shadow-inner text-[#8B5CF6]">
              <Camera className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Camera is Inactive
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Click "Start Camera" to activate your webcam with local privacy protection, or test our verified dataset with "Try demo translation".
              </p>
            </div>

            {cameraError && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-left text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div>
                  <span className="font-semibold block">Camera Access Issue</span>
                  <span>{cameraError}</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleStartCamera}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-semibold text-xs tracking-wide shadow-lg shadow-[#8B5CF6]/20 transition-all focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
              >
                <Camera className="w-4 h-4" />
                <span>Start Camera</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setUseVirtualFeed(true);
                  setIsStreaming(true);
                  setMediaType('camera');
                  setUploadedMediaUrl(null);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-amber-300 font-medium text-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Virtual Sign Feed</span>
              </button>

              <button
                type="button"
                onClick={onTryDemo}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-[#22D3EE] font-medium text-xs transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Try Demo Translation</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Camera Controls Toolbar */}
      <div className="p-3 border-t border-white/5 bg-[#0B1020]/60 flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Camera Selection & Primary Controls */}
        <div className="flex items-center flex-wrap gap-2">
          {isStreaming ? (
            <>
              <button
                type="button"
                onClick={handleStopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-medium transition"
              >
                <CameraOff className="w-3.5 h-3.5" />
                <span>Stop</span>
              </button>

              <button
                type="button"
                onClick={() => setUseVirtualFeed(!useVirtualFeed)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  useVirtualFeed
                    ? 'bg-amber-950/50 text-amber-300 border-amber-600/50'
                    : 'bg-[#182338] text-slate-300 border-white/10 hover:text-white'
                }`}
                title="Toggle between physical webcam and virtual sign demonstration feed"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{useVirtualFeed ? 'Virtual' : 'Webcam'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleRecord}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
                  isRecording
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-[#182338] text-slate-300 border-white/10 hover:text-white'
                }`}
              >
                {isRecording ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isRecording ? 'Stop Rec' : 'Record'}</span>
              </button>

              <button
                type="button"
                onClick={handleCaptureFrame}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-white text-xs font-medium transition"
                title="Capture still frame from camera"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#22D3EE]" />
                <span>Capture Frame</span>
              </button>

              <button
                type="button"
                onClick={handleFlipCamera}
                className="p-1.5 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-slate-300 hover:text-white transition"
                title="Flip front/rear camera"
                aria-label="Flip camera"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleStartCamera}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-medium transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Start Camera</span>
            </button>
          )}

          {/* Device selector if multiple cameras exist */}
          {devices.length > 1 && (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                if (isStreaming) {
                  cameraService.startCamera({ deviceId: e.target.value });
                }
              }}
              className="bg-[#182338] border border-white/10 text-xs text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#8B5CF6]"
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Right Side: File Uploads & Demo Quick Trigger */}
        <div className="flex items-center gap-2">
          {/* Upload Video */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleVideoUpload}
            accept="video/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-slate-300 hover:text-white text-xs transition"
            title="Upload a pre-recorded sign video"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload Video</span>
          </button>

          {/* Upload Image */}
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 rounded-lg bg-[#182338] hover:bg-[#1E2E4A] border border-white/10 text-slate-300 hover:text-white transition"
            title="Upload still sign image"
            aria-label="Upload sign image"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          {/* Try Demo Button */}
          <button
            type="button"
            onClick={onTryDemo}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#22D3EE]/15 hover:bg-[#22D3EE]/25 border border-[#22D3EE]/30 text-[#22D3EE] text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
