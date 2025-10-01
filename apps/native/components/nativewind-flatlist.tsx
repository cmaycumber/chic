import type { ComponentPropsWithoutRef, ForwardedRef } from "react";
import { forwardRef } from "react";
import { FlatList } from "react-native";
import { styled } from "react-native-css";

const StyledFlatList = styled(FlatList, {
  className: "style",
  contentContainerClassName: "contentContainerStyle",
});

export type NativeFlatListProps<ItemT> = ComponentPropsWithoutRef<
  typeof StyledFlatList<ItemT>
>;

const NativeFlatListBase = <ItemT,>(
  { ...props }: NativeFlatListProps<ItemT>,
  ref: ForwardedRef<FlatList<ItemT>>
) => <StyledFlatList ref={ref} {...props} />;

export const NativeFlatList = forwardRef(NativeFlatListBase);

NativeFlatList.displayName = "NativeFlatList";
