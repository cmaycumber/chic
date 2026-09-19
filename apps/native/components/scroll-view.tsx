import type { ComponentType, ForwardedRef, ReactElement } from "react";
import { forwardRef } from "react";
import type { ScrollViewProps as RnScrollViewProps } from "react-native";
import { ScrollView as RnScrollView } from "react-native";
import { styled } from "react-native-css";

// `styled()` does not preserve `ScrollView`'s full (very large) prop union;
// resolving it against the actual component type produces a "union type is
// too complex to represent" error, so the base component is widened first
// and the wrapper is re-asserted against React Native's own props.
export type ScrollViewProps = RnScrollViewProps & {
  className?: string;
  contentContainerClassName?: string;
};

const StyledScrollView = styled(
  RnScrollView as ComponentType<Record<string, unknown>>,
  {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  }
) as unknown as (
  props: ScrollViewProps & { ref?: ForwardedRef<RnScrollView> }
) => ReactElement | null;

const ScrollViewBase = (
  { ...props }: ScrollViewProps,
  ref: ForwardedRef<RnScrollView>
) => <StyledScrollView ref={ref} {...props} />;

export const ScrollView = forwardRef(ScrollViewBase);

ScrollView.displayName = "ScrollView";
