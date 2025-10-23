"use client";

import { CopyIcon, DownloadIcon, RefreshCwIcon, ShareIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Product = {
  name: string;
  price: number;
  imageUrl: string;
  productUrl?: string;
  description?: string;
};

type DesignData = {
  _id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  products?: Product[];
  budget?: number;
  designPlan?: string;
};

type DesignArtifactProps = {
  design: DesignData;
  onRegenerate?: () => void;
  onShare?: () => void;
  onExport?: () => void;
};

const COPY_FEEDBACK_DURATION = 2000;

function BudgetSummary({
  budget,
  totalCost,
}: {
  budget?: number;
  totalCost: number;
}) {
  if (!budget) {
    return null;
  }

  const isOverBudget = totalCost > budget;

  return (
    <div className="mb-4 rounded-lg border bg-muted/50 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Budget:</span>
        <span className="font-semibold">${budget.toLocaleString()}</span>
      </div>
      <div className="mt-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Cost:</span>
        <span
          className={cn("font-semibold", isOverBudget && "text-destructive")}
        >
          ${totalCost.toLocaleString()}
        </span>
      </div>
      {isOverBudget && (
        <p className="mt-2 text-destructive text-xs">
          ⚠️ Over budget by ${(totalCost - budget).toLocaleString()}
        </p>
      )}
    </div>
  );
}

function ProductCard({ product, index }: { product: Product; index: number }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Card key={`${product.name}-${index}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {product.imageUrl && !imageError ? (
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md border bg-muted">
              <Image
                alt={product.name}
                className="object-cover"
                fill
                onError={() => setImageError(true)}
                src={product.imageUrl}
              />
            </div>
          ) : null}
          <div className="flex flex-1 flex-col gap-1">
            <h4 className="font-medium text-sm leading-tight">
              {product.name}
            </h4>
            {product.description && (
              <p className="text-muted-foreground text-xs leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="mt-auto flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">
                ${product.price.toLocaleString()}
              </span>
              {product.productUrl && (
                <a
                  className="text-primary text-xs hover:underline"
                  href={product.productUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View Product
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DesignArtifact({
  design,
  onRegenerate,
  onShare,
  onExport,
}: DesignArtifactProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(design.description).catch(() => {
      // Handle error silently
    });
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
  };

  const totalCost = design.products?.reduce((sum, p) => sum + p.price, 0) ?? 0;
  const isOverBudget = design.budget && totalCost > design.budget;

  return (
    <Artifact className="flex size-full">
      <ArtifactHeader>
        <div className="flex flex-col gap-1">
          <ArtifactTitle>{design.title}</ArtifactTitle>
          <ArtifactDescription className="text-xs">
            Interior design concept
          </ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction
            icon={CopyIcon}
            onClick={handleCopy}
            tooltip={copied ? "Copied!" : "Copy description"}
          />
          {onRegenerate && (
            <ArtifactAction
              icon={RefreshCwIcon}
              onClick={onRegenerate}
              tooltip="Regenerate design"
            />
          )}
          {onExport && (
            <ArtifactAction
              icon={DownloadIcon}
              onClick={onExport}
              tooltip="Export design"
            />
          )}
          {onShare && (
            <ArtifactAction
              icon={ShareIcon}
              onClick={onShare}
              tooltip="Share design"
            />
          )}
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent>
        <ScrollArea className="size-full">
          <div className="space-y-6">
            {/* Design Image */}
            {design.imageUrl ? (
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <Image
                  alt={design.title}
                  className="object-cover"
                  fill
                  priority
                  src={design.imageUrl}
                />
              </div>
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                <p className="text-muted-foreground text-sm">
                  No image available
                </p>
              </div>
            )}

            {/* Design Plan */}
            {design.designPlan && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Design Plan</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {design.designPlan}
                </p>
              </div>
            )}

            {/* Budget Summary */}
            {design.budget && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Budget</h3>
                <div className="flex items-center gap-2">
                  <Badge variant={isOverBudget ? "destructive" : "default"}>
                    ${design.budget.toLocaleString()} budget
                  </Badge>
                  {totalCost > 0 && (
                    <Badge variant="outline">
                      ${totalCost.toLocaleString()} total
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Products Section */}
            {design.products && design.products.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">
                  Products ({design.products.length})
                </h3>
                <BudgetSummary budget={design.budget} totalCost={totalCost} />
                {design.products.map((product, index) => (
                  <ProductCard
                    index={index}
                    key={`${product.name}-${index}`}
                    product={product}
                  />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </ArtifactContent>
    </Artifact>
  );
}
