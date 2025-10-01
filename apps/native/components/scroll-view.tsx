import type { ComponentPropsWithoutRef, ForwardedRef } from "react";
import { forwardRef } from "react";
import { ScrollView as RnScrollView } from "react-native";
import { styled } from "react-native-css";

const StyledScrollView = styled(RnScrollView, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

export type ScrollViewProps = ComponentPropsWithoutRef<typeof StyledScrollView>;

const ScrollViewBase = (
  { ...props }: ScrollViewProps,
  ref: ForwardedRef<RnScrollView>
) => <StyledScrollView ref={ref} {...props} />;

export const ScrollView = forwardRef(ScrollViewBase);

ScrollView.displayName = "ScrollView";
