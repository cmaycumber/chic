import Ionicons from "@expo/vector-icons/Ionicons";

export const TabBarIcon = (props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: React.ComponentProps<typeof Ionicons>["color"];
}) => <Ionicons size={24} style={{ marginBottom: -2 }} {...props} />;
