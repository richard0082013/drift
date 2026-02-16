import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import { colors } from "../config/theme";

/**
 * Placeholder screen for tabs not yet implemented.
 * Will be replaced in Tasks 3-6.
 */
export function PlaceholderScreen() {
  const route = useRoute();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🚧</Text>
      <Text style={styles.title}>{route.name}</Text>
      <Text style={styles.subtitle}>Coming in next sprint</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate[400],
    fontFamily: "Raleway_400Regular",
  },
});
