import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, radii, TOUCH_TARGET_MIN } from "../../config/theme";

export type SegmentedControlProps = {
  /** Label for accessibility */
  label: string;
  /** Option values (e.g., [1, 2, 3, 4, 5]) */
  options: number[];
  /** Currently selected value */
  value: number | null;
  /** Callback when a value is selected */
  onChange: (value: number) => void;
  /** Optional labels to display instead of raw numbers */
  optionLabels?: string[];
};

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  optionLabels,
}: SegmentedControlProps) {
  return (
    <View style={styles.container} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((option, index) => {
          const isSelected = value === option;
          const displayLabel = optionLabels?.[index] ?? String(option);

          return (
            <Pressable
              key={option}
              onPress={() => onChange(option)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${label}: ${displayLabel}`}
              style={({ pressed }) => [
                styles.option,
                isSelected && styles.optionSelected,
                pressed && !isSelected && styles.optionPressed,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  isSelected && styles.optionTextSelected,
                ]}
              >
                {displayLabel}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.slate[700],
    fontFamily: "Raleway_500Medium",
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  option: {
    flex: 1,
    minWidth: TOUCH_TARGET_MIN,
    minHeight: TOUCH_TARGET_MIN,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.cream[200],
    backgroundColor: colors.white,
  },
  optionSelected: {
    backgroundColor: colors.coral[500],
    borderColor: colors.coral[500],
  },
  optionPressed: {
    backgroundColor: colors.cream[100],
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[600],
    fontFamily: "Raleway_600SemiBold",
  },
  optionTextSelected: {
    color: colors.white,
  },
});
