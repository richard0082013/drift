import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../lib/auth/AuthContext";
import { Card, CardBody, Button, Input } from "../components/ui";
import { colors } from "../config/theme";

export function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validate = (): boolean => {
    if (!email.trim()) {
      setValidationError("Email is required");
      return false;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await login({
      email: email.trim(),
      name: name.trim() || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? "Login failed. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Drift</Text>
          <Text style={styles.subtitle}>
            Sign in to start tracking your wellbeing
          </Text>
        </View>

        {/* Login Card */}
        <Card style={styles.card}>
          <CardBody style={styles.cardBody}>
            <Text style={styles.formTitle}>Login</Text>

            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setValidationError(null);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={validationError ?? undefined}
              editable={!isSubmitting}
              accessibilityLabel="Email"
            />

            <Input
              label="Name (optional)"
              placeholder="Your display name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!isSubmitting}
              accessibilityLabel="Name"
            />

            {error ? (
              <Text style={styles.serverError} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Button
              title={isSubmitting ? "Signing in..." : "Sign in"}
              variant="primary"
              size="lg"
              onPress={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          </CardBody>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.coral[500],
    fontFamily: "Lora_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
  },
  card: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  cardBody: {
    gap: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
    marginBottom: 4,
  },
  serverError: {
    fontSize: 13,
    color: colors.rose[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
  },
  submitButton: {
    marginTop: 8,
  },
});
