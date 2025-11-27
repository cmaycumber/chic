/** biome-ignore-all lint/a11y/useAriaPropsSupportedByRole: <explanation> */
"use client";

import type { ToolUIPart } from "ai";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("not-prose group/tool my-3", className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  title?: string;
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  className?: string;
};

const ToolIndicator = ({ state }: { state: ToolUIPart["state"] }) => {
  const isLoading = state === "input-streaming" || state === "input-available";
  const isError = state === "output-error";

  return (
    <span
      // biome-ignore lint/style/noNestedTernary: <explanation>
      aria-label={isLoading ? "Running" : isError ? "Error" : "Complete"}
      className={cn(
        "relative size-1.5 rounded-full transition-all duration-300",
        isLoading && "bg-foreground/40",
        isError && "bg-destructive",
        state === "output-available" && "bg-foreground/20"
      )}
    >
      {isLoading && (
        <span className="absolute inset-0 animate-ping rounded-full bg-foreground/30" />
      )}
    </span>
  );
};

const getStatusLabel = (state: ToolUIPart["state"]) => {
  const labels = {
    "input-streaming": "Preparing",
    "input-available": "Running",
    "output-available": "",
    "output-error": "Failed",
  } as const;
  return labels[state];
};

export const ToolHeader = ({
  className,
  title,
  type,
  state,
  ...props
}: ToolHeaderProps) => {
  const label = getStatusLabel(state);
  const isActive = state === "input-streaming" || state === "input-available";

  return (
    <CollapsibleTrigger
      className={cn(
        "flex w-full items-center gap-2 py-1.5 text-left transition-colors",
        "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      <ToolIndicator state={state} />
      <span
        className={cn(
          "font-medium text-xs tracking-wide transition-opacity",
          isActive && "opacity-70"
        )}
      >
        {title ?? type.split("-").slice(1).join(" ")}
      </span>
      {label && (
        <span className="text-muted-foreground/60 text-xs">{label}</span>
      )}
      <ChevronRightIcon
        className={cn(
          "ml-auto size-3.5 text-muted-foreground/40 transition-transform duration-200",
          "group-data-[state=open]/tool:rotate-90"
        )}
      />
    </CollapsibleTrigger>
  );
};

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "overflow-hidden",
      "data-[state=closed]:animate-out data-[state=open]:animate-in",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      "data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1",
      className
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div className={cn("space-y-2 py-3", className)} {...props}>
    <p className="font-medium text-[10px] text-muted-foreground/70 uppercase tracking-widest">
      Input
    </p>
    <div className="overflow-hidden rounded bg-muted/30">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
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

  let Output: ReactNode = <div>{output as ReactNode}</div>;

  if (typeof output === "object") {
    Output = (
      <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
    );
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="json" />;
  }

  return (
    <div
      className={cn("space-y-2 border-border/40 border-t py-3", className)}
      {...props}
    >
      <p
        className={cn(
          "font-medium text-[10px] uppercase tracking-widest",
          errorText ? "text-destructive/70" : "text-muted-foreground/70"
        )}
      >
        {errorText ? "Error" : "Output"}
      </p>
      <div
        className={cn(
          "overflow-x-auto rounded text-xs",
          errorText ? "bg-destructive/5" : "bg-muted/30"
        )}
      >
        {errorText && (
          <p className="p-3 text-destructive text-xs">{errorText}</p>
        )}
        {!errorText && Output}
      </div>
    </div>
  );
};
