import { useControllableState } from "@radix-ui/react-use-controllable-state";
import type * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import { Brain, ChevronDown, Dot } from "lucide-react-native";
import { createContext, memo, useContext } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

type ChainOfThoughtContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const ChainOfThoughtContext = createContext<ChainOfThoughtContextValue | null>(
  null
);

const useChainOfThought = () => {
  const context = useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "ChainOfThought components must be used within ChainOfThought"
    );
  }
  return context;
};

export type ChainOfThoughtProps = ViewProps & {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const ChainOfThought = memo(
  ({
    className,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ChainOfThoughtProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <ChainOfThoughtContext.Provider value={{ isOpen, setIsOpen }}>
        <View
          className={cn("not-prose max-w-prose space-y-4", className)}
          {...props}
        >
          {children}
        </View>
      </ChainOfThoughtContext.Provider>
    );
  }
);

export type ChainOfThoughtHeaderProps = CollapsiblePrimitive.TriggerProps & {
  className?: string;
};

export const ChainOfThoughtHeader = memo(
  ({ className, children, ...props }: ChainOfThoughtHeaderProps) => {
    const { isOpen, setIsOpen } = useChainOfThought();

    return (
      <Collapsible onOpenChange={setIsOpen} open={isOpen}>
        <CollapsibleTrigger
          className={cn(
            "flex w-full flex-row items-center gap-2 text-muted-foreground text-sm",
            Platform.select({ web: "transition-colors hover:text-foreground" }),
            className
          )}
          {...props}
        >
          <Brain className="size-4" />
          <Text className="flex-1 text-left">
            {children ?? "Chain of Thought"}
          </Text>
          <ChevronDown
            className={cn(
              "size-4",
              Platform.select({ web: "transition-transform" }),
              isOpen ? "rotate-180" : "rotate-0"
            )}
          />
        </CollapsibleTrigger>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtStepProps = ViewProps & {
  icon?: React.ComponentType<{ className?: string; size?: number }>;
  label: string;
  description?: string;
  status?: "complete" | "active" | "pending";
};

export const ChainOfThoughtStep = memo(
  ({
    className,
    icon: Icon = Dot,
    label,
    description,
    status = "complete",
    children,
    ...props
  }: ChainOfThoughtStepProps) => {
    const statusStyles = {
      complete: "text-muted-foreground",
      active: "text-foreground",
      pending: "text-muted-foreground/50",
    };

    return (
      <View
        className={cn(
          "flex flex-row gap-2 text-sm",
          statusStyles[status],
          "fade-in-0 slide-in-from-top-2 animate-in",
          className
        )}
        {...props}
      >
        <View className="relative mt-0.5">
          <Icon className="size-4" />
          <View className="-mx-px absolute top-7 bottom-0 left-1/2 w-px bg-border" />
        </View>
        <View className="flex-1 space-y-2">
          <Text>{label}</Text>
          {description && (
            <Text className="text-muted-foreground text-xs">{description}</Text>
          )}
          {children}
        </View>
      </View>
    );
  }
);

export type ChainOfThoughtSearchResultsProps = ViewProps;

export const ChainOfThoughtSearchResults = memo(
  ({ className, ...props }: ChainOfThoughtSearchResultsProps) => (
    <View
      className={cn("flex flex-row items-center gap-2", className)}
      {...props}
    />
  )
);

export type ChainOfThoughtSearchResultProps = ViewProps & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

export const ChainOfThoughtSearchResult = memo(
  ({
    className,
    children,
    variant = "secondary",
    ...props
  }: ChainOfThoughtSearchResultProps) => (
    <Badge
      className={cn("gap-1 px-2 py-0.5 font-normal text-xs", className)}
      variant={variant}
      {...props}
    >
      {children}
    </Badge>
  )
);

export type ChainOfThoughtContentProps = CollapsiblePrimitive.ContentProps & {
  className?: string;
};

export const ChainOfThoughtContent = memo(
  ({ className, children, ...props }: ChainOfThoughtContentProps) => {
    const { isOpen } = useChainOfThought();

    return (
      <Collapsible open={isOpen}>
        <CollapsibleContent
          className={cn(
            "mt-2 space-y-3",
            "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
            className
          )}
          {...props}
        >
          {children}
        </CollapsibleContent>
      </Collapsible>
    );
  }
);

export type ChainOfThoughtImageProps = ViewProps & {
  caption?: string;
};

export const ChainOfThoughtImage = memo(
  ({ className, children, caption, ...props }: ChainOfThoughtImageProps) => (
    <View className={cn("mt-2 space-y-2", className)} {...props}>
      <View className="relative flex max-h-[22rem] items-center justify-center overflow-hidden rounded-lg bg-muted p-3">
        {children}
      </View>
      {caption && (
        <Text className="text-muted-foreground text-xs">{caption}</Text>
      )}
    </View>
  )
);

ChainOfThought.displayName = "ChainOfThought";
ChainOfThoughtHeader.displayName = "ChainOfThoughtHeader";
ChainOfThoughtStep.displayName = "ChainOfThoughtStep";
ChainOfThoughtSearchResults.displayName = "ChainOfThoughtSearchResults";
ChainOfThoughtSearchResult.displayName = "ChainOfThoughtSearchResult";
ChainOfThoughtContent.displayName = "ChainOfThoughtContent";
ChainOfThoughtImage.displayName = "ChainOfThoughtImage";
