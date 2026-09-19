"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  ExternalLinkIcon,
  Heart,
  Loader2,
  PackageIcon,
  ShoppingCartIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Response } from "@/components/ai-elements/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { buildCartUrlFromProducts } from "@/lib/amazon-affiliate";
import { cn } from "@/lib/utils";

type RoomType =
  | "living-room"
  | "bedroom"
  | "kitchen"
  | "bathroom"
  | "dining-room"
  | "home-office"
  | "family-room"
  | "nursery"
  | "outdoor";

type DesignStyle =
  | "modern"
  | "minimalist"
  | "scandinavian"
  | "industrial"
  | "bohemian"
  | "coastal"
  | "traditional"
  | "contemporary";

const ROOM_TYPES: Record<RoomType, string> = {
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  "dining-room": "Dining Room",
  "family-room": "Family Room",
  "home-office": "Home Office",
  kitchen: "Kitchen",
  "living-room": "Living Room",
  nursery: "Nursery",
  outdoor: "Outdoor",
};

const DESIGN_STYLES: Record<DesignStyle, string> = {
  bohemian: "Bohemian",
  coastal: "Coastal",
  contemporary: "Contemporary",
  industrial: "Industrial",
  minimalist: "Minimalist",
  modern: "Modern",
  scandinavian: "Scandinavian",
  traditional: "Traditional",
};

interface DesignSidebarProps {
  cartUrl: string | null;
  design: {
    budget?: number;
    products?: Array<{ productUrl?: string; price: number }>;
  };
  hasProducts: boolean;
  isLiked: boolean | undefined;
  isOverBudget: boolean;
  likesCount: number | undefined;
  onLikeClick: () => void;
  totalCost: number;
}

function DesignSidebar({
  design,
  totalCost,
  isOverBudget,
  hasProducts,
  cartUrl,
  isLiked,
  likesCount,
  onLikeClick,
}: DesignSidebarProps) {
  return (
    <Card className="sticky top-6 overflow-hidden rounded-2xl border-2">
      <CardContent className="p-6">
        {/* Like Button with Count */}
        <div className="space-y-3">
          <Button
            className={cn(
              "h-12 w-full transition-all",
              isLiked
                ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            disabled={isLiked === undefined}
            onClick={onLikeClick}
            size="lg"
            type="button"
            variant={isLiked ? "outline" : "default"}
          >
            <Heart
              className={cn(
                "mr-2 size-5 transition-all",
                isLiked && "fill-current"
              )}
            />
            {isLiked ? "Saved" : "Save Design"}
          </Button>

          {/* Likes Count */}
          {likesCount !== undefined && likesCount > 0 && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
              <Heart className="size-3.5 fill-current text-red-500" />
              <span className="font-medium">
                {likesCount.toLocaleString()}{" "}
                {likesCount === 1 ? "person" : "people"} saved this
              </span>
            </div>
          )}
        </div>

        {/* Budget Section */}
        {design.budget && hasProducts ? (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="mb-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Budget
                </div>
                <div className="font-bold text-3xl">
                  ${design.budget.toLocaleString()}
                </div>
              </div>

              <div className="space-y-3 rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground text-sm">
                    Total Cost
                  </span>
                  <span
                    className={cn(
                      "font-semibold text-base",
                      isOverBudget && "text-destructive"
                    )}
                  >
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
                <Separator />
                {isOverBudget ? (
                  <div className="flex items-center justify-between rounded-md bg-destructive/10 p-3">
                    <span className="font-medium text-destructive text-sm">
                      Over Budget
                    </span>
                    <span className="font-bold text-base text-destructive">
                      +${(totalCost - design.budget).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-md bg-emerald-50 p-3">
                    <span className="font-medium text-emerald-700 text-sm">
                      Under Budget
                    </span>
                    <span className="font-bold text-base text-emerald-700">
                      ${(design.budget - totalCost).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}

        {/* No Budget Section */}
        {!design.budget && hasProducts && (
          <>
            <Separator className="my-6" />
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-semibold text-lg">Ready to shop?</h3>
                <p className="text-muted-foreground text-sm">
                  {design.products?.length} item
                  {design.products?.length === 1 ? "" : "s"} selected for this
                  design
                </p>
              </div>

              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-muted-foreground text-sm">
                    Total Cost
                  </span>
                  <span className="font-bold text-2xl">
                    ${totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add to Cart Button */}
        {cartUrl && hasProducts ? (
          <>
            <Separator className="my-6" />
            <Button
              asChild
              className="h-12 w-full gap-2 font-semibold"
              size="lg"
            >
              <a href={cartUrl} rel="noopener noreferrer" target="_blank">
                <ShoppingCartIcon className="size-5" />
                Add All to Amazon Cart
              </a>
            </Button>
            <p className="mt-3 text-center text-muted-foreground text-xs">
              Purchases support this platform
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto flex min-h-[400px] max-w-6xl items-center justify-center px-4 py-8">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground text-sm">Loading design...</p>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto flex min-h-[400px] max-w-6xl items-center justify-center px-4 py-8">
      <div className="text-center">
        <p className="text-lg text-muted-foreground">Design not found</p>
        <p className="mt-2 text-muted-foreground text-sm">
          This design may have been removed or is not publicly available
        </p>
        <Button asChild className="mt-4" type="button" variant="outline">
          <Link as="/explore" href="/explore">
            <ArrowLeft className="mr-2 size-4" />
            Back to Explore
          </Link>
        </Button>
      </div>
    </div>
  );
}

function InvalidIdState() {
  return (
    <div className="mx-auto flex min-h-[400px] max-w-6xl items-center justify-center px-4 py-8">
      <p className="text-muted-foreground">Invalid design ID</p>
    </div>
  );
}

interface DesignContentProps {
  design: {
    _id: Id<"designs">;
    _creationTime: number;
    title: string;
    description: string;
    imageUrl: string | null;
    products?: Array<{
      name: string;
      price: number;
      imageUrl: string;
      productUrl?: string;
      description?: string;
    }>;
    budget?: number;
    designPlan?: string;
    roomType?: RoomType;
    designStyle?: DesignStyle;
  };
  isLiked: boolean | undefined;
  likesCount: number | undefined;
  onLikeClick: () => void;
}

function DesignContent({
  design,
  isLiked,
  likesCount,
  onLikeClick,
}: DesignContentProps) {
  const totalCost =
    design.products?.reduce(
      (sum: number, p: { price: number }) => sum + p.price,
      0
    ) ?? 0;
  const isOverBudget = Boolean(design.budget && totalCost > design.budget);
  const hasProducts = Boolean(design.products && design.products.length > 0);
  const cartUrl = hasProducts
    ? buildCartUrlFromProducts(design.products ?? [])
    : null;

  return (
    <div>
      {/* Header with Back Button */}
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4">
          <Button asChild size="sm" type="button" variant="ghost">
            <Link as="/explore" href="/explore">
              <ArrowLeft className="mr-2 size-4" />
              Back to Explore
            </Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div>
          {/* Hero Image Section - Airbnb Style */}
          {design.imageUrl ? (
            <section className="mb-8">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted md:aspect-2/1">
                <Image
                  alt={design.title}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  src={design.imageUrl}
                />
              </div>
            </section>
          ) : null}

          {/* Title and Key Info Section - Airbnb Style */}
          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="mb-3 font-semibold text-3xl leading-tight md:text-4xl">
                  {design.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                  {Boolean(design.roomType) && (
                    <Badge variant="secondary">
                      {ROOM_TYPES[design.roomType as RoomType]}
                    </Badge>
                  )}
                  {Boolean(design.designStyle) && (
                    <Badge variant="secondary">
                      {DESIGN_STYLES[design.designStyle as DesignStyle]}
                    </Badge>
                  )}
                  {hasProducts && (
                    <span className="flex items-center gap-1">
                      <PackageIcon className="size-3.5" />
                      {design.products?.length}{" "}
                      {design.products?.length === 1 ? "item" : "items"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout - Airbnb Style */}
          <div className="grid gap-12 lg:grid-cols-3">
            {/* Main Content Column */}
            <div className="space-y-12 lg:col-span-2">
              {/* Description */}
              <section>
                <h2 className="mb-4 border-b pb-6 font-semibold text-2xl">
                  About this design
                </h2>
                <div className="pt-2">
                  <Response className="text-foreground leading-relaxed">
                    {design.description}
                  </Response>
                </div>
              </section>

              {/* Design Plan */}
              {Boolean(design.designPlan) && (
                <section>
                  <h2 className="mb-4 border-b pb-6 font-semibold text-2xl">
                    Design Plan
                  </h2>
                  <div className="pt-2">
                    <Response className="text-foreground leading-relaxed">
                      {design.designPlan}
                    </Response>
                  </div>
                </section>
              )}

              {/* Products */}
              {hasProducts && (
                <section>
                  <h2 className="mb-4 border-b pb-6 font-semibold text-2xl">
                    Featured Products
                  </h2>
                  <div className="grid gap-8 pt-2 sm:grid-cols-2">
                    {design.products?.map(
                      (product: {
                        name: string;
                        price: number;
                        imageUrl: string;
                        productUrl?: string;
                        description?: string;
                      }) => (
                        <div
                          className="group space-y-3"
                          key={`${product.name}-${product.imageUrl}`}
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                            <Image
                              alt={product.name}
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              src={product.imageUrl}
                            />
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="font-medium text-base leading-tight">
                                {product.name}
                              </h3>
                              <span className="shrink-0 font-semibold text-base">
                                ${product.price.toLocaleString()}
                              </span>
                            </div>
                            {Boolean(product.description) && (
                              <Response className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">
                                {product.description}
                              </Response>
                            )}
                            {Boolean(product.productUrl) && (
                              <Button
                                asChild
                                className="w-full gap-2"
                                variant="outline"
                              >
                                <a
                                  href={product.productUrl}
                                  rel="noopener noreferrer"
                                  target="_blank"
                                >
                                  View Product
                                  <ExternalLinkIcon className="size-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column - Airbnb Style */}
            <div className="space-y-6 lg:col-span-1">
              <DesignSidebar
                cartUrl={cartUrl}
                design={{ budget: design.budget, products: design.products }}
                hasProducts={hasProducts}
                isLiked={isLiked}
                isOverBudget={isOverBudget}
                likesCount={likesCount}
                onLikeClick={onLikeClick}
                totalCost={totalCost}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignDetailPage() {
  const params = useParams();
  const designId = params.designId as Id<"designs"> | undefined;

  const toggleLike = useMutation(
    api.likes.toggleDesignLike
  ).withOptimisticUpdate((localStore, args) => {
    // Optimistically toggle the liked state
    const currentValue = localStore.getQuery(api.likes.isDesignLiked, {
      designId: args.designId,
    });

    if (currentValue !== undefined) {
      localStore.setQuery(
        api.likes.isDesignLiked,
        { designId: args.designId },
        !currentValue
      );
    }

    // Optimistically update the likes count
    const currentCount = localStore.getQuery(api.likes.getDesignLikesCount, {
      designId: args.designId,
    });

    if (currentCount !== undefined) {
      const newCount = currentValue ? currentCount - 1 : currentCount + 1;
      localStore.setQuery(
        api.likes.getDesignLikesCount,
        { designId: args.designId },
        Math.max(0, newCount)
      );
    }
  });

  const design = useQuery(
    api.designs.getPublicDesign,
    designId ? { designId } : "skip"
  );

  const isLiked = useQuery(
    api.likes.isDesignLiked,
    designId ? { designId } : "skip"
  );

  // Get the real-time likes count from the aggregate
  const likesCount = useQuery(
    api.likes.getDesignLikesCount,
    designId ? { designId } : "skip"
  );

  const handleLikeClick = () => {
    if (!designId) {
      return;
    }
    toggleLike({ designId });
  };

  if (!designId) {
    return <InvalidIdState />;
  }

  if (design === undefined) {
    return <LoadingState />;
  }

  if (design === null) {
    return <NotFoundState />;
  }

  return (
    <DesignContent
      design={design}
      isLiked={isLiked}
      likesCount={likesCount}
      onLikeClick={handleLikeClick}
    />
  );
}
