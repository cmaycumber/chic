import type * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import { Book, ChevronDown } from "lucide-react-native";
import { Linking, Pressable, View, type ViewProps } from "react-native";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type SourcesProps = CollapsiblePrimitive.RootProps & {
  className?: string;
};

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("not-prose mb-4 text-primary text-xs", className)}
    {...props}
  />
);

export type SourcesTriggerProps = CollapsiblePrimitive.TriggerProps & {
  count: number;
  className?: string;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn("flex flex-row items-center gap-2", className)}
    {...props}
  >
    {children ?? (
      <>
        <Text className="font-medium">Used {count} sources</Text>
        <ChevronDown className="h-4 w-4" />
      </>
    )}
  </CollapsibleTrigger>
);

export type SourcesContentProps = CollapsiblePrimitive.ContentProps & {
  className?: string;
};

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-3 flex w-fit flex-col gap-2",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type SourceProps = ViewProps & {
  href?: string;
  title?: string;
};

export const Source = ({
  href,
  title,
  children,
  className,
  ...props
}: SourceProps) => {
  const handlePress = () => {
    if (href) {
      Linking.openURL(href);
    }
  };

  return (
    <Pressable
      className={cn("flex flex-row items-center gap-2", className)}
      onPress={handlePress}
      {...props}
    >
      {children ?? (
        <>
          <Book className="h-4 w-4" />
          <Text className="font-medium">{title}</Text>
        </>
      )}
    </Pressable>
  );
};
