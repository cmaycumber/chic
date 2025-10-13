import { ArrowDown } from "lucide-react-native";
import type { ReactNode } from "react";
import {
  ScrollView,
  type ScrollViewProps,
  View,
  type ViewProps,
} from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type ConversationProps = ScrollViewProps;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <ScrollView
    className={cn("relative flex-1", className)}
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ViewProps;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <View className={cn("p-4", className)} {...props} />
);

export type ConversationEmptyStateProps = ViewProps & {
  title?: string;
  description?: string;
  icon?: ReactNode;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => (
  <View
    className={cn(
      "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
      className
    )}
    {...props}
  >
    {children ?? (
      <>
        {icon && <View className="text-muted-foreground">{icon}</View>}
        <View className="space-y-1">
          <Text className="font-medium text-sm">{title}</Text>
          {description && (
            <Text className="text-muted-foreground text-sm">{description}</Text>
          )}
        </View>
      </>
    )}
  </View>
);

export type ConversationScrollButtonProps = ButtonProps;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  // Simplified for React Native - would need more complex scroll tracking
  return (
    <Button
      className={cn("absolute bottom-4 left-[50%] rounded-full", className)}
      size="icon"
      variant="outline"
      {...props}
    >
      <ArrowDown className="size-4" />
    </Button>
  );
};
