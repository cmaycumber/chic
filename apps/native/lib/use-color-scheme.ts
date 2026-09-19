import { useColorScheme as useNativewindColorScheme } from "nativewind";

export function useColorScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } =
    useNativewindColorScheme();

  // `colorScheme` can be "light", "dark", "unspecified", null, or undefined;
  // this app only supports the two explicit themes, defaulting to dark.
  const resolvedColorScheme: "light" | "dark" =
    colorScheme === "light" ? "light" : "dark";

  return {
    colorScheme: resolvedColorScheme,
    isDarkColorScheme: resolvedColorScheme === "dark",
    setColorScheme,
    toggleColorScheme,
  };
}
