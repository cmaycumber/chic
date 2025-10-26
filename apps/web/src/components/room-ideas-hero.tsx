type RoomIdeasHeroProps = {
  roomLabel: string;
  description: string;
};

export function RoomIdeasHero({ roomLabel, description }: RoomIdeasHeroProps) {
  return (
    <section className="container mx-auto px-4 py-12 md:py-16">
      <div className="mx-auto max-w-4xl text-center">
        <h1 className="mb-4 font-bold text-5xl tracking-tight md:text-6xl">
          {roomLabel} Ideas
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-muted-foreground text-sm">
          <span>✓ 50+ Curated Designs</span>
          <span>•</span>
          <span>✓ Real Product Recommendations</span>
          <span>•</span>
          <span>✓ Free AI Design Tool</span>
        </div>
      </div>
    </section>
  );
}
