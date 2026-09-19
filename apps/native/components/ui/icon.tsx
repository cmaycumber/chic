import type { LucideIcon, LucideProps } from "lucide-react-native";
import { styled } from "nativewind";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type IconProps = LucideProps & {
  as: LucideIcon;
};

function IconImpl({ as: IconComponent, ...props }: IconProps) {
  return <IconComponent {...props} />;
}

// `cssInterop` was removed in nativewind 5 / react-native-css; `styled` is its
// replacement for mapping `className` to native props on third-party components.
// TypeScript resolves `styled()` against react-native-css's web typings by
// default, which can't validate the native-only `nativeStyleToProp` mapping
// against a third-party component's specific props, so the base component is
// widened before wrapping and the result is re-asserted below.
const iconStyleMapping = {
  className: {
    target: "style",
    nativeStyleToProp: {
      height: "size",
      width: "size",
    },
  },
};
const StyledIconImpl = styled(
  IconImpl as unknown as ComponentType<Record<string, unknown>>,
  // The mapping is structurally correct (it mirrors the removed `cssInterop`
  // config), but the widened component type above can't express which of its
  // props "style" dot-paths to, so the exact shape check is bypassed here.
  iconStyleMapping as never
) as unknown as (props: IconProps) => ReturnType<typeof IconImpl>;

/**
 * A wrapper component for Lucide icons with Nativewind `className` support via `cssInterop`.
 *
 * This component allows you to render any Lucide icon while applying utility classes
 * using `nativewind`. It avoids the need to wrap or configure each icon individually.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/registry/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using Nativewind.
 * @param {number} size - Icon size (defaults to 14).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({
  as: IconComponent,
  className,
  size = 14,
  ...props
}: IconProps) {
  return (
    <StyledIconImpl
      as={IconComponent}
      className={cn("text-foreground", className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
