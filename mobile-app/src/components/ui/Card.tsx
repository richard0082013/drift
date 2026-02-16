import React from "react";
import { View, StyleSheet, type ViewProps } from "react-native";
import { colors, radii, shadows } from "../../config/theme";

export type CardProps = ViewProps;

export function Card({ style, children, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardHeader({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardBody({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.body, style]} {...rest}>
      {children}
    </View>
  );
}

export function CardFooter({ style, children, ...rest }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cream[200],
    ...shadows.card,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  body: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: colors.cream[200],
  },
});
