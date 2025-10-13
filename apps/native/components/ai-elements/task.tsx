import type * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import { ChevronDown, Search } from "lucide-react-native";
import { Pressable, View, type ViewProps } from "react-native";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type TaskItemFileProps = ViewProps;

export const TaskItemFile = ({
  children,
  className,
  ...props
}: TaskItemFileProps) => (
  <View
    className={cn(
      "inline-flex flex-row items-center gap-1 rounded-md border bg-secondary px-1.5 py-0.5 text-foreground text-xs",
      className
    )}
    {...props}
  >
    {children}
  </View>
);

export type TaskItemProps = ViewProps;

export const TaskItem = ({ children, className, ...props }: TaskItemProps) => (
  <View className={cn("text-muted-foreground text-sm", className)} {...props}>
    {typeof children === "string" ? <Text>{children}</Text> : children}
  </View>
);

export type TaskProps = CollapsiblePrimitive.RootProps & {
  className?: string;
};

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />
);

export type TaskTriggerProps = CollapsiblePrimitive.TriggerProps & {
  title: string;
  className?: string;
};

export const TaskTrigger = ({
  children,
  className,
  title,
  ...props
}: TaskTriggerProps) => (
  <CollapsibleTrigger asChild className={cn("group", className)} {...props}>
    {children ?? (
      <Pressable className="flex w-full flex-row items-center gap-2 text-muted-foreground text-sm">
        <Search className="size-4" />
        <Text className="text-sm">{title}</Text>
        <ChevronDown className="size-4 group-data-[state=open]:rotate-180" />
      </Pressable>
    )}
  </CollapsibleTrigger>
);

export type TaskContentProps = CollapsiblePrimitive.ContentProps & {
  className?: string;
};

export const TaskContent = ({
  children,
  className,
  ...props
}: TaskContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  >
    <View className="mt-4 space-y-2 border-muted border-l-2 pl-4">
      {children}
    </View>
  </CollapsibleContent>
);
