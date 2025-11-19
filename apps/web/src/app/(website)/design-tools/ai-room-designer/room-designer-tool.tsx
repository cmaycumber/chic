"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useAction, useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  Home,
  Palette,
  Sofa,
  Sparkles,
  Sun,
  TreePine,
  Waves,
  Zap,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const DESIGN_STYLES = [
  { value: "modern", label: "Modern", icon: Sparkles },
  { value: "minimalist", label: "Minimalist", icon: Zap },
  { value: "scandinavian", label: "Scandinavian", icon: TreePine },
  { value: "industrial", label: "Industrial", icon: Home },
  { value: "bohemian", label: "Bohemian", icon: Waves },
  { value: "coastal", label: "Coastal", icon: Sun },
  { value: "traditional", label: "Traditional", icon: Sofa },
  { value: "contemporary", label: "Contemporary", icon: Palette },
];

const ROOM_TYPES = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "home-office", label: "Home Office" },
  { value: "nursery", label: "Nursery" },
  { value: "outdoor", label: "Outdoor Space" },
];

const VIBES = [
  { value: "cozy-warm", label: "Cozy & Warm" },
  { value: "bright-airy", label: "Bright & Airy" },
  { value: "elegant-luxurious", label: "Elegant & Luxurious" },
  { value: "calm-serene", label: "Calm & Serene" },
  { value: "bold-vibrant", label: "Bold & Vibrant" },
  { value: "rustic-natural", label: "Rustic & Natural" },
];

export function RoomDesignerTool() {
  const { isLoading: isAuthLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<string>("");
  const [designStyle, setDesignStyle] = useState<string>("");
  const [vibe, setVibe] = useState<string>("");
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedStorageIds, setGeneratedStorageIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const generateDesign = useAction(api.tools.generateDesignImage);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setError(null);
    }
  };

  const addToDescription = (addition: string) => {
    setDescription((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${addition}` : addition;
    });
  };

  const handleRoomTypeChange = (value: string) => {
    setRoomType(value);
    const room = ROOM_TYPES.find((r) => r.value === value);
    if (room) {
      addToDescription(`Transform this ${room.label.toLowerCase()}`);
    }
  };

  const handleDesignStyleChange = (value: string) => {
    setDesignStyle(value);
    const style = DESIGN_STYLES.find((s) => s.value === value);
    if (style) {
      addToDescription(`into a ${style.label.toLowerCase()} style space`);
    }
  };

  const handleVibeChange = (value: string) => {
    setVibe(value);
    const selectedVibe = VIBES.find((v) => v.value === value);
    if (selectedVibe) {
      addToDescription(`with a ${selectedVibe.label.toLowerCase()} atmosphere`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      router.push(
        `/signup?callbackUrl=${encodeURIComponent(window.location.href)}`
      );
      return;
    }

    if (!selectedFile) {
      setError("Please upload a room photo");
      return;
    }

    if (!description.trim()) {
      setError(
        "Please use the dropdowns to add style options or describe your vision"
      );
      return;
    }

    setIsGenerating(true);
    setError(null);
    setGeneratedStorageIds([]);

    try {
      // Step 1: Get upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload the file to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!uploadResult.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResult.json();

      // Step 3: Generate the design using AI
      const result = await generateDesign({
        imageStorageId: storageId,
        description: description.trim(),
      });

      // Step 4: Store the generated image storage IDs
      setGeneratedStorageIds(result.storageIds);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate design. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setRoomType("");
    setDesignStyle("");
    setVibe("");
    setDescription("");
    setGeneratedStorageIds([]);
    setError(null);
  };

  const hasAnyInput =
    selectedFile || roomType || designStyle || vibe || description;

  if (isAuthLoading) {
    return (
      <Card className="mx-auto max-w-4xl border-2">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="mx-auto max-w-4xl border-2 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl">
            Transform Your Room with AI
          </CardTitle>
          <CardDescription className="text-base">
            Upload a photo and customize your design preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label className="font-semibold text-base" htmlFor="room-photo">
                Upload Room Photo
              </Label>
              <input
                accept="image/*"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isGenerating}
                id="room-photo"
                onChange={handleFileChange}
                type="file"
              />
              <p className="text-muted-foreground text-sm">
                Upload a clear photo of your room. JPG, PNG, or WebP format.
              </p>
            </div>

            {previewUrl && (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border-2">
                <Image
                  alt="Room preview"
                  className="object-cover"
                  fill
                  src={previewUrl}
                />
              </div>
            )}

            {/* Quick Options - Right above description */}
            <div className="space-y-2">
              <Label className="font-semibold text-base">
                Quick Style Options
              </Label>
              <p className="text-muted-foreground text-sm">
                Select options to automatically add to your description below
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  disabled={isGenerating}
                  onValueChange={handleRoomTypeChange}
                  value={roomType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Room Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((room) => (
                      <SelectItem key={room.value} value={room.value}>
                        {room.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  disabled={isGenerating}
                  onValueChange={handleDesignStyleChange}
                  value={designStyle}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Design Style..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_STYLES.map((style) => {
                      const Icon = style.icon;
                      return (
                        <SelectItem key={style.value} value={style.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {style.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <Select
                  disabled={isGenerating}
                  onValueChange={handleVibeChange}
                  value={vibe}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vibe..." />
                  </SelectTrigger>
                  <SelectContent>
                    {VIBES.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label
                className="font-semibold text-base"
                htmlFor="design-description"
              >
                Design Description
              </Label>
              <Textarea
                className="resize-none"
                disabled={isGenerating}
                id="design-description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Use the dropdowns above or describe your vision here... (e.g., 'Transform this living room into a modern minimalist space with neutral tones and plenty of natural light')"
                rows={4}
                value={description}
              />
              <p className="text-muted-foreground text-sm">
                Selections from dropdowns above will appear here automatically.
                You can edit or add more details.
              </p>
            </div>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 font-semibold"
                disabled={isGenerating || !selectedFile}
                size="lg"
                type="submit"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 size-4 animate-pulse" />
                    Generating Design...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 size-4" />
                    Generate AI Design
                  </>
                )}
              </Button>
              {hasAnyInput && !isGenerating && (
                <Button
                  onClick={handleReset}
                  size="lg"
                  type="button"
                  variant="outline"
                >
                  Reset
                </Button>
              )}
            </div>

            <p className="text-center text-muted-foreground text-sm">
              ✓ 100% Free Forever &nbsp;•&nbsp; ✓ No Account Required
              &nbsp;•&nbsp; ✓ Instant Results
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Generated Results */}
      {generatedStorageIds.length > 0 && (
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>Your AI-Generated Designs</CardTitle>
            <CardDescription>
              Here are your transformed room designs. Try generating again with
              a different description for more variations!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {generatedStorageIds.map((storageId, index) => (
              <GeneratedImage
                index={index + 1}
                key={storageId}
                storageId={storageId}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GeneratedImage({
  storageId,
  index,
}: {
  storageId: string;
  index: number;
}) {
  const url = useQuery(api.files.getStorageUrl, { storageId });

  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted">
        <p className="text-muted-foreground text-sm">Loading design...</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <Image
        alt={`Generated design variation ${index}`}
        className="object-cover"
        fill
        src={url}
      />
    </div>
  );
}
