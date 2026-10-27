export interface CameraDeviceInfo {
  deviceId: string;
  label: string;
}

export interface CameraState {
  isStreaming: boolean;
  stream: MediaStream | null;
  error: string | null;
  selectedDeviceId: string;
  availableDevices: CameraDeviceInfo[];
  facingMode: 'user' | 'environment';
}

class CameraService {
  private currentStream: MediaStream | null = null;
  private virtualStreamCanvas: HTMLCanvasElement | null = null;
  private virtualStreamAnimId: number | null = null;

  public isSupported(): boolean {
    return !!(navigator?.mediaDevices?.getUserMedia);
  }

  public async getAvailableCameras(): Promise<CameraDeviceInfo[]> {
    if (!this.isSupported() || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === 'videoinput');
      return videoDevices.map((d, index) => ({
        deviceId: d.deviceId,
        label: d.label || `Camera ${index + 1}`,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Safely and reliably attaches a MediaStream to an HTML5 Video element,
   * setting all imperative properties required by Chromium/WebKit autoplay policies.
   */
  public async attachStreamToVideo(video: HTMLVideoElement, stream: MediaStream): Promise<void> {
    if (!video) return;

    try {
      video.defaultMuted = true;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('muted', '');
      video.setAttribute('autoplay', '');

      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }

      // If already ready, start immediately
      if (video.readyState >= 2) {
        await video.play().catch(() => {});
      } else {
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
        };
        video.oncanplay = () => {
          video.play().catch(() => {});
        };
        await video.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Video attach stream play warning:', err);
    }
  }

  public async startCamera(options?: {
    deviceId?: string;
    facingMode?: 'user' | 'environment';
  }): Promise<MediaStream> {
    if (!this.isSupported()) {
      throw new Error('Camera access is not supported in this browser or environment.');
    }

    // Stop existing stream if running
    this.stopCamera();

    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        deviceId: options?.deviceId ? { exact: options.deviceId } : undefined,
        facingMode: options?.facingMode || 'user',
      },
      audio: false, // Sign language camera input requires video only
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentStream = stream;
      return stream;
    } catch (firstErr: unknown) {
      // Fallback to basic video constraints if ideal resolution was rejected by device
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        this.currentStream = fallbackStream;
        return fallbackStream;
      } catch {
        // proceed to report original error
      }

      const error = firstErr as Error;
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        throw new Error('Camera permission was denied. Please allow camera access in your browser settings to use live video.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        throw new Error('No camera hardware was detected on this device.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        throw new Error('The camera is currently being used by another application or tab.');
      } else {
        throw new Error(`Failed to start camera: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Generates a synthetic animated Sign Language MediaStream.
   * Useful when physical webcams are blocked, unavailable in virtualized environments,
   * or when the user wants an instant preview of gesture tracking.
   */
  public createVirtualSignStream(width = 640, height = 360): MediaStream {
    this.stopCamera();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    this.virtualStreamCanvas = canvas;

    let tick = 0;
    const renderVirtualFeed = () => {
      tick += 0.04;
      ctx.fillStyle = '#070A14';
      ctx.fillRect(0, 0, width, height);

      // Subtle tech background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Silhouette head and shoulders
      const cx = width / 2;
      const cy = height * 0.45;

      // Head
      ctx.fillStyle = '#182338';
      ctx.beginPath();
      ctx.arc(cx, cy - 60, 42, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#22D3EE';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Torso / Shoulders
      ctx.fillStyle = '#121A2B';
      ctx.beginPath();
      ctx.moveTo(cx - 100, height);
      ctx.lineTo(cx - 70, cy + 20);
      ctx.lineTo(cx + 70, cy + 20);
      ctx.lineTo(cx + 100, height);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.4)';
      ctx.stroke();

      // Animated Sign Hands & Arms
      const leftX = cx - 70 + Math.sin(tick * 1.5) * 45;
      const leftY = cy + 40 + Math.cos(tick * 2) * 35;
      const rightX = cx + 70 + Math.cos(tick * 1.8) * 45;
      const rightY = cy + 40 + Math.sin(tick * 2.2) * 35;

      // Arm connections
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx - 70, cy + 20);
      ctx.lineTo(leftX, leftY);
      ctx.moveTo(cx + 70, cy + 20);
      ctx.lineTo(rightX, rightY);
      ctx.stroke();

      // Hand nodes
      [
        { x: leftX, y: leftY },
        { x: rightX, y: rightY },
      ].forEach((hand) => {
        ctx.fillStyle = '#22D3EE';
        ctx.beginPath();
        ctx.arc(hand.x, hand.y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Finger keypoints
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI) / 4 + Math.sin(tick * 3 + i) * 0.2;
          const fx = hand.x + Math.cos(angle) * 14;
          const fy = hand.y + Math.sin(angle) * 14;
          ctx.fillStyle = '#8B5CF6';
          ctx.beginPath();
          ctx.arc(fx, fy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Digital scanning bar
      const scanY = ((tick * 40) % height);
      const gradient = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
      gradient.addColorStop(0, 'rgba(34, 211, 238, 0)');
      gradient.addColorStop(0.5, 'rgba(34, 211, 238, 0.15)');
      gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanY - 20, width, 40);

      // Status overlay
      ctx.fillStyle = '#22D3EE';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('AISLT SYNTHETIC GESTURE STREAM', 14, 22);

      this.virtualStreamAnimId = requestAnimationFrame(renderVirtualFeed);
    };

    renderVirtualFeed();

    // Canvas captureStream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvasAny = canvas as any;
    if (typeof canvasAny.captureStream === 'function') {
      const stream = canvasAny.captureStream(30) as MediaStream;
      this.currentStream = stream;
      return stream;
    }

    // Fallback if captureStream not supported: create empty stream
    const emptyStream = new MediaStream();
    this.currentStream = emptyStream;
    return emptyStream;
  }

  public stopCamera(): void {
    if (this.virtualStreamAnimId !== null) {
      cancelAnimationFrame(this.virtualStreamAnimId);
      this.virtualStreamAnimId = null;
    }
    this.virtualStreamCanvas = null;

    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.currentStream = null;
    }
  }

  public captureFrame(videoElement: HTMLVideoElement): string | null {
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw current video frame to canvas
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
    }
  }
}

export const cameraService = new CameraService();
