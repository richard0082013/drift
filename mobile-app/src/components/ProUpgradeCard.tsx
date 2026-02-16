import React, { useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Card, CardBody, Button } from "./ui";
import { colors } from "../config/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type ProUpgradeCardProps = {
  feature: string;
  onUpgrade?: () => void;
};

const FEATURE_LABELS: Record<string, string> = {
  trends_30d: "30-Day Trends",
  trends_90d: "90-Day Trends",
  sensitivity_tuning: "Alert Sensitivity Tuning",
  action_plan: "Personalized Action Plan",
  weekly_detail: "Detailed Weekly Summary",
  insight_history: "Insight History",
};

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export function ProUpgradeCard({ feature, onUpgrade }: ProUpgradeCardProps) {
  const navigation = useNavigation<RootNavProp>();
  const label = FEATURE_LABELS[feature] ?? "This Feature";

  const handleUpgrade = useCallback(() => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigation.navigate("Paywall", { source: feature });
    }
  }, [onUpgrade, navigation, feature]);

  return (
    <Card style={styles.card}>
      <CardBody style={styles.body}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRO</Text>
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.description}>
          Upgrade to Pro to unlock {label.toLowerCase()} and other advanced
          features.
        </Text>
        <Button
          variant="primary"
          size="md"
          title="Upgrade to Pro"
          onPress={handleUpgrade}
          style={styles.button}
        />
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderColor: colors.coral[100],
    backgroundColor: colors.coral[50],
    marginHorizontal: 16,
  },
  body: {
    alignItems: "center",
    gap: 12,
  },
  badge: {
    backgroundColor: colors.coral[500],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 1,
    fontFamily: "Raleway_700Bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: colors.slate[500],
    textAlign: "center",
    lineHeight: 20,
    fontFamily: "Raleway_400Regular",
  },
  button: {
    marginTop: 4,
    alignSelf: "stretch",
  },
});
