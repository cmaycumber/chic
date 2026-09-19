import Link from "next/link";
import { HomeShowcase } from "@/components/home-showcase";
import { RoomComposerBar } from "@/components/room-composer-bar";

const FOOTER_LINKS = [
  { href: "/ideas", label: "Ideas" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
] as const;

export default function HomePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-ink">
      <HomeShowcase />

      {/* Bottom-anchored composer column */}
      <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <RoomComposerBar className="mx-auto w-full max-w-2xl" />

        <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-white/50 text-xs">
          <span>© Chic</span>
          {FOOTER_LINKS.map((link) => (
            <Link
              className="hover:text-white/80"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
          <a
            className="hover:text-white/80"
            href="https://unsplash.com/@spacejoy"
            rel="noopener noreferrer"
            target="_blank"
          >
            Photo: Spacejoy / Unsplash
          </a>
        </footer>
      </div>
    </div>
  );
}
