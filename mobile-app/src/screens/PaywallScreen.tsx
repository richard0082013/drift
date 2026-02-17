/**
 * Paywall Screen
 *
 * Soft paywall with Free vs Pro feature comparison.
 * Reached via ProUpgradeCard CTA or conversion triggers (Day 3/7).
 * Does NOT block before the user's first check-in (per acceptance criteria).
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Linking,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { Button, Card, CardBody } from "../components/ui";
import { colors } from "../config/theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

// ── Feature Comparison Data ──

type ComparisonRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
};

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: "Daily Check-in", free: true, pro: true },
  { label: "7-Day Trends", free: true, pro: true },
  { label: "Drift Alerts", free: true, pro: true },
  { label: "Weekly Summary (basic)", free: true, pro: true },
  { label: "30-Day Trends", free: false, pro: true },
  { label: "90-Day Trends", free: false, pro: true },
  { label: "Detailed Weekly Insights", free: false, pro: true },
  { label: "Insight History", free: false, pro: true },
  { label: "Alert Sensitivity Tuning", free: false, pro: true },
  { label: "Personalized Action Plan", free: false, pro: true },
  { label: "CSV Data Export", free: true, pro: true },
];

export function PaywallScreen({ navigation, route }: Props) {
  const source = route.params?.source ?? "direct";

  const handleUpgrade = () => {
    // TODO: Wire to App Store / Play Store subscription once billing is ready.
    // For now, open a placeholder URL or show a coming-soon message.
    // `source` param is passed for future analytics (e.g. which feature gate led here).
    Linking.openURL(`https://drift.vercel.app/pro?ref=${encodeURIComponent(source)}`).catch(() => {});
  };

  const handleDismiss = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
          <Text style={styles.heroTitle}>Unlock Your Full Picture</Text>
          <Text style={styles.heroSubtitle}>
            Deeper insights, longer trends, and personalized guidance to stay on
            track.
          </Text>
        </View>

        {/* Feature Comparison */}
        <Card>
          <CardBody style={styles.comparisonBody}>
            {/* Header */}
            <View style={styles.compRow}>
              <Text style={[styles.compLabel, styles.compHeaderLabel]}>Feature</Text>
              <Text style={[styles.compCell, styles.compHeaderCell]}>Free</Text>
              <Text style={[styles.compCell, styles.compHeaderCell]}>Pro</Text>
            </View>

            <View style={styles.divider} />

            {/* Rows */}
            {COMPARISON_ROWS.map((row) => (
              <View key={row.label} style={styles.compRow}>
                <Text style={styles.compLabel}>{row.label}</Text>
                <Text style={styles.compCell}>
                  {typeof row.free === "boolean"
                    ? row.free ? "\u2713" : "\u2014"
                    : row.free}
                </Text>
                <Text style={[styles.compCell, typeof row.pro === "boolean" && row.pro ? styles.compCellPro : null]}>
                  {typeof row.pro === "boolean"
                    ? row.pro ? "\u2713" : "\u2014"
                    : row.pro}
                </Text>
              </View>
            ))}
          </CardBody>
        </Card>

        {/* Value Props */}
        <View style={styles.valueProps}>
          <ValueProp
            icon="📊"
            title="See the bigger picture"
            description="30 and 90-day trend lines reveal patterns you can't see week-to-week."
          />
          <ValueProp
            icon="💡"
            title="Personalized suggestions"
            description="Detailed weekly summaries with actionable guidance tailored to your data."
          />
          <ValueProp
            icon="🎯"
            title="Fine-tune your alerts"
            description="Adjust sensitivity so Drift catches what matters to you."
          />
        </View>

        {/* CTA */}
        <Button
          title="Upgrade to Pro"
          variant="primary"
          size="lg"
          onPress={handleUpgrade}
          style={styles.upgradeButton}
        />

        <Button
          title="Maybe later"
          variant="ghost"
          size="md"
          onPress={handleDismiss}
        />

        {/* Fine print */}
        <Text style={styles.finePrint}>
          Cancel anytime. Your data is always yours.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Value Prop Component ──

function ValueProp({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.valuePropRow}>
      <Text style={styles.valuePropIcon}>{icon}</Text>
      <View style={styles.valuePropText}>
        <Text style={styles.valuePropTitle}>{title}</Text>
        <Text style={styles.valuePropDesc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  content: {
    padding: 24,
    paddingTop: 16,
    gap: 24,
  },

  // Hero
  hero: {
    alignItems: "center",
    gap: 12,
    paddingTop: 8,
  },
  proBadge: {
    backgroundColor: colors.coral[500],
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  proBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: 1.5,
    fontFamily: "Raleway_700Bold",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.slate[700],
    fontFamily: "Lora_700Bold",
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 15,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },

  // Comparison table
  comparisonBody: {
    gap: 0,
    paddingVertical: 8,
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  compLabel: {
    flex: 3,
    fontSize: 13,
    color: colors.slate[600],
    fontFamily: "Raleway_400Regular",
  },
  compHeaderLabel: {
    fontWeight: "600",
    fontFamily: "Raleway_600SemiBold",
    color: colors.slate[700],
  },
  compCell: {
    flex: 1,
    fontSize: 14,
    textAlign: "center",
    color: colors.slate[500],
    fontFamily: "Raleway_500Medium",
  },
  compHeaderCell: {
    fontWeight: "600",
    fontFamily: "Raleway_600SemiBold",
    color: colors.slate[700],
  },
  compCellPro: {
    color: colors.coral[500],
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.cream[200],
    marginVertical: 4,
  },

  // Value props
  valueProps: {
    gap: 16,
  },
  valuePropRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  valuePropIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  valuePropText: {
    flex: 1,
    gap: 4,
  },
  valuePropTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  valuePropDesc: {
    fontSize: 14,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
  },

  // CTA
  upgradeButton: {
    marginTop: 8,
  },

  // Fine print
  finePrint: {
    fontSize: 12,
    color: colors.slate[400],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
    paddingBottom: 24,
  },
});
