import { Platform, View, type ViewProps } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ActionsProps = ViewProps;

export const Actions = ({ className, children, ...props }: ActionsProps) => (
  <View className={cn("flex-row items-center gap-1", className)} {...props}>
    {children}
  </View>
);

export type ActionProps = ButtonProps & {
  tooltip?: string;
  label?: string;
};

export const Action = ({
  tooltip,
  children,
  label,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: ActionProps) => {
  const button = (
    <Button
      accessibilityLabel={label || tooltip}
      className={cn(
        "relative size-9 p-1.5 text-muted-foreground",
        Platform.select({ web: "hover:text-foreground" }),
        className
      )}
      size={size}
      variant={variant}
      {...props}
    >
      {children}
    </Button>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <Text>{tooltip}</Text>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
};
