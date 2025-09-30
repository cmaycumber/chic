import type React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export const Container = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaView className="mx-auto flex-1 bg-black">{children}</SafeAreaView>
);
