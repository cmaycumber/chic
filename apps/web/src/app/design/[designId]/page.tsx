import { api } from "@furnish/backend/convex/_generated/api";
import type { Id } from "@furnish/backend/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      title: `${design.title} | furnish`,
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

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-3 font-bold text-4xl">{design.title}</h1>
        <p className="text-lg text-muted-foreground">{design.description}</p>
        {design.budget && (
          <div className="mt-4">
            <Badge className="text-base" variant="secondary">
              Budget: ${design.budget.toLocaleString()}
            </Badge>
          </div>
        )}
      </div>

      {/* Design Image */}
      {design.imageUrl && (
        <div className="mb-12">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            <Image
              alt={design.title}
              className="object-cover"
              fill
              priority
              sizes="(max-width: 1280px) 100vw, 1280px"
              src={design.imageUrl}
            />
          </div>
        </div>
      )}

      {/* Design Plan */}
      {design.designPlan && (
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Design Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {design.designPlan}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Products */}
      {design.products && design.products.length > 0 && (
        <div>
          <h2 className="mb-6 font-semibold text-2xl">Featured Products</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {design.products.map((product, index) => (
              <Card key={`${product.name}-${index}`}>
                <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
                  <Image
                    alt={product.name}
                    className="object-cover"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    src={product.imageUrl}
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="mb-2 font-semibold text-lg">{product.name}</h3>
                  <p className="mb-3 font-bold text-primary text-xl">
                    ${product.price.toLocaleString()}
                  </p>
                  {product.description && (
                    <p className="mb-4 text-muted-foreground text-sm">
                      {product.description}
                    </p>
                  )}
                  {product.productUrl && (
                    <Button asChild className="w-full" variant="outline">
                      <a
                        href={product.productUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        View Product
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
