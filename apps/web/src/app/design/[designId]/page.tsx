import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import { ExternalLinkIcon, PackageIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Response } from "@/components/ai-elements/response";
import { BackButton } from "@/components/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type DesignPageProps = {
  params: Promise<{
    designId: string;
  }>;
};

export async function generateMetadata({
  params,
}: DesignPageProps): Promise<Metadata> {
  const { designId } = await params;

  try {
    const design = await fetchQuery(api.designs.getPublicDesign, {
      designId: designId as Id<"designs">,
    });

    if (!design) {
      return {
        title: "Design Not Found",
      };
    }

    return {
      title: `${design.title} | chic`,
      description: design.description,
      openGraph: {
        title: design.title,
        description: design.description,
        images: design.imageUrl ? [design.imageUrl] : [],
      },
    };
  } catch {
    return {
      title: "Design Not Found",
    };
  }
}

export default async function DesignPage({ params }: DesignPageProps) {
  const { designId } = await params;

  const design = await fetchQuery(api.designs.getPublicDesign, {
    designId: designId as Id<"designs">,
  });

  if (!design) {
    notFound();
  }

  const totalCost = design.products?.reduce((sum, p) => sum + p.price, 0) ?? 0;
  const isOverBudget = Boolean(design.budget && totalCost > design.budget);
  const hasProducts = design.products && design.products.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header with Back Button */}
      <header className="shrink-0 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center px-4 lg:px-8">
          <BackButton />
        </div>
      </header>

      {/* Scrollable Content */}
      <ScrollArea className="h-full flex-1">
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
                  <Badge variant="secondary">Public Design</Badge>
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
                    {design.products?.map((product, index) => (
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
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Sidebar Column - Airbnb Style */}
            <div className="space-y-6 lg:col-span-1">
              {/* Budget Summary Card */}
              {design.budget && hasProducts && (
                <Card className="sticky top-8 rounded-xl border shadow-xl">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-baseline gap-2">
                      <span className="font-semibold text-2xl">
                        ${design.budget.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        budget
                      </span>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Cost
                        </span>
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
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer spacing */}
          <div className="h-16" />
        </div>
      </ScrollArea>
    </div>
  );
}
