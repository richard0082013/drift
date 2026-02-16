/**
 * App-level Error Boundary
 *
 * Catches unhandled JS errors in the React tree and renders a recovery UI
 * instead of a white screen. Users can tap "Restart" to reset state.
 */

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "./ui";
import { colors } from "../config/theme";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  errorMessage: string | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, errorMessage: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in dev — replace with crash reporting in production
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleRestart = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.errorMessage ?? "An unexpected error occurred."}
          </Text>
          <Button
            title="Restart"
            variant="primary"
            size="lg"
            onPress={this.handleRestart}
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.slate[700],
    fontFamily: "Lora_700Bold",
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
    minWidth: 160,
  },
});
