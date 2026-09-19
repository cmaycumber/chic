import type { ComponentType, ForwardedRef, ReactElement } from "react";
import { forwardRef } from "react";
import type { FlatListProps } from "react-native";
import { FlatList } from "react-native";
import { styled } from "react-native-css";

// `styled()` does not preserve `FlatList`'s generic item type and resolving
// its full (very large) prop union produces a "union type is too complex to
// represent" error, so the base component is widened first and the wrapper
// is re-asserted against React Native's own generic FlatList props.
export type NativeFlatListProps<ItemT> = FlatListProps<ItemT> & {
  className?: string;
  contentContainerClassName?: string;
};

const StyledFlatList = styled(
  FlatList as unknown as ComponentType<Record<string, unknown>>,
  {
    className: "style",
    contentContainerClassName: "contentContainerStyle",
  }
) as unknown as <ItemT>(
  props: NativeFlatListProps<ItemT> & { ref?: ForwardedRef<FlatList<ItemT>> }
) => ReactElement | null;

const NativeFlatListBase = <ItemT,>(
  { ...props }: NativeFlatListProps<ItemT>,
  ref: ForwardedRef<FlatList<ItemT>>
) => <StyledFlatList ref={ref} {...props} />;

export const NativeFlatList = forwardRef(NativeFlatListBase) as (<ItemT>(
  props: NativeFlatListProps<ItemT> & { ref?: ForwardedRef<FlatList<ItemT>> }
) => ReactElement | null) & { displayName?: string };

NativeFlatList.displayName = "NativeFlatList";
