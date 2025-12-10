"use client";

import {
  CameraIcon,
  FlipHorizontal2Icon,
  Loader2Icon,
  RefreshCwIcon,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type CameraCaptureProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (file: File) => void;
};

type CameraState = "initializing" | "ready" | "captured" | "error";

/** JPEG quality for captured images (0-1 scale) */
const JPEG_QUALITY = 0.9;

/** Error messages for different camera access failures */
const CAMERA_ERRORS = {
  notSupported:
    "Camera access is not supported in this browser. Please try using a modern browser like Chrome, Firefox, or Safari.",
  permissionDenied:
    "Camera access was denied. Please allow camera access in your browser settings and try again.",
  notFound:
    "No camera found. Please ensure your device has a camera connected.",
  inUse:
    "Camera is in use by another application. Please close other apps using the camera and try again.",
  overconstrained:
    "Camera does not support the requested settings. Trying with default settings...",
  defaultFailed: "Failed to access camera with default settings.",
  generic: "Failed to access camera",
} as const;

/**
 * Maps camera error names to user-friendly messages
 */
function getCameraErrorMessage(err: Error): string {
  switch (err.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return CAMERA_ERRORS.permissionDenied;
    case "NotFoundError":
    case "DevicesNotFoundError":
      return CAMERA_ERRORS.notFound;
    case "NotReadableError":
    case "TrackStartError":
      return CAMERA_ERRORS.inUse;
    default:
      return err.message || CAMERA_ERRORS.generic;
  }
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [state, setState] = useState<CameraState>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    "environment"
  );

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
  }, []);

  /**
   * Attempts to connect video stream to the video element
   */
  const connectStream = useCallback(
    async (stream: MediaStream): Promise<boolean> => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setState("ready");
        return true;
      }
      return false;
    },
    []
  );

  /**
   * Handles OverconstrainedError by trying simpler camera settings
   */
  const tryFallbackCamera = useCallback(async (): Promise<boolean> => {
    try {
      const simpleStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      return connectStream(simpleStream);
    } catch {
      return false;
    }
  }, [connectStream]);

  const startCamera = useCallback(async () => {
    setState("initializing");
    setError(null);
    setCapturedImage(null);
    stopCamera();

    // Check browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(CAMERA_ERRORS.notSupported);
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      await connectStream(stream);
    } catch (err) {
      if (!(err instanceof Error)) {
        setError(CAMERA_ERRORS.generic);
        setState("error");
        return;
      }

      // Handle OverconstrainedError with fallback
      if (err.name === "OverconstrainedError") {
        const fallbackSuccess = await tryFallbackCamera();
        if (fallbackSuccess) {
          return;
        }
        setError(CAMERA_ERRORS.defaultFailed);
      } else {
        setError(getCameraErrorMessage(err));
      }
      setState("error");
    }
  }, [facingMode, stopCamera, connectStream, tryFallbackCamera]);

  // Start camera when dialog opens
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
      setState("initializing");
      setCapturedImage(null);
      setError(null);
    }

    return () => {
      stopCamera();
    };
  }, [open, startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!(video && canvas)) {
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame to canvas
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to data URL for preview
      const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
      setCapturedImage(dataUrl);
      setState("captured");

      // Pause video to show captured frame
      video.pause();
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setState("ready");

    if (videoRef.current && streamRef.current) {
      videoRef.current.play();
    }
  }, []);

  const handleUsePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!(canvas && capturedImage)) {
      return;
    }

    // Convert canvas to blob and then to file
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `room-photo-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          onCapture(file);
          onOpenChange(false);
        }
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  }, [capturedImage, onCapture, onOpenChange]);

  const handleSwitchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }, []);

  // Restart camera when facing mode changes (facingMode is intentionally included to trigger restart)
  // biome-ignore lint/correctness/useExhaustiveDependencies: facingMode triggers camera restart when user switches cameras
  useEffect(() => {
    if (open && state !== "captured") {
      startCamera();
    }
  }, [facingMode, open, startCamera, state]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="max-w-2xl overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Take a photo of your room</DialogTitle>
          <DialogDescription>
            Use your camera to capture a photo of your space for design
            recommendations.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-[4/3] w-full bg-black">
          {/* Video preview */}
          <video
            autoPlay
            className={cn(
              "absolute inset-0 size-full object-cover",
              state === "captured" && "hidden"
            )}
            muted
            playsInline
            ref={videoRef}
          />

          {/* Hidden canvas for capturing */}
          <canvas className="hidden" ref={canvasRef} />

          {/* Captured image preview */}
          {capturedImage && state === "captured" && (
            <img
              alt="Captured room"
              className="absolute inset-0 size-full object-cover"
              src={capturedImage}
            />
          )}

          {/* Loading state */}
          {state === "initializing" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black text-white">
              <Loader2Icon className="size-8 animate-spin" />
              <p className="text-sm">Starting camera...</p>
            </div>
          )}

          {/* Error state */}
          {state === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black p-6 text-center text-white">
              <CameraIcon className="size-12 text-gray-400" />
              <p className="text-sm">{error}</p>
              <Button onClick={startCamera} size="sm" variant="outline">
                <RefreshCwIcon className="mr-2 size-4" />
                Try again
              </Button>
            </div>
          )}

          {/* Close button */}
          <Button
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <XIcon className="size-5 text-white" />
            <span className="sr-only">Close</span>
          </Button>

          {/* Camera switch button (only on ready state) */}
          {state === "ready" && (
            <Button
              className="absolute top-3 left-3 z-10 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70"
              onClick={handleSwitchCamera}
              size="icon"
              type="button"
              variant="ghost"
            >
              <FlipHorizontal2Icon className="size-5 text-white" />
              <span className="sr-only">Switch camera</span>
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 p-4">
          {state === "ready" && (
            <Button
              className="size-16 rounded-full"
              onClick={handleCapture}
              size="icon"
              type="button"
            >
              <CameraIcon className="size-6" />
              <span className="sr-only">Take photo</span>
            </Button>
          )}

          {state === "captured" && (
            <>
              <Button
                onClick={handleRetake}
                size="lg"
                type="button"
                variant="outline"
              >
                <RefreshCwIcon className="mr-2 size-4" />
                Retake
              </Button>
              <Button onClick={handleUsePhoto} size="lg" type="button">
                <CameraIcon className="mr-2 size-4" />
                Use photo
              </Button>
            </>
          )}

          {(state === "initializing" || state === "error") && (
            <div className="h-16" /> // Spacer to maintain layout
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
