"use client";

type ChatHeaderProps = {
  isStreaming?: boolean;
  extra?: React.ReactNode;
};

export function ChatHeader({ extra }: ChatHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div />

      {extra}
    </header>
  );
}
