"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { EyeIcon, EyeOffIcon, ShareIcon, ShoppingCartIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import {
  Artifact,
  ArtifactAction,
  ArtifactActions,
  ArtifactContent,
  ArtifactDescription,
  ArtifactHeader,
  ArtifactTitle,
} from "@/components/ai-elements/artifact";
import { Response } from "@/components/ai-elements/response";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { buildCartUrlFromProducts } from "@/lib/amazon-affiliate";
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
  isPublic: boolean;
};

type DesignArtifactProps = {
  design: DesignData;
  onShare?: () => void;
};

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
    <div className="mb-4 rounded-lg bg-muted/50 p-3">
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
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
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
              <Response className="text-muted-foreground text-xs leading-relaxed">
                {product.description}
              </Response>
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

function RoomView({
  design,
  isOverBudget,
  totalCost,
}: {
  design: DesignData;
  isOverBudget: boolean;
  totalCost: number;
}) {
  return (
    <div className="space-y-6 p-6">
      {/* Design Image */}
      {design.imageUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
          <Image
            alt={design.title}
            className="object-cover"
            fill
            priority
            src={design.imageUrl}
          />
        </div>
      ) : (
        <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-muted">
          <p className="text-muted-foreground text-sm">No image available</p>
        </div>
      )}

      {/* Design Plan */}
      {design.designPlan && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Design Plan</h3>
          <Response className="text-muted-foreground text-sm leading-relaxed">
            {design.designPlan}
          </Response>
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
    </div>
  );
}

function ProductsView({
  products,
  budget,
  totalCost,
}: {
  products: Product[];
  budget?: number;
  totalCost: number;
}) {
  return (
    <div className="space-y-3 p-6">
      <BudgetSummary budget={budget} totalCost={totalCost} />
      {products.map((product, index) => (
        <ProductCard
          index={index}
          key={`${product.name}-${index}`}
          product={product}
        />
      ))}
    </div>
  );
}

export function DesignArtifact({ design, onShare }: DesignArtifactProps) {
  const [activeView, setActiveView] = useState<"room" | "products">("room");
  const [isPublic, setIsPublic] = useState(design.isPublic);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);

  const togglePublic = useMutation(api.designs.togglePublic);

  const handleTogglePublic = async () => {
    setIsTogglingPublic(true);
    try {
      const newIsPublic = await togglePublic({
        designId: design._id as Id<"designs">,
      });
      setIsPublic(newIsPublic);
      toast.success(
        newIsPublic
          ? "Design is now public and shareable"
          : "Design is now private"
      );
    } catch {
      toast.error("Failed to update design visibility");
    } finally {
      setIsTogglingPublic(false);
    }
  };

  const handleShare = () => {
    if (!isPublic) {
      toast.error("Please make the design public before sharing");
      return;
    }

    const shareUrl = `${window.location.origin}/design/${design._id}`;
    navigator.clipboard.writeText(shareUrl).catch(() => {
      toast.error("Failed to copy share link");
    });
    toast.success("Share link copied to clipboard!");

    if (onShare) {
      onShare();
    }
  };

  const totalCost = design.products?.reduce((sum, p) => sum + p.price, 0) ?? 0;
  const isOverBudget: boolean = Boolean(
    design.budget && totalCost > design.budget
  );
  const hasProducts = design.products && design.products.length > 0;

  return (
    <Artifact className="flex size-full">
      <ArtifactHeader>
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <ArtifactTitle>{design.title}</ArtifactTitle>
            <ArtifactDescription className="text-xs">
              Interior design concept
            </ArtifactDescription>
          </div>

          {hasProducts && (
            <ToggleGroup
              onValueChange={(value) => {
                if (value) {
                  setActiveView(value as "room" | "products");
                }
              }}
              type="single"
              value={activeView}
              variant="outline"
            >
              <ToggleGroupItem value="room">Room</ToggleGroupItem>
              <ToggleGroupItem value="products">
                Products ({design.products?.length ?? 0})
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>

        <ArtifactActions>
          <ArtifactAction
            disabled={isTogglingPublic}
            icon={isPublic ? EyeIcon : EyeOffIcon}
            onClick={handleTogglePublic}
            tooltip={
              isPublic
                ? "Make private (only you can see)"
                : "Make public (shareable)"
            }
          />
          <ArtifactAction
            disabled={!isPublic}
            icon={ShareIcon}
            onClick={handleShare}
            tooltip={isPublic ? "Copy share link" : "Make public to share"}
          />
          <ArtifactAction
            disabled={!hasProducts}
            icon={ShoppingCartIcon}
            onClick={() => {
              if (!design.products || design.products.length === 0) {
                toast.error("No products to add to cart");
                return;
              }

              const cartUrl = buildCartUrlFromProducts(design.products);

              if (cartUrl) {
                window.open(cartUrl, "_blank", "noopener,noreferrer");
                toast.success(
                  `Opening Amazon cart with ${design.products.length} ${design.products.length === 1 ? "item" : "items"}`
                );
              } else {
                toast.error(
                  "Unable to build cart URL. Some products may not be from Amazon."
                );
              }
            }}
            tooltip={
              hasProducts
                ? "Add all products to Amazon cart"
                : "No products to checkout"
            }
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent>
        <ScrollArea className="size-full">
          {activeView === "room" ? (
            <RoomView
              design={design}
              isOverBudget={isOverBudget}
              totalCost={totalCost}
            />
          ) : (
            <ProductsView
              budget={design.budget}
              products={design.products ?? []}
              totalCost={totalCost}
            />
          )}
        </ScrollArea>
      </ArtifactContent>
    </Artifact>
  );
}
