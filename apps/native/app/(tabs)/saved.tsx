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

const SAVED_ROOMS = [
  {
    id: "1",
    name: "Scandinavian Living Room",
    style: "Minimalist",
    date: "2 days ago",
    items: 12,
  },
  {
    id: "2",
    name: "Modern Kitchen",
    style: "Contemporary",
    date: "1 week ago",
    items: 8,
  },
  {
    id: "3",
    name: "Cozy Bedroom",
    style: "Rustic",
    date: "2 weeks ago",
    items: 15,
  },
];

export default function SavedScreen() {
  return (
    <Container>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-6 py-10"
      >
        <View className="gap-3">
          <View className="flex-row items-center gap-3">
            <View className="rounded-full bg-destructive/10 p-3">
              <Ionicons color="hsl(340 82% 52%)" name="heart" size={28} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-2xl text-foreground">
                Saved Inspiration
              </Text>
              <Text className="text-muted-foreground">
                {SAVED_ROOMS.length} rooms saved for your next project
              </Text>
            </View>
          </View>
        </View>

        <View className="gap-4">
          {SAVED_ROOMS.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 gap-1.5">
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>
                      Saved {room.date} • {room.items} items
                    </CardDescription>
                  </View>
                  <Badge variant="secondary">
                    <Text className="text-secondary-foreground">
                      {room.style}
                    </Text>
                  </Badge>
                </View>
              </CardHeader>
              <CardContent>
                <View className="flex h-32 items-center justify-center rounded-lg bg-muted">
                  <Ionicons
                    color="hsl(215.4 16.3% 46.9%)"
                    name="images-outline"
                    size={48}
                  />
                  <Text className="mt-2 text-muted-foreground text-sm">
                    Room Preview
                  </Text>
                </View>
              </CardContent>
              <CardFooter className="gap-2">
                <Button className="flex-1" variant="outline">
                  <Ionicons name="share-outline" size={16} />
                  <Text>Share</Text>
                </Button>
                <Button className="flex-1">
                  <Ionicons color="white" name="pencil" size={16} />
                  <Text className="text-primary-foreground">Edit Room</Text>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Start a New Room</CardTitle>
            <CardDescription>
              Save inspiration for your next interior design project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="flex-1" variant="outline">
              <Ionicons name="add-circle-outline" size={20} />
              <Text>Create New Room</Text>
            </Button>
          </CardContent>
        </Card>
      </ScrollView>
    </Container>
  );
}
