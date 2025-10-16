"use client";

type ArtifactContentProps = {
  description: string;
};

const DESIGN_ID_SLICE_LENGTH = 6;

export function ArtifactContent({ description }: ArtifactContentProps) {
  return (
    <div className="flex size-full flex-col gap-4 overflow-auto p-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Design Description</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function formatDesignTitle(designId: string): string {
  return `Design ${designId.slice(-DESIGN_ID_SLICE_LENGTH)}`;
}
