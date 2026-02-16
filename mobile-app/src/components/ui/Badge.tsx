import React from "react";
import { View, Text, StyleSheet, type ViewProps } from "react-native";
import { colors, radii } from "../../config/theme";

export type BadgeVariant = "low" | "moderate" | "high" | "info";

export type BadgeProps = ViewProps & {
  variant?: BadgeVariant;
  label: string;
};

const variantStyles: Record<
  BadgeVariant,
  { bg: string; text: string; border: string }
> = {
  low: {
    bg: colors.sage[100],
    text: colors.sage[600],
    border: colors.sage[200],
  },
  moderate: {
    bg: colors.amber[100],
    text: colors.amber[600],
    border: colors.amber[200],
  },
  high: {
    bg: colors.rose[100],
    text: colors.rose[600],
    border: colors.rose[200],
  },
  info: {
    bg: colors.coral[50],
    text: colors.coral[600],
    border: colors.coral[100],
  },
};

export function Badge({ variant = "info", label, style, ...rest }: BadgeProps) {
  const v = variantStyles[variant];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${variant} level: ${label}`}
      {...rest}
    >
      <Text style={[styles.text, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "Raleway_500Medium",
  },
});
