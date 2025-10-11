"use client";

import {
  BookOpen,
  LayoutGrid,
  Search,
  Sparkles,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarAction,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarToggle,
  useSidebar,
} from "@/components/ui/sidebar";

type AppSidebarProps = Omit<
  React.ComponentProps<typeof Sidebar>,
  "children"
> & {
  className?: string;
};

const sampleChats = [
  "Logo ideas for AI designer",
  "Essay about a rat",
  "Photo origin explanation",
  "Branding guideline for Furnish",
  "Smile surgery explanation",
  "Butler request",
  "AI site name ideas",
  "Category A pathogens",
  "Shows that inspired Grey's A...",
  "Sculpture creation process",
];

export function AppSidebar({ className, ...props }: AppSidebarProps) {
  const { collapsed } = useSidebar();

  return (
    <Sidebar className={className} {...props}>
      <SidebarContent>
        <SidebarHeader className="flex items-center gap-2">
          <SidebarToggle />
          {!collapsed && (
            <Link className="font-medium text-sm" href="/">
              furnish
            </Link>
          )}
        </SidebarHeader>
        <div className="grid gap-1 px-2 pb-2">
          <Link href="/">
            <SidebarAction
              icon={<Sparkles className="size-5" />}
              label="New Consultation"
            />
          </Link>
          <SidebarAction
            icon={<Search className="size-5" />}
            label="Search chats"
          />
          <SidebarAction
            icon={<BookOpen className="size-5" />}
            label="Products"
          />
          <SidebarAction
            icon={<LayoutGrid className="size-5" />}
            label="Layouts"
          />
        </div>

        {!collapsed && (
          <>
            <div className="px-2 py-1 text-muted-foreground text-xs">Chats</div>
            <div className="flex-1 px-2">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-1 py-1">
                  {sampleChats.map((title) => (
                    <Button
                      className="w-full cursor-pointer justify-start truncate text-left font-normal"
                      key={title}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <SquareTerminal className="mr-2 size-4 shrink-0" />
                      <span className="truncate">{title}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}
        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
      </SidebarContent>
    </Sidebar>
  );
}
