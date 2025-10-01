import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { Container } from "@/components/container";
import { ScrollView } from "@/components/scroll-view";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";

const SUGGESTIONS = [
  "Design a cozy living room",
  "Modern kitchen layout",
  "Minimalist bedroom ideas",
  "Color palette for office",
];

export default function AiScreen() {
  return (
    <Container>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-6 py-10"
      >
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-primary/10 p-3">
              <Ionicons
                color="hsl(217.2 91.2% 59.8%)"
                name="sparkles"
                size={28}
              />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-2xl text-foreground">
                AI Design Assistant
              </Text>
              <Text className="text-muted-foreground">
                Your personal interior design co-pilot
              </Text>
            </View>
          </View>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Start a Conversation</CardTitle>
            <CardDescription>
              Ask me anything about layouts, colors, furniture, or styling tips
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <Input
              className="min-h-20"
              multiline
              numberOfLines={3}
              placeholder="What room would you like to design?"
            />

            <Button>
              <Ionicons color="white" name="send" size={16} />
              <Text className="text-primary-foreground">Send Message</Text>
            </Button>
          </CardContent>
        </Card>

        <View className="gap-3">
          <Text className="font-medium text-foreground">Popular Prompts</Text>
          <View className="flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Badge key={suggestion} variant="secondary">
                <Text className="text-secondary-foreground">{suggestion}</Text>
              </Badge>
            ))}
          </View>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Pick up where you left off</CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <View className="gap-3">
              <View className="gap-2">
                <Text className="font-medium text-card-foreground">
                  Scandinavian Living Room Design
                </Text>
                <Text
                  className="text-muted-foreground text-sm"
                  numberOfLines={2}
                >
                  Discussed neutral color palettes, natural materials, and
                  furniture placement for a 15×20 space...
                </Text>
                <Text className="text-muted-foreground text-xs">
                  2 hours ago
                </Text>
              </View>

              <Separator />

              <View className="gap-2">
                <Text className="font-medium text-card-foreground">
                  Modern Home Office Setup
                </Text>
                <Text
                  className="text-muted-foreground text-sm"
                  numberOfLines={2}
                >
                  Explored ergonomic furniture, lighting solutions, and cable
                  management strategies...
                </Text>
                <Text className="text-muted-foreground text-xs">Yesterday</Text>
              </View>
            </View>
          </CardContent>
          <CardFooter>
            <Button className="flex-1" variant="outline">
              <Text>View All Conversations</Text>
            </Button>
          </CardFooter>
        </Card>
      </ScrollView>
    </Container>
  );
}
