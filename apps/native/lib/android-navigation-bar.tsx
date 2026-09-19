import * as NavigationBar from "expo-navigation-bar";
import { Platform } from "react-native";

// As of Expo SDK 55+, edge-to-edge is mandatory on Android and the navigation
// bar background color APIs were removed (they were no-ops under edge-to-edge
// anyway). Only the button/icon style can still be controlled.
export function setAndroidNavigationBar(theme: "light" | "dark") {
  if (Platform.OS !== "android") {
    return;
  }
  NavigationBar.setStyle(theme === "dark" ? "light" : "dark");
}
