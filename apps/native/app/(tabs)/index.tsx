import Ionicons from "@expo/vector-icons/Ionicons";
import { Link } from "expo-router";
import { Text, View } from "react-native";

import { Container } from "@/components/container";
import { ScrollView } from "@/components/scroll-view";

const AI_LINK_COLOR = "hsl(221.2 83.2% 53.3%)";
const AI_ICON_COLOR = "hsl(217.2 91.2% 59.8%)";
const SAVED_ICON_COLOR = "hsl(340 82% 52%)";

export default function HomeScreen() {
  return (
    <Container>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-8 px-6 py-10"
      >
        <View className="gap-3">
          <Text className="font-medium text-muted-foreground text-sm uppercase tracking-wide">
            welcome to furnish native
          </Text>
          <Text className="font-semibold text-3xl text-foreground">
            Design with a co-pilot built in
          </Text>
          <Text className="text-muted-foreground">
            Jump back into your saved inspiration or start ideating with Furnish
            AI.
          </Text>
        </View>

        <View className="gap-4">
          <Link asChild href="/(tabs)/ai">
            <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
              <View className="flex-1 flex-row items-center gap-4">
                <View className="rounded-full bg-primary/10 p-3">
                  <Ionicons color={AI_ICON_COLOR} name="sparkles" size={28} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-card-foreground text-lg">
                    Chat with Furnish AI
                  </Text>
                  <Text className="text-muted-foreground">
                    Brainstorm layouts, palettes, and furniture pairings.
                  </Text>
                </View>

                <Ionicons
                  color={AI_LINK_COLOR}
                  name="chevron-forward"
                  size={24}
                />
              </View>
            </View>
          </Link>

          <Link asChild href="/(tabs)/saved">
            <View className="flex-row items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm">
              <View className="flex-1 flex-row items-center gap-4">
                <View className="rounded-full bg-secondary/10 p-3">
                  <Ionicons color={SAVED_ICON_COLOR} name="heart" size={28} />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-card-foreground text-lg">
                    Review saved rooms
                  </Text>
                  <Text className="text-muted-foreground">
                    Browse inspiration you&apos;ve collected for your next
                    project.
                  </Text>
                </View>
                <Ionicons
                  color={AI_LINK_COLOR}
                  name="chevron-forward"
                  size={24}
                />
              </View>
            </View>
          </Link>
        </View>
      </ScrollView>
    </Container>
  );
}
