import { ScrollView, type ScrollViewProps, View } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SuggestionsProps = ScrollViewProps;

export const Suggestions = ({
  className,
  children,
  ...props
}: SuggestionsProps) => (
  <ScrollView
    className="w-full"
    horizontal
    showsHorizontalScrollIndicator={false}
    {...props}
  >
    <View
      className={cn("flex flex-row flex-nowrap items-center gap-2", className)}
    >
      {children}
    </View>
  </ScrollView>
);

export type SuggestionProps = Omit<ButtonProps, "onPress"> & {
  suggestion: string;
  onPress?: (suggestion: string) => void;
};

export const Suggestion = ({
  suggestion,
  onPress,
  className,
  variant = "outline",
  size = "sm",
  children,
  ...props
}: SuggestionProps) => {
  const handlePress = () => {
    onPress?.(suggestion);
  };

  return (
    <Button
      className={cn("rounded-full px-4", className)}
      onPress={handlePress}
      size={size}
      variant={variant}
      {...props}
    >
      {children || suggestion}
    </Button>
  );
};
