import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../config/theme";

type EmptyStateProps = {
  message: string;
  icon?: string;
};

export function EmptyState({
  message,
  icon = "📋",
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  icon: {
    fontSize: 48,
    opacity: 0.4,
  },
  message: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: "center",
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
});
