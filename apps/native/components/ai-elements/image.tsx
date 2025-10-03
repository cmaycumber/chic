import type { Experimental_GeneratedImage } from "ai";
import {
  Image as RnImage,
  type ImageProps as RnImageProps,
} from "react-native";
import { cn } from "@/lib/utils";

export type ImageProps = Experimental_GeneratedImage & {
  className?: string;
  alt?: string;
};

export const Image = ({
  base64,
  uint8Array,
  mediaType,
  className,
  alt,
  ...props
}: ImageProps) => (
  <RnImage
    {...(props as Omit<RnImageProps, "source">)}
    accessibilityLabel={alt}
    className={cn("h-auto max-w-full overflow-hidden rounded-md", className)}
    source={{ uri: `data:${mediaType};base64,${base64}` }}
  />
);
