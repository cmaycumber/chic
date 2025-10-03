import type * as CollapsiblePrimitive from "@rn-primitives/collapsible";
import type { ToolUIPart } from "ai";
import {
  CheckCircle,
  ChevronDown,
  Circle,
  Clock,
  Wrench,
  XCircle,
} from "lucide-react-native";
import type { ReactNode } from "react";
import { Platform, View, type ViewProps } from "react-native";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export type ToolProps = CollapsiblePrimitive.RootProps & {
  className?: string;
};

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("not-prose mb-4 w-full rounded-md border", className)}
    {...props}
  />
);

export type ToolHeaderProps = CollapsiblePrimitive.TriggerProps & {
  title?: string;
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  className?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
  } as const;

  const icons = {
    "input-streaming": <Circle className="size-4" />,
    "input-available": <Clock className="size-4 animate-pulse" />,
    "output-available": <CheckCircle className="size-4 text-green-600" />,
    "output-error": <XCircle className="size-4 text-red-600" />,
  } as const;

  return (
    <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
      {icons[status]}
      <Text>{labels[status]}</Text>
    </Badge>
  );
};

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  ...props
}: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      "flex w-full flex-row items-center justify-between gap-4 p-3",
      className
    )}
    {...props}
  >
    <View className="flex flex-row items-center gap-2">
      <Wrench className="size-4 text-muted-foreground" />
      <Text className="font-medium text-sm">
        {title ?? type.split("-").slice(1).join("-")}
      </Text>
      {getStatusBadge(state)}
    </View>
    <ChevronDown
      className={cn(
        "size-4 text-muted-foreground",
        Platform.select({ web: "transition-transform" }),
        "group-data-[state=open]:rotate-180"
      )}
    />
  </CollapsibleTrigger>
);

export type ToolContentProps = CollapsiblePrimitive.ContentProps & {
  className?: string;
};

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ViewProps & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <View className={cn("space-y-2 overflow-hidden p-4", className)} {...props}>
    <Text className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
      Parameters
    </Text>
    <View className="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </View>
  </View>
);

export type ToolOutputProps = ViewProps & {
  output: ToolUIPart["output"];
  errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  let Output = (
    <View>
      <Text>{output as ReactNode}</Text>
    </View>
  );

  if (typeof output === "object") {
    Output = (
      <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="json" />;
  }

  return (
    <View className={cn("space-y-2 p-4", className)} {...props}>
      <Text className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {errorText ? "Error" : "Result"}
      </Text>
      <View
        className={cn(
          "overflow-x-auto rounded-md text-xs",
          errorText
            ? "bg-destructive/10 text-destructive"
            : "bg-muted/50 text-foreground"
        )}
      >
        {errorText && <Text>{errorText}</Text>}
        {Output}
      </View>
    </View>
  );
};
