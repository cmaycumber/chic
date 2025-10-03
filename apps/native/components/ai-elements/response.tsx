import { memo } from "react";
import { View, type ViewProps } from "react-native";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ResponseProps = ViewProps & {
  children?: string;
};

export const Response = memo(
  ({ className, children, ...props }: ResponseProps) => (
    <View
      className={cn(
        "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    >
      {typeof children === "string" ? <Text>{children}</Text> : children}
    </View>
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
