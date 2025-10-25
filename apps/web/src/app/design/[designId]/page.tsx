import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  PackageIcon,
  TagIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Response } from "@/components/ai-elements/response";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Fixed Header */}
      <header className="shrink-0 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button asChild size="icon" variant="ghost">
              <Link href="/chat">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold text-lg leading-tight">
                {design.title}
              </h1>
              <p className="text-muted-foreground text-xs">Public Design</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {design.budget && (
              <Badge
                className="gap-1"
                variant={isOverBudget ? "destructive" : "secondary"}
              >
                <TagIcon className="size-3" />${design.budget.toLocaleString()}{" "}
                budget
              </Badge>
            )}
            {hasProducts && (
              <Badge className="gap-1" variant="outline">
                <PackageIcon className="size-3" />
                {design.products?.length} items
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <ScrollArea className="h-full flex-1">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          {/* Description Section */}
          <section className="mb-12">
            <div className="rounded-lg border bg-card p-6">
              <h2 className="mb-3 font-semibold text-lg">About this design</h2>
              <Response className="text-muted-foreground leading-relaxed">
                {design.description}
              </Response>
            </div>
          </section>

          {/* Design Image */}
          {design.imageUrl && (
            <section className="mb-12">
              <h2 className="mb-4 font-semibold text-xl">Visualization</h2>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted shadow-lg">
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

          {/* Design Plan */}
          {design.designPlan && (
            <section className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>Design Plan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Response className="text-muted-foreground leading-relaxed">
                    {design.designPlan}
                  </Response>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Budget Summary */}
          {design.budget && hasProducts && (
            <section className="mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Budget Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold text-lg">
                      ${design.budget.toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span
                      className={cn(
                        "font-semibold text-lg",
                        isOverBudget && "text-destructive"
                      )}
                    >
                      ${totalCost.toLocaleString()}
                    </span>
                  </div>
                  {isOverBudget ? (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-destructive">
                        <span className="font-medium">Over Budget</span>
                        <span className="font-semibold">
                          ${(totalCost - design.budget).toLocaleString()}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-emerald-600">
                        <span className="font-medium">Remaining</span>
                        <span className="font-semibold">
                          ${(design.budget - totalCost).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </section>
          )}

          {/* Products */}
          {hasProducts && (
            <section className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-semibold text-2xl">Featured Products</h2>
                <Badge variant="secondary">
                  {design.products?.length}{" "}
                  {design.products?.length === 1 ? "item" : "items"}
                </Badge>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {design.products?.map((product, index) => (
                  <Card
                    className="group overflow-hidden transition-shadow hover:shadow-lg"
                    key={`${product.name}-${index}`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-muted">
                      <Image
                        alt={product.name}
                        className="object-cover transition-transform group-hover:scale-105"
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        src={product.imageUrl}
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="mb-2 font-semibold text-lg leading-tight">
                        {product.name}
                      </h3>
                      <div className="mb-3 flex items-baseline gap-2">
                        <span className="font-bold text-primary text-xl">
                          ${product.price.toLocaleString()}
                        </span>
                      </div>
                      {product.description && (
                        <Response className="mb-4 line-clamp-3 text-muted-foreground text-sm leading-relaxed">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Footer spacing */}
          <div className="h-8" />
        </div>
      </ScrollArea>
    </div>
  );
}
