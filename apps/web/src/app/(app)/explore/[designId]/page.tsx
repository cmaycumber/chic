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
  "living-room": "Living Room",
  bedroom: "Bedroom",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  "dining-room": "Dining Room",
  "home-office": "Home Office",
  "family-room": "Family Room",
  nursery: "Nursery",
  outdoor: "Outdoor",
};

const DESIGN_STYLES: Record<DesignStyle, string> = {
  modern: "Modern",
  minimalist: "Minimalist",
  scandinavian: "Scandinavian",
  industrial: "Industrial",
  bohemian: "Bohemian",
  coastal: "Coastal",
  traditional: "Traditional",
  contemporary: "Contemporary",
};

type DesignSidebarProps = {
  design: {
    budget?: number;
    products?: Array<{ productUrl?: string; price: number }>;
  };
  totalCost: number;
  isOverBudget: boolean;
  hasProducts: boolean;
  cartUrl: string | null;
  isLiked: boolean | undefined;
  likesCount: number | undefined;
  onLikeClick: () => void;
};

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
    <Card className="sticky top-20 rounded-xl border shadow-xl">
      <CardContent className="p-6">
        {/* Like Button */}
        <Button
          className={cn(
            "mb-4 w-full",
            isLiked && "bg-red-50 text-red-600 hover:bg-red-100"
          )}
          disabled={isLiked === undefined}
          onClick={onLikeClick}
          size="lg"
          type="button"
          variant={isLiked ? "outline" : "default"}
        >
          <Heart className={cn("mr-2 size-5", isLiked && "fill-current")} />
          {isLiked ? "Saved" : "Save Design"}
        </Button>

        {/* Likes Count */}
        {likesCount !== undefined && (
          <div className="mb-4 flex items-center justify-center gap-2 text-muted-foreground text-sm">
            <Heart
              className={cn(
                "size-4",
                likesCount > 0
                  ? "fill-current text-red-500"
                  : "text-muted-foreground"
              )}
            />
            <span>
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </span>
          </div>
        )}

        {design.budget && hasProducts && (
          <>
            <Separator className="my-4" />
            <div className="mb-4 flex items-baseline gap-2">
              <span className="font-semibold text-2xl">
                ${design.budget.toLocaleString()}
              </span>
              <span className="text-muted-foreground text-sm">budget</span>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span
                  className={cn(
                    "font-medium",
                    isOverBudget && "text-destructive"
                  )}
                >
                  ${totalCost.toLocaleString()}
                </span>
              </div>
              {isOverBudget ? (
                <div className="flex items-center justify-between text-destructive text-sm">
                  <span>Over Budget</span>
                  <span className="font-medium">
                    ${(totalCost - design.budget).toLocaleString()}
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between text-emerald-600 text-sm">
                  <span>Remaining</span>
                  <span className="font-medium">
                    ${(design.budget - totalCost).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {!design.budget && hasProducts && (
          <>
            <Separator className="my-4" />
            <div className="mb-4">
              <h3 className="font-semibold text-xl">Ready to purchase?</h3>
              <p className="mt-2 text-muted-foreground text-sm">
                Add all {design.products?.length} items to your Amazon cart
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">
                  Total Cost
                </span>
                <span className="font-semibold text-lg">
                  ${totalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </>
        )}

        {cartUrl && hasProducts && (
          <>
            <Separator className="my-4" />
            <Button asChild className="w-full gap-2" size="lg">
              <a href={cartUrl} rel="noopener noreferrer" target="_blank">
                <ShoppingCartIcon className="size-4" />
                Add All to Cart
              </a>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground text-sm">Loading design...</p>
        </div>
      </div>
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Design not found</p>
          <p className="mt-2 text-muted-foreground text-sm">
            This design may have been removed or is not publicly available
          </p>
          <Link href="/explore">
            <Button className="mt-4" type="button" variant="outline">
              <ArrowLeft className="mr-2 size-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InvalidIdState() {
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-muted-foreground">Invalid design ID</p>
    </div>
  );
}

type DesignContentProps = {
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
};

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
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header with Back Button */}
      <header className="shrink-0 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center px-4 lg:px-8">
          <Link href="/explore">
            <Button size="sm" type="button" variant="ghost">
              <ArrowLeft className="mr-2 size-4" />
              Back to Explore
            </Button>
          </Link>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-8">
          {/* Hero Image Section - Airbnb Style */}
          {design.imageUrl && (
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
          )}

          {/* Title and Key Info Section - Airbnb Style */}
          <div className="mb-8">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-6">
              <div className="flex-1">
                <h1 className="mb-3 font-semibold text-3xl leading-tight md:text-4xl">
                  {design.title}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                  {design.roomType && (
                    <Badge variant="secondary">
                      {ROOM_TYPES[design.roomType as RoomType]}
                    </Badge>
                  )}
                  {design.designStyle && (
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
              {design.designPlan && (
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
                      (
                        product: {
                          name: string;
                          price: number;
                          imageUrl: string;
                          productUrl?: string;
                          description?: string;
                        },
                        index: number
                      ) => (
                        <div
                          className="group space-y-3"
                          key={`${product.name}-${index}`}
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
                            {product.description && (
                              <Response className="line-clamp-2 text-muted-foreground text-sm leading-relaxed">
                                {product.description}
                              </Response>
                            )}
                            {product.productUrl && (
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
  const designId = params?.designId as Id<"designs"> | undefined;

  const toggleLike = useMutation(
    api.likes.toggleDesignLike
  ).withOptimisticUpdate((localStore, args) => {
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
