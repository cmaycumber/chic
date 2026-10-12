import type { ReactNode } from "react";

/** One titled section of the privacy, terms or support page. */
export function LegalSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id?: string;
  title: string;
}) {
  return (
    <section className="scroll-mt-24 space-y-4" id={id}>
      <h2 className="font-semibold text-2xl">{title}</h2>
      <div className="space-y-4 text-muted-foreground">{children}</div>
    </section>
  );
}

/** A bulleted list in the muted body style of the legal pages. */
export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5">{children}</ul>;
}
