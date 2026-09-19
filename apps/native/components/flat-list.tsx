import type { ComponentType, ForwardedRef, ReactElement } from "react";
import { forwardRef } from "react";
import type { FlatListProps as RnFlatListProps } from "react-native";
import { FlatList as RnFlatList } from "react-native";
import { styled } from "react-native-css";

// `styled()` does not preserve `FlatList`'s generic item type and resolving
// its full (very large) prop union produces a "union type is too complex to
// represent" error, so the base component is widened first and the wrapper
// is re-asserted against React Native's own generic FlatList props.
export type FlatListProps<ItemT> = RnFlatListProps<ItemT> & {
  className?: string;
  contentContainerClassName?: string;
};

const StyledFlatList = styled(
  RnFlatList as unknown as ComponentType<Record<string, unknown>>,
  {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  }
) as unknown as <ItemT>(
  props: FlatListProps<ItemT> & { ref?: ForwardedRef<RnFlatList<ItemT>> }
) => ReactElement | null;

const FlatListBase = <ItemT,>(
  { ...props }: FlatListProps<ItemT>,
  ref: ForwardedRef<RnFlatList<ItemT>>
) => <StyledFlatList ref={ref} {...props} />;

export const FlatList = forwardRef(FlatListBase) as (<ItemT>(
  props: FlatListProps<ItemT> & { ref?: ForwardedRef<RnFlatList<ItemT>> }
) => ReactElement | null) & { displayName?: string };

FlatList.displayName = "FlatList";
