import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../config/theme";

type OfflineBannerProps = {
  visible: boolean;
};

export function OfflineBanner({ visible }: OfflineBannerProps) {
  if (!visible) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="You are offline. Changes will sync when reconnected."
    >
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>
        You&apos;re offline. Changes will sync when reconnected.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.amber[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.amber[200],
  },
  icon: {
    fontSize: 14,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: colors.amber[600],
    fontFamily: "Raleway_500Medium",
    fontWeight: "500",
  },
});
