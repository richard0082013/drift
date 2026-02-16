import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, CardBody, Button } from "./ui";
import { colors } from "../config/theme";

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Card
      style={styles.card}
      accessibilityRole="alert"
    >
      <CardBody style={styles.body}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠</Text>
        </View>
        <Text style={styles.message}>{message}</Text>
        {onRetry ? (
          <Button
            variant="secondary"
            size="sm"
            title="Try Again"
            onPress={onRetry}
            style={styles.retryButton}
          />
        ) : null}
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.rose[200],
    backgroundColor: colors.rose[50],
    marginHorizontal: 16,
  },
  body: {
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.rose[100],
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
  },
  message: {
    fontSize: 14,
    color: colors.rose[600],
    textAlign: "center",
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 4,
  },
});
