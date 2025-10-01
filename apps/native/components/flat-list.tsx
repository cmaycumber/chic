import type { ComponentPropsWithoutRef, ForwardedRef } from "react";
import { forwardRef } from "react";
import { FlatList as RnFlatList } from "react-native";
import { styled } from "react-native-css";

const StyledFlatList = styled(RnFlatList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

export type FlatListProps<ItemT> = ComponentPropsWithoutRef<
  typeof StyledFlatList<ItemT>
>;

const FlatListBase = <ItemT,>(
  { ...props }: FlatListProps<ItemT>,
  ref: ForwardedRef<RnFlatList<ItemT>>
) => <StyledFlatList ref={ref} {...props} />;

export const FlatList = forwardRef(FlatListBase);

FlatList.displayName = "FlatList";
