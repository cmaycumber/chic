import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ArtifactProps = ViewProps;

export const Artifact = ({ className, ...props }: ArtifactProps) => (
  <View
    className={cn(
      "flex flex-col overflow-hidden rounded-lg border bg-background shadow-sm",
      className
    )}
    {...props}
  />
);

export type ArtifactHeaderProps = ViewProps;

export const ArtifactHeader = ({
  className,
  ...props
}: ArtifactHeaderProps) => (
  <View
    className={cn(
      "flex flex-row items-center justify-between border-b bg-muted/50 px-4 py-3",
      className
    )}
    {...props}
  />
);

export type ArtifactCloseProps = ButtonProps;

export const ArtifactClose = ({
  className,
  children,
  size = "sm",
  variant = "ghost",
  ...props
}: ArtifactCloseProps) => (
  <Button
    accessibilityLabel="Close"
    className={cn(
      "size-8 p-0 text-muted-foreground",
      Platform.select({ web: "hover:text-foreground" }),
      className
    )}
    size={size}
    variant={variant}
    {...props}
  >
    {children ?? <X className="size-4" />}
  </Button>
);

export type ArtifactTitleProps = ViewProps & {
  children?: ReactNode;
};

export const ArtifactTitle = ({
  className,
  children,
  ...props
}: ArtifactTitleProps) => (
  <Text
    className={cn("font-medium text-foreground text-sm", className)}
    {...props}
  >
    {children}
  </Text>
);

export type ArtifactDescriptionProps = ViewProps & {
  children?: ReactNode;
};

export const ArtifactDescription = ({
  className,
  children,
  ...props
}: ArtifactDescriptionProps) => (
  <Text className={cn("text-muted-foreground text-sm", className)} {...props}>
    {children}
  </Text>
);

export type ArtifactActionsProps = ViewProps;

export const ArtifactActions = ({
  className,
  ...props
}: ArtifactActionsProps) => (
  <View
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
);

export type ArtifactActionProps = ButtonProps & {
  tooltip?: string;
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export const ArtifactAction = ({
  tooltip,
  label,
  icon: Icon,
  children,
  className,
  size = "sm",
  variant = "ghost",
  ...props
}: ArtifactActionProps) => {
  const button = (
    <Button
      accessibilityLabel={label || tooltip}
      className={cn(
        "size-8 p-0 text-muted-foreground",
        Platform.select({ web: "hover:text-foreground" }),
        className
      )}
      size={size}
      variant={variant}
      {...props}
    >
      {Icon ? <Icon className="size-4" /> : children}
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

export type ArtifactContentProps = ViewProps;

export const ArtifactContent = ({
  className,
  ...props
}: ArtifactContentProps) => (
  <View className={cn("flex-1 overflow-auto p-4", className)} {...props} />
);
