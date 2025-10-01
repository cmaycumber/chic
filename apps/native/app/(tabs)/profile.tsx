import { Text, View } from "react-native";
import { Container } from "@/components/container";
import { ScrollView } from "@/components/scroll-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

export default function ProfileScreen() {
  return (
    <Container>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-6 py-10"
      >
        <View className="gap-3">
          <Text className="font-semibold text-3xl text-foreground">
            Profile & Settings
          </Text>
          <Text className="text-muted-foreground">
            Manage your account and preferences
          </Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="gap-2">
              <Label nativeID="name">Full Name</Label>
              <Input
                aria-labelledby="name"
                defaultValue="Alex Johnson"
                placeholder="Enter your name"
              />
            </View>
            <View className="gap-2">
              <Label nativeID="email">Email Address</Label>
              <Input
                aria-labelledby="email"
                defaultValue="alex@example.com"
                keyboardType="email-address"
                placeholder="email@example.com"
              />
            </View>
            <View className="gap-2">
              <Label nativeID="phone">Phone Number</Label>
              <Input
                aria-labelledby="phone"
                keyboardType="phone-pad"
                placeholder="+1 (555) 000-0000"
              />
            </View>
          </CardContent>
          <CardFooter>
            <Button className="flex-1">
              <Text className="text-primary-foreground">Save Changes</Text>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your app experience and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="font-medium text-card-foreground">
                  Push Notifications
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Receive updates about your saved rooms
                </Text>
              </View>
              <Switch checked={true} />
            </View>

            <Separator />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="font-medium text-card-foreground">
                  Email Newsletter
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Get design tips and inspiration weekly
                </Text>
              </View>
              <Switch checked={false} />
            </View>

            <Separator />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 gap-1">
                <Text className="font-medium text-card-foreground">
                  AI Suggestions
                </Text>
                <Text className="text-muted-foreground text-sm">
                  Enable personalized design recommendations
                </Text>
              </View>
              <Switch checked={true} />
            </View>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <Button className="flex-1" variant="outline">
              <Text>Export My Data</Text>
            </Button>
            <Button className="flex-1" variant="destructive">
              <Text className="text-white">Delete Account</Text>
            </Button>
          </CardContent>
        </Card>

        <View className="items-center gap-2 py-4">
          <Text className="text-muted-foreground text-sm">
            Furnish App v1.0.0
          </Text>
          <Text className="text-muted-foreground text-xs">
            © 2025 Furnish. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
}
