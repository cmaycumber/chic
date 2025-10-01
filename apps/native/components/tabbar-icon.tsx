import Ionicons from "@expo/vector-icons/Ionicons";

export const TabBarIcon = (props: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
}) => <Ionicons size={24} style={{ marginBottom: -2 }} {...props} />;
