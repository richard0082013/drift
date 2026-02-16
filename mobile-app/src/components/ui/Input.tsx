import React, { useId } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { colors, radii, TOUCH_TARGET_MIN } from "../../config/theme";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, style, ...rest }: InputProps) {
  const id = useId();

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={styles.label} nativeID={`${id}-label`}>
          {label}
        </Text>
      ) : null}
      <TextInput
        style={[
          styles.input,
          error ? styles.inputError : styles.inputNormal,
          style,
        ]}
        placeholderTextColor={colors.slate[400]}
        accessibilityLabel={label}
        accessibilityLabelledBy={label ? `${id}-label` : undefined}
        accessibilityHint={helperText}
        accessibilityState={{ disabled: rest.editable === false }}
        {...rest}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : helperText ? (
        <Text style={styles.helper}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.slate[700],
    fontFamily: "Raleway_500Medium",
  },
  input: {
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radii.lg,
    fontSize: 14,
    color: colors.slate[700],
    backgroundColor: colors.white,
    borderWidth: 1,
    minHeight: TOUCH_TARGET_MIN,
    fontFamily: "Raleway_400Regular",
  },
  inputNormal: {
    borderColor: colors.cream[200],
  },
  inputError: {
    borderColor: colors.rose[400],
  },
  error: {
    fontSize: 12,
    color: colors.rose[500],
    fontFamily: "Raleway_400Regular",
  },
  helper: {
    fontSize: 12,
    color: colors.slate[400],
    fontFamily: "Raleway_400Regular",
  },
});
