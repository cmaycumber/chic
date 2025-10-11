"use client";

import {
  Bell,
  Calendar,
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
import { TabsContent } from "@/components/ui/tabs";

const TABS = [
  { id: "general", label: "General", icon: Settings },
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
  const { theme, setTheme } = useTheme();

  // Update active tab when defaultTab changes
  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="h-[600px] max-w-4xl gap-0 p-0">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="flex w-64 flex-col border-r bg-muted/30 p-4">
            <DialogHeader className="mb-4 px-2">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-xl">Settings</DialogTitle>
              </div>
            </DialogHeader>
            <nav className="flex-1 space-y-1">
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div>
              {/* General Tab */}
              {activeTab === "general" && (
                <TabsContent className="m-0 space-y-6 p-6" value="general">
                  <div>
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
                            For best results, select the language you mainly
                            speak. If it's not listed, it may still be supported
                            via auto-detection.
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
                </TabsContent>
              )}

              {/* Notifications Tab */}
              {activeTab === "notifications" && (
                <TabsContent className="m-0 p-6" value="notifications">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">
                      Notifications
                    </h2>
                    <p className="text-muted-foreground">
                      Notification settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Personalization Tab */}
              {activeTab === "personalization" && (
                <TabsContent className="m-0 p-6" value="personalization">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">
                      Personalization
                    </h2>
                    <p className="text-muted-foreground">
                      Personalization settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Apps & Connectors Tab */}
              {activeTab === "apps" && (
                <TabsContent className="m-0 p-6" value="apps">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">
                      Apps & Connectors
                    </h2>
                    <p className="text-muted-foreground">
                      Apps & connectors settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Schedules Tab */}
              {activeTab === "schedules" && (
                <TabsContent className="m-0 p-6" value="schedules">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">Schedules</h2>
                    <p className="text-muted-foreground">
                      Schedule settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Orders Tab */}
              {activeTab === "orders" && (
                <TabsContent className="m-0 p-6" value="orders">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">Orders</h2>
                    <p className="text-muted-foreground">
                      Order settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Data Controls Tab */}
              {activeTab === "data" && (
                <TabsContent className="m-0 p-6" value="data">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">
                      Data controls
                    </h2>
                    <p className="text-muted-foreground">
                      Data control settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <TabsContent className="m-0 p-6" value="security">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">Security</h2>
                    <p className="text-muted-foreground">
                      Security settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Parental Controls Tab */}
              {activeTab === "parental" && (
                <TabsContent className="m-0 p-6" value="parental">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">
                      Parental controls
                    </h2>
                    <p className="text-muted-foreground">
                      Parental control settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}

              {/* Account Tab */}
              {activeTab === "account" && (
                <TabsContent className="m-0 p-6" value="account">
                  <div>
                    <h2 className="mb-6 font-semibold text-2xl">Account</h2>
                    <p className="text-muted-foreground">
                      Account settings coming soon...
                    </p>
                  </div>
                </TabsContent>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
