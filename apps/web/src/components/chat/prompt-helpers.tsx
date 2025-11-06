"use client";

import { Sparkles } from "lucide-react";
import { useState } from "react";
import {
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type PromptHelpersProps = {
  onSelectPrompt: (prompt: string) => void;
};

const ROOM_TYPES = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "home-office", label: "Home Office" },
  { value: "family-room", label: "Family Room" },
  { value: "nursery", label: "Nursery" },
  { value: "outdoor", label: "Outdoor" },
];

const DESIGN_STYLES = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "scandinavian", label: "Scandinavian" },
  { value: "industrial", label: "Industrial" },
  { value: "bohemian", label: "Bohemian" },
  { value: "coastal", label: "Coastal" },
  { value: "traditional", label: "Traditional" },
  { value: "contemporary", label: "Contemporary" },
];

const COLOR_PALETTES = [
  { value: "warm", label: "Warm Tones" },
  { value: "cool", label: "Cool Tones" },
  { value: "neutral", label: "Neutral" },
  { value: "bold", label: "Bold Colors" },
  { value: "monochrome", label: "Monochrome" },
  { value: "earthy", label: "Earthy" },
];

const BUDGET_RANGES = [
  { value: "budget", label: "Under $1,000" },
  { value: "mid", label: "$1,000 - $5,000" },
  { value: "high", label: "$5,000 - $10,000" },
  { value: "luxury", label: "$10,000+" },
];

type SelectionState = {
  room: string | null;
  style: string | null;
  color: string | null;
  budget: string | null;
};

function buildPrompt(selections: SelectionState): string {
  let prompt = "I want to design";
  if (selections.room) {
    const roomLabel = ROOM_TYPES.find(
      (r) => r.value === selections.room
    )?.label;
    if (roomLabel) {
      prompt += ` a ${roomLabel.toLowerCase()}`;
    }
  }
  if (selections.style) {
    const styleLabel = DESIGN_STYLES.find(
      (s) => s.value === selections.style
    )?.label;
    if (styleLabel) {
      prompt += ` with ${styleLabel.toLowerCase()} style`;
    }
  }
  if (selections.color) {
    const colorLabel = COLOR_PALETTES.find(
      (c) => c.value === selections.color
    )?.label;
    if (colorLabel) {
      prompt += ` using ${colorLabel.toLowerCase()}`;
    }
  }
  if (selections.budget) {
    const budgetLabel = BUDGET_RANGES.find(
      (b) => b.value === selections.budget
    )?.label;
    if (budgetLabel) {
      prompt += ` with a budget of ${budgetLabel.toLowerCase()}`;
    }
  }
  return prompt;
}

export function PromptHelpers({ onSelectPrompt }: PromptHelpersProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);

  const handleSelectionChange = (
    category: "room" | "style" | "color" | "budget",
    value: string
  ) => {
    // Update selection state
    const newSelections: SelectionState = {
      room: selectedRoom,
      style: selectedStyle,
      color: selectedColor,
      budget: selectedBudget,
    };

    // Toggle selection (if same value clicked, deselect)
    newSelections[category] = newSelections[category] === value ? null : value;

    // Update state
    setSelectedRoom(newSelections.room);
    setSelectedStyle(newSelections.style);
    setSelectedColor(newSelections.color);
    setSelectedBudget(newSelections.budget);

    // Build and set prompt
    onSelectPrompt(buildPrompt(newSelections));
  };

  const handleClear = () => {
    setSelectedRoom(null);
    setSelectedStyle(null);
    setSelectedColor(null);
    setSelectedBudget(null);
    onSelectPrompt("");
  };

  const hasSelections =
    selectedRoom || selectedStyle || selectedColor || selectedBudget;

  return (
    <PromptInputActionMenu>
      <PromptInputActionMenuTrigger>
        <Sparkles className="size-4" />
        Design Options
      </PromptInputActionMenuTrigger>
      <PromptInputActionMenuContent
        className="max-h-[420px] w-[340px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="font-semibold text-sm">Design Options</span>
            </div>
            {hasSelections && (
              <Button
                className="h-7 px-2 text-xs"
                onClick={handleClear}
                size="sm"
                variant="ghost"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Room Types */}
          <div className="space-y-2">
            <div className="font-medium text-foreground text-xs uppercase tracking-wide">
              Room Type
            </div>
            <ToggleGroup
              className="flex w-full flex-wrap justify-start gap-1.5"
              onValueChange={(value) =>
                handleSelectionChange("room", value || "")
              }
              type="single"
              value={selectedRoom || ""}
            >
              {ROOM_TYPES.map((room) => (
                <ToggleGroupItem
                  className="h-8 min-w-0 flex-none rounded-md border border-input bg-background px-3 text-xs shadow-none first:rounded-md last:rounded-md hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
                  key={room.value}
                  value={room.value}
                >
                  {room.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Design Styles */}
          <div className="space-y-2">
            <div className="font-medium text-foreground text-xs uppercase tracking-wide">
              Style
            </div>
            <ToggleGroup
              className="flex w-full flex-wrap justify-start gap-1.5"
              onValueChange={(value) =>
                handleSelectionChange("style", value || "")
              }
              type="single"
              value={selectedStyle || ""}
            >
              {DESIGN_STYLES.map((style) => (
                <ToggleGroupItem
                  className="h-8 min-w-0 flex-none rounded-md border border-input bg-background px-3 text-xs shadow-none first:rounded-md last:rounded-md hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
                  key={style.value}
                  value={style.value}
                >
                  {style.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Color Palettes */}
          <div className="space-y-2">
            <div className="font-medium text-foreground text-xs uppercase tracking-wide">
              Color Palette
            </div>
            <ToggleGroup
              className="flex w-full flex-wrap justify-start gap-1.5"
              onValueChange={(value) =>
                handleSelectionChange("color", value || "")
              }
              type="single"
              value={selectedColor || ""}
            >
              {COLOR_PALETTES.map((color) => (
                <ToggleGroupItem
                  className="h-8 min-w-0 flex-none rounded-md border border-input bg-background px-3 text-xs shadow-none first:rounded-md last:rounded-md hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
                  key={color.value}
                  value={color.value}
                >
                  {color.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Budget Ranges */}
          <div className="space-y-2">
            <div className="font-medium text-foreground text-xs uppercase tracking-wide">
              Budget Range
            </div>
            <ToggleGroup
              className="flex w-full flex-wrap justify-start gap-1.5"
              onValueChange={(value) =>
                handleSelectionChange("budget", value || "")
              }
              type="single"
              value={selectedBudget || ""}
            >
              {BUDGET_RANGES.map((budget) => (
                <ToggleGroupItem
                  className="h-8 min-w-0 flex-none rounded-md border border-input bg-background px-3 text-xs shadow-none first:rounded-md last:rounded-md hover:bg-accent hover:text-accent-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm data-[state=on]:hover:bg-primary/90"
                  key={budget.value}
                  value={budget.value}
                >
                  {budget.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>
      </PromptInputActionMenuContent>
    </PromptInputActionMenu>
  );
}
