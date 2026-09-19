"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Bell, LogOut, Palette, Settings, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { SettingsModal } from "./settings-modal";
import { SignUpToSaveButton } from "./sign-up-to-save";
import { Button } from "./ui/button";

export default function UserMenu() {
  const router = useRouter();
  const user = useQuery(api.auth.getCurrentUser);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");

  function openSettings(tab = "general") {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }

  // Anonymous visitors have no account to manage yet — offer them one.
  if (user?.isAnonymous) {
    return <SignUpToSaveButton className="h-9 px-4 text-sm" />;
  }

  return (
    <>
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
          <DropdownMenuItem onClick={() => openSettings("notifications")}>
            <Bell className="mr-2 size-4" />
            Notifications
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSettings("personalization")}>
            <Palette className="mr-2 size-4" />
            Personalization
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSettings("security")}>
            <Shield className="mr-2 size-4" />
            Security
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openSettings("account")}>
            <User className="mr-2 size-4" />
            Account
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => openSettings("general")}>
            <Settings className="mr-2 size-4" />
            Settings
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

      <SettingsModal
        defaultTab={settingsTab}
        onOpenChange={setSettingsOpen}
        open={settingsOpen}
      />
    </>
  );
}
