import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/tabbar-icon";
import { useColorScheme } from "@/lib/use-color-scheme";

const ACCENT_LIGHT = "hsl(221.2 83.2% 53.3%)";
const ACCENT_DARK = "hsl(217.2 91.2% 59.8%)";
const INACTIVE_LIGHT = "hsl(215.4 16.3% 46.9%)";
const INACTIVE_DARK = "hsl(215 20.2% 65.1%)";
const BAR_BG_LIGHT = "hsl(0 0% 100%)";
const BAR_BG_DARK = "hsl(222.2 84% 4.9%)";
const BORDER_LIGHT = "hsl(214.3 31.8% 91.4%)";
const BORDER_DARK = "hsl(217.2 32.6% 17.5%)";

export default function TabsLayout() {
  const { isDarkColorScheme } = useColorScheme();

  return (
    <Tabs
      initialRouteName="index"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDarkColorScheme ? ACCENT_DARK : ACCENT_LIGHT,
        tabBarInactiveTintColor: isDarkColorScheme
          ? INACTIVE_DARK
          : INACTIVE_LIGHT,
        tabBarStyle: {
          backgroundColor: isDarkColorScheme ? BAR_BG_DARK : BAR_BG_LIGHT,
          borderTopColor: isDarkColorScheme ? BORDER_DARK : BORDER_LIGHT,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="home" />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: "AI Chat",
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} name="sparkles" />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved Rooms",
          tabBarIcon: ({ color }) => (
            <TabBarIcon color={color} name="bookmark" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon color={color} name="person" />,
        }}
      />
    </Tabs>
  );
}
