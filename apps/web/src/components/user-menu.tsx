"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { LayoutGrid, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { SignUpToSaveButton } from "./sign-up-to-save";
import { Button } from "./ui/button";

export default function UserMenu() {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);

  // Anonymous visitors have no account to manage yet — offer them one.
  if (user?.isAnonymous) {
    return <SignUpToSaveButton className="h-9 px-4 text-sm" />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="max-w-40 gap-2" variant="outline">
          <span className="truncate">{user?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span>My Account</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground" disabled>
          {user?.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/rooms")}>
          <LayoutGrid className="mr-2 size-4" />
          My rooms
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push("/");
                },
              },
            });
          }}
        >
          <LogOut className="mr-2 size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
