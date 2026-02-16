import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { colors, radii, shadows, TOUCH_TARGET_MIN } from "../../config/theme";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = Omit<PressableProps, "style"> & {
  variant?: Variant;
  size?: Size;
  title: string;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

const variantStyles: Record<Variant, { bg: string; text: string; pressed: string }> = {
  primary: { bg: colors.coral[500], text: colors.white, pressed: colors.coral[600] },
  secondary: { bg: colors.cream[100], text: colors.slate[700], pressed: colors.cream[200] },
  danger: { bg: colors.rose[500], text: colors.white, pressed: colors.rose[600] },
  ghost: { bg: "transparent", text: colors.slate[600], pressed: colors.cream[100] },
};

const sizeStyles: Record<Size, { paddingH: number; paddingV: number; fontSize: number; radius: number }> = {
  sm: { paddingH: 12, paddingV: 6, fontSize: 14, radius: radii.md },
  md: { paddingH: 16, paddingV: 10, fontSize: 14, radius: radii.lg },
  lg: { paddingH: 24, paddingV: 14, fontSize: 16, radius: radii.lg },
};

export function Button({
  variant = "primary",
  size = "md",
  title,
  loading = false,
  disabled,
  style,
  textStyle,
  ...rest
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? v.pressed : v.bg,
          paddingHorizontal: s.paddingH,
          paddingVertical: s.paddingV,
          borderRadius: s.radius,
          minHeight: TOUCH_TARGET_MIN,
          opacity: isDisabled ? 0.5 : 1,
        },
        variant === "primary" && shadows.button,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={v.text}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text
          style={[
            styles.text,
            { color: v.text, fontSize: s.fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontFamily: "Raleway_600SemiBold",
    fontWeight: "600",
  },
});
