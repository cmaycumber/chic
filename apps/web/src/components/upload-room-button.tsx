"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useConvexAuth, useMutation } from "convex/react";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LiquidGlass } from "@/components/ui/liquid-glass";
import { authClient } from "@/lib/auth-client";
import { cn, fixImageOrientation } from "@/lib/utils";

const BYTES_PER_UNIT = 1024;
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * BYTES_PER_UNIT * BYTES_PER_UNIT;

/**
 * How long to wait for the Convex client to pick up the anonymous session
 * before giving up. The cookie is set as soon as sign-in resolves, but the
 * Convex client still has to fetch a token and open an authenticated socket.
 */
const SESSION_TIMEOUT_MS = 15_000;
const SESSION_ERROR_MESSAGE = "Could not start a session, please try again";

const FILE_EXTENSION_REGEX = /\.[^./]+$/;
const SEPARATOR_REGEX = /[-_]+/g;
const WORD_START_REGEX = /\b\w/g;

/**
 * Names browsers invent for a file that came off the clipboard. They say
 * nothing about the photo, so the room gets a title that at least says where
 * it came from.
 */
const PLACEHOLDER_FILE_NAMES = new Set(["", "blob", "image", "unknown"]);
const PASTED_ROOM_TITLE = "Pasted room";

type UploadRoomButtonVariant = "hero" | "compact" | "tile";

interface UploadRoomButtonProps {
  className?: string;
  label?: string;
  variant?: UploadRoomButtonVariant;
}

type BusyState = "idle" | "preparing" | "uploading" | "opening";

function humanizeFileName(fileName: string): string {
  const withoutExtension = fileName.replace(FILE_EXTENSION_REGEX, "");
  const spaced = withoutExtension.replace(SEPARATOR_REGEX, " ").trim();
  if (!spaced) {
    return "Untitled room";
  }
  return spaced.replace(WORD_START_REGEX, (letter) => letter.toUpperCase());
}

/** What to call a room made from this file. */
function roomTitleForFile(file: File): string {
  const baseName = file.name.replace(FILE_EXTENSION_REGEX, "").trim();
  if (PLACEHOLDER_FILE_NAMES.has(baseName.toLowerCase())) {
    return PASTED_ROOM_TITLE;
  }
  return humanizeFileName(file.name);
}

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return "Images must be under 20MB.";
  }
  return null;
}

async function uploadPhotoFile(
  file: File,
  generateUploadUrl: () => Promise<string>
): Promise<string> {
  const correctedFile = await fixImageOrientation(file);
  const uploadUrl = await generateUploadUrl();
  const uploadResult = await fetch(uploadUrl, {
    body: correctedFile,
    headers: { "Content-Type": correctedFile.type },
    method: "POST",
  });

  if (!uploadResult.ok) {
    throw new Error("Failed to upload image");
  }

  const { storageId } = (await uploadResult.json()) as { storageId: string };
  return storageId;
}

export function busyLabel(state: BusyState): string {
  if (state === "preparing") {
    return "Getting things ready…";
  }
  if (state === "uploading") {
    return "Uploading…";
  }
  if (state === "opening") {
    return "Opening your room…";
  }
  return "";
}

export interface UploadController {
  busy: BusyState;
  dragHandlers: {
    onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void;
    onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
    onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  };
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  inputId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isBusy: boolean;
  isDragActive: boolean;
  openPicker: () => void;
  /**
   * Upload a file the caller already has, such as one pasted from the
   * clipboard. Takes the same path as a drop: validation, an anonymous
   * session if there is none yet, then the upload. Ignored while busy.
   */
  submitFile: (file: File) => void;
}

export interface UploadControllerOptions {
  /**
   * A comment to post to the room right after it is created, kicking off the
   * AI edit immediately. Read at upload time, so callers can pass a value
   * that changes on every render (e.g. controlled input state).
   */
  initialComment?: string;
}

export function useUploadController(
  options?: UploadControllerOptions
): UploadController {
  const { initialComment } = options ?? {};
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const createRoom = useMutation(api.rooms.create);
  const addComment = useMutation(api.rooms.addComment);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<BusyState>("idle");
  const [isDragActive, setIsDragActive] = useState(false);
  const [isWaitingForSession, setIsWaitingForSession] = useState(false);
  const pendingFileRef = useRef<File | null>(null);
  const isBusy = busy !== "idle";

  // Read at upload time rather than captured, so callers can pass a value that
  // changes on every render without making `uploadFile` a new function.
  const initialCommentRef = useRef(initialComment);
  useEffect(() => {
    initialCommentRef.current = initialComment;
  }, [initialComment]);

  const uploadFile = useCallback(
    async (file: File) => {
      try {
        setBusy("uploading");
        const storageId = await uploadPhotoFile(file, generateUploadUrl);
        setBusy("opening");
        const roomId = await createRoom({
          imageStorageId: storageId as Id<"_storage">,
          title: roomTitleForFile(file),
        });

        const comment = initialCommentRef.current?.trim();
        if (comment) {
          try {
            await addComment({ roomId, text: comment });
          } catch {
            toast.error("Room created, but couldn't add your comment.");
          }
        }

        router.push(`/room/${roomId}`);
      } catch {
        toast.error("Something went wrong. Please try again.");
        setBusy("idle");
      }
    },
    [addComment, createRoom, generateUploadUrl, router]
  );

  const abandonPendingFile = useCallback(() => {
    pendingFileRef.current = null;
    setIsWaitingForSession(false);
    setBusy("idle");
  }, []);

  const startUpload = useCallback(
    async (file: File) => {
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      if (isAuthenticated) {
        await uploadFile(file);
        return;
      }

      // No account required: take an anonymous session, then upload as soon
      // as the Convex client is authenticated with it.
      pendingFileRef.current = file;
      setIsWaitingForSession(true);
      setBusy("preparing");

      // The Convex client can lag behind a session that already exists, and
      // signing in anonymously over one would drop the account it belongs to.
      const { data: session } = await authClient.getSession();
      if (session) {
        return;
      }

      const { error } = await authClient.signIn.anonymous();
      if (error) {
        abandonPendingFile();
        toast.error(SESSION_ERROR_MESSAGE);
      }
    },
    [abandonPendingFile, isAuthenticated, uploadFile]
  );

  useEffect(() => {
    if (!isWaitingForSession) {
      return;
    }

    if (isAuthenticated) {
      const file = pendingFileRef.current;
      pendingFileRef.current = null;
      setIsWaitingForSession(false);
      if (file) {
        uploadFile(file);
      }
      return;
    }

    const timer = setTimeout(() => {
      abandonPendingFile();
      toast.error(SESSION_ERROR_MESSAGE);
    }, SESSION_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [abandonPendingFile, isAuthenticated, isWaitingForSession, uploadFile]);

  const openPicker = useCallback(() => {
    if (!isBusy) {
      inputRef.current?.click();
    }
  }, [isBusy]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";
      if (file) {
        startUpload(file);
      }
    },
    [startUpload]
  );

  const submitFile = useCallback(
    (file: File) => {
      if (!isBusy) {
        startUpload(file);
      }
    },
    [isBusy, startUpload]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      const file = event.dataTransfer.files?.[0];
      if (file) {
        submitFile(file);
      }
    },
    [submitFile]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => event.preventDefault(),
    []
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
    },
    []
  );

  return {
    busy,
    dragHandlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    handleFileChange,
    inputId,
    inputRef,
    isBusy,
    isDragActive,
    openPicker,
    submitFile,
  };
}

export function HiddenFileInput({
  controller,
}: {
  controller: UploadController;
}) {
  return (
    <input
      accept="image/*"
      capture="environment"
      className="sr-only"
      disabled={controller.isBusy}
      id={controller.inputId}
      onChange={controller.handleFileChange}
      ref={controller.inputRef}
      type="file"
    />
  );
}

function UploadTile({
  controller,
  className,
  label,
}: {
  controller: UploadController;
  className?: string;
  label?: string;
}) {
  return (
    <button
      className={cn(
        "liquid-glass glass-press flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-greige/60 border-dashed text-ink transition-colors hover:border-brass disabled:pointer-events-none disabled:opacity-60",
        className
      )}
      disabled={controller.isBusy}
      onClick={controller.openPicker}
      type="button"
    >
      <HiddenFileInput controller={controller} />
      {controller.isBusy ? (
        <Loader2 className="size-6 animate-spin text-brass" />
      ) : (
        <Upload className="size-6 text-brass" />
      )}
      <span className="font-medium text-sm">
        {controller.isBusy ? busyLabel(controller.busy) : (label ?? "New room")}
      </span>
    </button>
  );
}

function UploadCompactButton({
  controller,
  className,
  label,
}: {
  controller: UploadController;
  className?: string;
  label?: string;
}) {
  return (
    <>
      <HiddenFileInput controller={controller} />
      <Button
        className={className}
        disabled={controller.isBusy}
        onClick={controller.openPicker}
        type="button"
        variant="glass-brass"
      >
        {controller.isBusy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {controller.isBusy
          ? busyLabel(controller.busy)
          : (label ?? "Upload a photo")}
      </Button>
    </>
  );
}

function UploadHeroDropzone({
  controller,
  className,
  label,
}: {
  controller: UploadController;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("w-full", className)} {...controller.dragHandlers}>
      <HiddenFileInput controller={controller} />
      <LiquidGlass
        className={cn(
          "flex flex-col items-center gap-4 px-8 py-10 text-center transition-opacity",
          controller.isDragActive && "opacity-80"
        )}
        cornerRadius={32}
        onClick={controller.openPicker}
        tone="dark"
      >
        <div
          className="flex size-14 items-center justify-center rounded-full bg-[var(--accent-brass)] text-white"
          role="presentation"
        >
          {controller.isBusy ? (
            <Loader2 className="size-6 animate-spin" />
          ) : (
            <Upload className="size-6" />
          )}
        </div>
        <div className="space-y-1">
          <p className="font-medium text-base text-white">
            {controller.isBusy
              ? busyLabel(controller.busy)
              : (label ?? "Upload a photo")}
          </p>
          <p className="text-sm text-white/70">
            {controller.isBusy
              ? "Hang tight…"
              : "Drop an image here, or tap to choose one"}
          </p>
        </div>
      </LiquidGlass>
    </div>
  );
}

export function UploadRoomButton({
  variant = "hero",
  className,
  label,
}: UploadRoomButtonProps) {
  const controller = useUploadController();

  if (variant === "tile") {
    return (
      <UploadTile className={className} controller={controller} label={label} />
    );
  }

  if (variant === "compact") {
    return (
      <UploadCompactButton
        className={className}
        controller={controller}
        label={label}
      />
    );
  }

  return (
    <UploadHeroDropzone
      className={className}
      controller={controller}
      label={label}
    />
  );
}
