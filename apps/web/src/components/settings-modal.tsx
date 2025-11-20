"use client";

import { api } from "@furnish/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  Bell,
  Calendar,
  Coins,
  CreditCard,
  Database,
  Grid3x3,
  Palette,
  Settings,
  Shield,
  ShoppingBag,
  User,
  UserCog,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { CreditPurchaseModal } from "./credit-purchase-modal";

const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "billing", label: "Billing & Credits", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "personalization", label: "Personalization", icon: Palette },
  { id: "apps", label: "Apps & Connectors", icon: Grid3x3 },
  { id: "schedules", label: "Schedules", icon: Calendar },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "data", label: "Data controls", icon: Database },
  { id: "security", label: "Security", icon: Shield },
  { id: "parental", label: "Parental controls", icon: UserCog },
  { id: "account", label: "Account", icon: User },
];

type SettingsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
};

export function SettingsModal({
  open,
  onOpenChange,
  defaultTab = "general",
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const { theme, setTheme } = useTheme();
  const credits = useQuery(api.credits.getCredits);

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="h-[600px] w-full gap-0 p-0 sm:max-w-4xl">
        <div className="flex h-full overflow-hidden">
          {/* Sidebar */}
          <div className="flex w-64 flex-col border-r bg-muted/30">
            <DialogHeader className="shrink-0 p-4 pb-2">
              <DialogTitle className="text-xl">Settings</DialogTitle>
            </DialogHeader>
            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-4 pt-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    className="w-full justify-start gap-3"
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                    variant={activeTab === tab.id ? "secondary" : "ghost"}
                  >
                    <Icon className="size-4" />
                    <span>{tab.label}</span>
                  </Button>
                );
              })}
            </nav>
            <div className="border-t p-4">
              <div className="flex items-center justify-between rounded-md border bg-background p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Coins className="size-4 text-primary" />
                  <span className="font-medium text-sm">Credits</span>
                </div>
                <span className="font-bold text-sm">{credits ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">
                  Billing & Credits
                </h2>
                <div className="space-y-6">
                  <div className="flex flex-col gap-4 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                          <Coins className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">Available Credits</p>
                          <p className="text-muted-foreground text-sm">
                            Use credits to generate designs
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-2xl">
                          {credits ?? 0}
                        </span>
                        <Button onClick={() => setShowCreditModal(true)}>
                          Buy Credits
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === "general" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">General</h2>

                <div className="space-y-6">
                  {/* Theme */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Theme</Label>
                      <p className="text-muted-foreground text-sm">
                        Select your preferred theme
                      </p>
                    </div>
                    <Select onValueChange={setTheme} value={theme}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Accent Color */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Accent color</Label>
                      <p className="text-muted-foreground text-sm">
                        Choose your accent color
                      </p>
                    </div>
                    <Select defaultValue="default">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          <div className="flex items-center gap-2">
                            <div className="size-3 rounded-full bg-primary" />
                            Default
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Language */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Language</Label>
                      <p className="text-muted-foreground text-sm">
                        Select your preferred language
                      </p>
                    </div>
                    <Select defaultValue="auto">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Spoken Language */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Spoken language</Label>
                      <p className="text-muted-foreground text-sm">
                        For best results, select the language you mainly speak.
                        If it's not listed, it may still be supported via
                        auto-detection.
                      </p>
                    </div>
                    <Select defaultValue="auto">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Voice */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Voice</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" type="button" variant="ghost">
                        ▶ Play
                      </Button>
                      <Select defaultValue="arbor">
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="arbor">Arbor</SelectItem>
                          <SelectItem value="sage">Sage</SelectItem>
                          <SelectItem value="maple">Maple</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Show Additional Models */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">
                        Show additional models
                      </Label>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Notifications</h2>
                <p className="text-muted-foreground">
                  Notification settings coming soon...
                </p>
              </div>
            )}

            {/* Personalization Tab */}
            {activeTab === "personalization" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Personalization</h2>
                <p className="text-muted-foreground">
                  Personalization settings coming soon...
                </p>
              </div>
            )}

            {/* Apps & Connectors Tab */}
            {activeTab === "apps" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">
                  Apps & Connectors
                </h2>
                <p className="text-muted-foreground">
                  Apps & connectors settings coming soon...
                </p>
              </div>
            )}

            {/* Schedules Tab */}
            {activeTab === "schedules" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Schedules</h2>
                <p className="text-muted-foreground">
                  Schedule settings coming soon...
                </p>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Orders</h2>
                <p className="text-muted-foreground">
                  Order settings coming soon...
                </p>
              </div>
            )}

            {/* Data Controls Tab */}
            {activeTab === "data" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Data controls</h2>
                <p className="text-muted-foreground">
                  Data control settings coming soon...
                </p>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Security</h2>
                <p className="text-muted-foreground">
                  Security settings coming soon...
                </p>
              </div>
            )}

            {/* Parental Controls Tab */}
            {activeTab === "parental" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">
                  Parental controls
                </h2>
                <p className="text-muted-foreground">
                  Parental control settings coming soon...
                </p>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="p-6">
                <h2 className="mb-6 font-semibold text-2xl">Account</h2>
                <p className="text-muted-foreground">
                  Account settings coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <CreditPurchaseModal
        onOpenChange={setShowCreditModal}
        open={showCreditModal}
      />
    </Dialog>
  );
}
