"use client";

import { type UIMessage, useSmoothText } from "@convex-dev/agent/react";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CopyIcon,
  ExternalLinkIcon,
  FileAudioIcon,
  FileIcon,
  FileVideoIcon,
  ImageIcon,
  PackageIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import Image from "next/image";
import type React from "react";
import { Action, Actions } from "@/components/ai-elements/actions";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import {
  Source,
  Sources,
  SourcesContent,
  SourcesTrigger,
} from "@/components/ai-elements/sources";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Badge } from "@/components/ui/badge";
import { CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import {
  Stories,
  StoriesContent,
  Story,
  StoryImage,
  StoryOverlay,
} from "@/components/ui/stories";
import { cn } from "@/lib/utils";
import { ChicTypingIndicator } from "./chic-typing-indicator";

type MessageItemProps = {
  message: UIMessage;
  isLastMessage: boolean;
  isStreaming: boolean;
  onDesignClick?: () => void;
};

export function MessageItem({
  message,
  isLastMessage,
  isStreaming,
  onDesignClick,
}: MessageItemProps) {
  const isUser = message.role === "user";

  // Parse message parts if available, otherwise fall back to treating the whole message as text
  const parts =
    message.parts && message.parts.length > 0
      ? message.parts
      : [{ type: "text" as const, text: message.text || "" }];

  // Check if message has sources
  const sources =
    message.parts?.filter((part) => part.type === "source-url") || [];

  // Collect all reasoning parts for the Reasoning wrapper
  const reasoningParts = parts.filter((part) => part.type === "reasoning");

  return (
    <div>
      {message.role === "assistant" && sources.length > 0 && (
        <Sources>
          <SourcesTrigger count={sources.length} />
          {sources.map((part, i) => (
            <SourcesContent key={`${message.key}-source-${i}`}>
              <Source href={part.url} title={part.url} />
            </SourcesContent>
          ))}
        </Sources>
      )}

      <Message from={message.role}>
        <MessageContent className={isUser ? undefined : "rounded-none p-0"}>
          {parts.map((part, i) => {
            const isStreamingThisPart =
              message.status === "streaming" && i === parts.length - 1;

            switch (part.type) {
              case "text": {
                return (
                  <TextPart
                    isStreaming={isStreamingThisPart}
                    isUser={isUser}
                    key={`${message.key}-${i}`}
                    status={message.status}
                    text={"text" in part ? part.text : ""}
                  />
                );
              }
              case "file": {
                return (
                  <FilePartRenderer
                    key={`${message.key}-file-${i}`}
                    messageKey={message.key}
                    part={part}
                    partIndex={i}
                  />
                );
              }
              case "reasoning": {
                // Check if this is the first reasoning part
                const isFirstReasoning = parts
                  .slice(0, i)
                  .every((p) => p.type !== "reasoning");

                if (!isFirstReasoning) {
                  // Only render the Reasoning wrapper once
                  return null;
                }

                // Render all reasoning parts together in a single Reasoning component
                return (
                  <Reasoning
                    className="w-full"
                    defaultOpen={false}
                    isStreaming={isStreaming && isLastMessage}
                    key={`${message.key}-reasoning`}
                  >
                    <ReasoningTrigger />
                    {reasoningParts.map((reasoningPart, reasoningIndex) => {
                      const partIndex = parts.indexOf(reasoningPart);
                      const isStreamingThisReasoning =
                        message.status === "streaming" &&
                        isLastMessage &&
                        partIndex === parts.length - 1;

                      return (
                        <ReasoningPart
                          isStreaming={isStreamingThisReasoning}
                          key={`${message.key}-reasoning-${reasoningIndex}`}
                          text={
                            "text" in reasoningPart ? reasoningPart.text : ""
                          }
                        />
                      );
                    })}
                  </Reasoning>
                );
              }
              default: {
                // Handle tool calls (type is `tool-${string}`)
                if (part.type.startsWith("tool-")) {
                  return (
                    <ToolPartRenderer
                      key={`${message.key}-tool-${i}`}
                      onDesignClick={onDesignClick}
                      part={part}
                    />
                  );
                }
                return null;
              }
            }
          })}
        </MessageContent>
      </Message>

      {message.role === "assistant" && isLastMessage && !isStreaming && (
        <Actions className="-ml-2.5">
          <Action
            label="Copy"
            onClick={() => {
              navigator.clipboard.writeText(message.text);
            }}
          >
            <CopyIcon className="size-3" />
          </Action>
        </Actions>
      )}
    </div>
  );
}

function TextPart({
  text,
  isStreaming,
  isUser,
  status,
}: {
  text: string;
  isStreaming: boolean;
  isUser: boolean;
  status: UIMessage["status"];
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: isStreaming,
  });

  // Show error state with meaningful message
  if (status === "failed") {
    return (
      <div className="flex items-start gap-2 text-destructive">
        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
        <span className="text-sm">
          {visibleText || "Message failed to send"}
        </span>
      </div>
    );
  }

  // Show typing indicator when streaming but no text yet (for assistant only)
  if (isStreaming && !visibleText && !isUser) {
    return (
      <div className="text-foreground">
        <ChicTypingIndicator className="my-1" size={18} />
      </div>
    );
  }

  return (
    <Response
      className={cn(
        isUser && "text-foreground",
        isStreaming && "animate-pulse"
      )}
    >
      {visibleText || ""}
    </Response>
  );
}

function ReasoningPart({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [visibleText] = useSmoothText(text, {
    startStreaming: isStreaming,
  });

  // Show typing indicator when streaming but no text yet
  if (isStreaming && !visibleText) {
    return (
      <div className="mt-4 text-muted-foreground text-sm">
        <ChicTypingIndicator className="my-1" size={18} />
      </div>
    );
  }

  return (
    <ReasoningContent className={cn(isStreaming && "animate-pulse")}>
      {visibleText || ""}
    </ReasoningContent>
  );
}

function FilePartRenderer({
  part,
  messageKey,
  partIndex,
}: {
  part: { url?: string; mediaType?: string };
  messageKey: string;
  partIndex: number;
}) {
  const mimeType = part.mediaType ?? "";

  // Check media type based on mimeType
  if (mimeType.startsWith("image/")) {
    return (
      <ImagePart
        key={`${messageKey}-image-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType.startsWith("video/")) {
    return (
      <VideoPart
        key={`${messageKey}-video-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType.startsWith("audio/")) {
    return (
      <AudioPart
        key={`${messageKey}-audio-${partIndex}`}
        mimeType={mimeType}
        url={part.url}
      />
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <PdfPart
        filename={part.url?.split("/").pop()}
        key={`${messageKey}-pdf-${partIndex}`}
        url={part.url}
      />
    );
  }

  // Default to generic file
  return (
    <FilePart
      filename={part.url?.split("/").pop()}
      key={`${messageKey}-file-${partIndex}`}
      mimeType={mimeType}
      url={part.url}
    />
  );
}

function ImagePart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <ImageIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading image...</span>
      </div>
    );
  }

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border">
      <Image
        alt="Attached image"
        className="max-h-96 w-auto object-contain"
        height={400}
        src={url}
        unoptimized={mimeType?.includes("svg")}
        width={600}
      />
    </div>
  );
}

function VideoPart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileVideoIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading video...</span>
      </div>
    );
  }

  return (
    <div className="relative my-2 overflow-hidden rounded-lg border border-border">
      <video className="max-h-96 w-full" controls preload="metadata">
        <source src={url} type={mimeType || "video/mp4"} />
        <track kind="captions" label="No captions available" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

function AudioPart({ url, mimeType }: { url?: string; mimeType?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileAudioIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading audio...</span>
      </div>
    );
  }

  return (
    <div className="my-2 rounded-lg border border-border bg-muted/30 p-3">
      <audio className="w-full" controls preload="metadata">
        <source src={url} type={mimeType || "audio/mpeg"} />
        <track kind="captions" label="No captions available" />
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}

function PdfPart({ url, filename }: { url?: string; filename?: string }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading PDF...</span>
      </div>
    );
  }

  return (
    <a
      className="my-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
      download={filename}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileIcon className="size-5 text-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-sm">{filename || "PDF Document"}</div>
        <div className="text-muted-foreground text-xs">
          Click to open or download
        </div>
      </div>
    </a>
  );
}

function FilePart({
  url,
  filename,
  mimeType,
}: {
  url?: string;
  filename?: string;
  mimeType?: string;
}) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3">
        <FileIcon className="size-5 text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading file...</span>
      </div>
    );
  }

  return (
    <a
      className="my-2 flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/50"
      download={filename}
      href={url}
      rel="noopener noreferrer"
      target="_blank"
    >
      <FileIcon className="size-5 text-muted-foreground" />
      <div className="flex-1">
        <div className="font-medium text-sm">{filename || "Attached file"}</div>
        {mimeType && (
          <div className="text-muted-foreground text-xs">{mimeType}</div>
        )}
      </div>
    </a>
  );
}

type Product = {
  name: string;
  price: number;
  imageUrl: string;
  productUrl: string;
  rating?: number;
  reviewCount?: number;
  description?: string;
};

function parseProductsFromOutput(output: unknown): Product[] {
  if (Array.isArray(output)) {
    return output as Product[];
  }

  if (typeof output === "object" && output !== null) {
    const outputObj = output as Record<string, unknown>;
    if (Array.isArray(outputObj.products)) {
      return outputObj.products as Product[];
    }
  }

  return [];
}

function formatToolName(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type DesignOutput = {
  _id: string;
  title: string;
  description: string;
  imageStorageId?: string;
  products?: Product[];
  budget?: number;
  designPlan?: string;
  roomType?: string;
  designStyle?: string;
  tags?: string[];
};

type GenerateImageOutput = {
  storageIds: string[];
  message: string;
};

const MAX_RECENT_PRODUCTS_TO_SHOW = 3;

function getCustomToolRenderer(
  toolName: string,
  toolState: string,
  output: unknown,
  onDesignClick?: () => void
):
  | { type: "products"; products: Product[] }
  | { type: "custom"; component: React.ReactElement }
  | null {
  if (toolName === "search_products" && toolState === "output-available") {
    const products = parseProductsFromOutput(output);
    return { type: "products", products };
  }

  if (toolName === "create_design" && toolState === "output-available") {
    return {
      type: "custom",
      component: (
        <CreateDesignOutput
          onDesignClick={onDesignClick}
          output={output as DesignOutput}
        />
      ),
    };
  }

  if (
    toolName === "generate_design_image" &&
    toolState === "output-available"
  ) {
    return {
      type: "custom",
      component: (
        <GenerateDesignImageOutput output={output as GenerateImageOutput} />
      ),
    };
  }

  if (
    toolName === "add_products_to_design" &&
    toolState === "output-available"
  ) {
    return {
      type: "custom",
      component: (
        <AddProductsOutput
          onDesignClick={onDesignClick}
          output={output as DesignOutput}
        />
      ),
    };
  }

  if (toolName === "update_design" && toolState === "output-available") {
    return {
      type: "custom",
      component: (
        <UpdateDesignOutput
          onDesignClick={onDesignClick}
          output={output as DesignOutput}
        />
      ),
    };
  }

  if (toolName === "get_design" && toolState === "output-available") {
    return {
      type: "custom",
      component: (
        <GetDesignOutput
          onDesignClick={onDesignClick}
          output={output as DesignOutput}
        />
      ),
    };
  }

  return null;
}

function ToolPartRenderer({
  part,
  onDesignClick,
}: {
  part: {
    type: string;
    state?:
      | "input-streaming"
      | "input-available"
      | "output-available"
      | "output-error";
    input?: unknown;
    output?: unknown;
    errorText?: string;
  };
  onDesignClick?: () => void;
}) {
  const toolState = part.state ?? "input-streaming";
  const toolType = part.type as `tool-${string}`;
  const toolName = part.type.replace("tool-", "");

  // Check for custom tool rendering
  const customRenderer = getCustomToolRenderer(
    toolName,
    toolState,
    part.output,
    onDesignClick
  );

  if (customRenderer) {
    if (customRenderer.type === "products") {
      return <ProductsCarousel products={customRenderer.products} />;
    }
    return customRenderer.component;
  }

  // Default tool rendering with Tool wrapper
  return (
    <Tool defaultOpen={toolState === "output-error"}>
      <ToolHeader
        state={toolState}
        title={formatToolName(toolName)}
        type={toolType}
      />
      <ToolContent>
        {part.input !== undefined && <ToolInput input={part.input} />}
        {(part.output !== undefined || part.errorText !== undefined) && (
          <ToolOutput errorText={part.errorText} output={part.output} />
        )}
      </ToolContent>
    </Tool>
  );
}

function ProductsCarousel({ products }: { products: Product[] }) {
  // Validate products is an array and has items
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No products found
      </div>
    );
  }

  return (
    <div className="group relative w-full py-2">
      <Stories
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
      >
        <StoriesContent className="p-1">
          {products.map((product, index) => (
            <Story
              className="w-48 min-w-48"
              key={`product-${index}-${product.name}`}
              onClick={() => window.open(product.productUrl, "_blank")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  window.open(product.productUrl, "_blank");
                }
              }}
            >
              <div className="relative aspect-square w-full">
                <StoryImage alt={product.name} src={product.imageUrl} />
                <StoryOverlay side="top" />
                <StoryOverlay side="bottom" />

                {/* Price badge at top */}
                <div className="absolute top-2 right-2 z-20">
                  <Badge
                    className="bg-white/90 font-semibold text-foreground shadow-lg backdrop-blur-sm"
                    variant="secondary"
                  >
                    ${product.price.toFixed(2)}
                  </Badge>
                </div>

                {/* Product info at bottom */}
                <div className="absolute right-0 bottom-0 left-0 z-20 p-3">
                  <div className="space-y-1">
                    <p className="line-clamp-2 font-medium text-white text-xs leading-tight drop-shadow-lg">
                      {product.name}
                    </p>

                    {product.rating !== undefined && (
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <StarIcon
                              className={cn(
                                "size-2.5",
                                i < Math.floor(product.rating ?? 0)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "fill-white/20 text-white/20"
                              )}
                              key={`${product.name}-star-${i}`}
                            />
                          ))}
                        </div>
                        {product.reviewCount !== undefined && (
                          <span className="text-white/90 text-xs drop-shadow-lg">
                            ({product.reviewCount.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    <a
                      className="inline-flex items-center gap-1 text-white/90 text-xs underline underline-offset-2 drop-shadow-lg hover:text-white"
                      href={product.productUrl}
                      onClick={(e) => e.stopPropagation()}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      View on Amazon
                      <ExternalLinkIcon className="size-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            </Story>
          ))}
        </StoriesContent>

        {/* Navigation buttons - only show if there are multiple products */}
        {products.length > 1 && (
          <>
            <CarouselPrevious className="left-2 opacity-0 transition-opacity group-hover:opacity-100" />
            <CarouselNext className="right-2 opacity-0 transition-opacity group-hover:opacity-100" />
          </>
        )}
      </Stories>
    </div>
  );
}

function CreateDesignOutput({
  output,
  onDesignClick,
}: {
  output: DesignOutput;
  onDesignClick?: () => void;
}) {
  return (
    <button
      className="my-2 w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-linear-to-br from-purple-50 to-violet-50 text-left transition-all hover:shadow-md hover:ring-2 hover:ring-purple-500/20 dark:from-purple-950/20 dark:to-violet-950/20"
      onClick={onDesignClick}
      type="button"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircleIcon className="size-5 text-purple-600 dark:text-purple-400" />
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
            Design Created
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-foreground text-sm">
              {output.title}
            </h4>
            <p className="mt-1 text-muted-foreground text-xs">
              {output.description}
            </p>
          </div>

          {(output.roomType || output.designStyle) && (
            <div className="flex flex-wrap gap-2">
              {output.roomType && (
                <Badge className="text-xs" variant="secondary">
                  {output.roomType.replace(/-/g, " ")}
                </Badge>
              )}
              {output.designStyle && (
                <Badge className="text-xs" variant="secondary">
                  {output.designStyle}
                </Badge>
              )}
            </div>
          )}

          {output.budget !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>Budget:</span>
              <span className="font-medium">${output.budget.toFixed(2)}</span>
            </div>
          )}

          {output.products && output.products.length > 0 && (
            <div className="text-muted-foreground text-xs">
              <span className="font-medium">
                {output.products.length} product
                {output.products.length > 1 ? "s" : ""} added
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function GenerateDesignImageOutput({
  output,
}: {
  output: GenerateImageOutput;
}) {
  const { storageIds } = output;

  if (!storageIds || storageIds.length === 0) {
    return (
      <div className="my-2 rounded-lg border border-border bg-muted/50 p-4 text-center text-muted-foreground text-sm">
        No images generated
      </div>
    );
  }

  // Get the Convex site URL from environment
  const convexSiteUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace(
    ".cloud",
    ".site"
  );

  return (
    <div className="my-2 space-y-2">
      <div className="flex items-center gap-2 px-1">
        <SparklesIcon className="size-4 text-purple-600 dark:text-purple-400" />
        <span className="font-medium text-sm">
          Generated {storageIds.length} design
          {storageIds.length > 1 ? " variations" : ""}
        </span>
      </div>

      <div className="grid gap-2">
        {storageIds.map((storageId) => {
          // Construct the image URL using Convex HTTP endpoint
          const imageUrl = `${convexSiteUrl}/storage?id=${storageId}`;

          return (
            <div
              className="relative overflow-hidden rounded-lg border border-border"
              key={`generated-image-${storageId}`}
            >
              <Image
                alt="Generated design visualization"
                className="w-full object-cover"
                height={400}
                src={imageUrl}
                unoptimized
                width={600}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddProductsOutput({
  output,
  onDesignClick,
}: {
  output: DesignOutput;
  onDesignClick?: () => void;
}) {
  const addedProducts = output.products || [];

  return (
    <button
      className="my-2 w-full overflow-hidden rounded-lg border border-border bg-linear-to-br from-blue-50 to-indigo-50 text-left transition-all hover:shadow-md hover:ring-2 hover:ring-blue-500/20 dark:from-blue-950/20 dark:to-indigo-950/20"
      onClick={onDesignClick}
      type="button"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <PackageIcon className="size-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            Products Added
          </h3>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">
            Added {addedProducts.length} product
            {addedProducts.length > 1 ? "s" : ""} to{" "}
            <span className="font-medium text-foreground">{output.title}</span>
          </p>

          {addedProducts.length > 0 && (
            <div className="mt-3 space-y-2">
              {addedProducts
                .slice(-MAX_RECENT_PRODUCTS_TO_SHOW)
                .map((product, index) => (
                  <div
                    className="flex items-center gap-2 rounded-md bg-white/50 p-2 dark:bg-black/20"
                    key={`added-product-${index}-${product.name}`}
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded">
                      <Image
                        alt={product.name}
                        className="object-cover"
                        fill
                        src={product.imageUrl}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium text-xs">
                        {product.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function UpdateDesignOutput({
  output,
  onDesignClick,
}: {
  output: DesignOutput;
  onDesignClick?: () => void;
}) {
  return (
    <button
      className="my-2 w-full overflow-hidden rounded-lg border border-border bg-linear-to-br from-amber-50 to-orange-50 text-left transition-all hover:shadow-md hover:ring-2 hover:ring-amber-500/20 dark:from-amber-950/20 dark:to-orange-950/20"
      onClick={onDesignClick}
      type="button"
    >
      <div className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircleIcon className="size-5 text-amber-600 dark:text-amber-400" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">
            Design Updated
          </h3>
        </div>

        <div className="space-y-2">
          <p className="font-medium text-foreground text-sm">{output.title}</p>
          <p className="text-muted-foreground text-xs">
            Design successfully updated with your changes
          </p>
        </div>
      </div>
    </button>
  );
}

function GetDesignOutput({
  output,
  onDesignClick,
}: {
  output: DesignOutput;
  onDesignClick?: () => void;
}) {
  return (
    <button
      className="my-2 w-full overflow-hidden rounded-lg border border-border bg-linear-to-br from-slate-50 to-gray-50 text-left transition-all hover:shadow-md hover:ring-2 hover:ring-slate-500/20 dark:from-slate-950/20 dark:to-gray-950/20"
      onClick={onDesignClick}
      type="button"
    >
      <div className="p-4">
        <div className="space-y-3">
          <div>
            <h4 className="font-medium text-foreground text-sm">
              {output.title}
            </h4>
            <p className="mt-1 text-muted-foreground text-xs">
              {output.description}
            </p>
          </div>

          {(output.roomType || output.designStyle) && (
            <div className="flex flex-wrap gap-2">
              {output.roomType && (
                <Badge className="text-xs" variant="outline">
                  {output.roomType.replace(/-/g, " ")}
                </Badge>
              )}
              {output.designStyle && (
                <Badge className="text-xs" variant="outline">
                  {output.designStyle}
                </Badge>
              )}
            </div>
          )}

          {output.budget !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>Budget:</span>
              <span className="font-medium">${output.budget.toFixed(2)}</span>
            </div>
          )}

          {output.products && output.products.length > 0 && (
            <div className="text-muted-foreground text-xs">
              <span className="font-medium">
                {output.products.length} product
                {output.products.length > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
