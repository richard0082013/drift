import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { api } from "../lib/api";
import { Card, CardBody, Button, Badge } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { ProGate } from "../components/ProGate";
import { colors } from "../config/theme";
import type { ApiWeeklyInsights, DriftLevel } from "../types/api";

type Period = 7 | 14;

const DRIFT_BADGE_VARIANT: Record<DriftLevel, "low" | "moderate" | "high"> = {
  low: "low",
  moderate: "moderate",
  high: "high",
};

export function InsightsScreen() {
  const [period, setPeriod] = useState<Period>(7);
  const [status, setStatus] = useState<"loading" | "error" | "empty" | "loaded">("loading");
  const [insights, setInsights] = useState<ApiWeeklyInsights | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async (p: Period) => {
    setStatus("loading");
    const result = await api.get<ApiWeeklyInsights>("/api/insights/weekly", { days: String(p) });
    if (result.ok) {
      if (result.data.summary.checkinCount === 0) {
        setStatus("empty");
      } else {
        setInsights(result.data);
        setStatus("loaded");
      }
    } else {
      setError(result.error.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchInsights(period);
  }, [period, fetchInsights]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInsights(period);
    setRefreshing(false);
  }, [period, fetchInsights]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral[500]} />
      }
    >
      {/* Period Switch */}
      <View style={styles.periodRow}>
        <Button
          title="7 Days"
          variant={period === 7 ? "primary" : "secondary"}
          size="sm"
          onPress={() => setPeriod(7)}
        />
        <Button
          title="14 Days"
          variant={period === 14 ? "primary" : "secondary"}
          size="sm"
          onPress={() => setPeriod(14)}
        />
      </View>

      {status === "loading" ? (
        <LoadingState />
      ) : status === "error" ? (
        <ErrorState message={error} onRetry={() => fetchInsights(period)} />
      ) : status === "empty" ? (
        <EmptyState message="No weekly insights yet. Keep checking in daily." icon="💡" />
      ) : insights ? (
        <>
          {/* Insufficient data warning */}
          {!insights.summary.hasEnoughData ? (
            <Card style={styles.warningCard}>
              <CardBody style={styles.warningBody}>
                <Text style={styles.warningIcon}>⚠️</Text>
                <Text style={styles.warningText}>
                  Not enough data for full analysis. Keep checking in to improve accuracy.
                </Text>
              </CardBody>
            </Card>
          ) : null}

          {/* Summary Card */}
          <Card>
            <CardBody style={styles.summaryBody}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Weekly Summary</Text>
                <Badge
                  variant={DRIFT_BADGE_VARIANT[insights.summary.driftLevel]}
                  label={`${insights.summary.driftLevel} drift`}
                />
              </View>

              <View style={styles.statsRow}>
                <StatItem label="Check-ins" value={String(insights.summary.checkinCount)} />
                <StatItem label="Alerts" value={String(insights.summary.alertCount)} />
              </View>

              {/* Average Bars */}
              <View style={styles.averages}>
                <AverageBar label="Energy" value={insights.summary.averages.energy} color={colors.coral[500]} />
                <AverageBar label="Stress" value={insights.summary.averages.stress} color={colors.rose[500]} />
                <AverageBar label="Social" value={insights.summary.averages.social} color={colors.sage[500]} />
                <AverageBar label="Drift Index" value={insights.summary.averages.driftIndex} color={colors.amber[500]} />
              </View>
            </CardBody>
          </Card>

          {/* Highlights */}
          {insights.highlights.length > 0 ? (
            <Card>
              <CardBody>
                <Text style={styles.sectionTitle}>Highlights</Text>
                {insights.highlights.map((h, i) => (
                  <View key={i} style={styles.listItem}>
                    <Text style={styles.listBullet}>•</Text>
                    <Text style={styles.listText}>{h}</Text>
                  </View>
                ))}
              </CardBody>
            </Card>
          ) : null}

          {/* Suggestions — Pro-gated */}
          <ProGate feature="weekly_detail">
            {insights.suggestions.length > 0 ? (
              <Card>
                <CardBody>
                  <Text style={styles.sectionTitle}>Suggestions</Text>
                  {insights.suggestions.map((s, i) => (
                    <View key={i} style={styles.listItem}>
                      <Text style={styles.listBullet}>💡</Text>
                      <Text style={styles.listText}>{s}</Text>
                    </View>
                  ))}
                </CardBody>
              </Card>
            ) : null}
          </ProGate>

          {/* Date range */}
          <Text style={styles.dateRange}>
            {insights.weekStart} — {insights.weekEnd}
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function AverageBar({ label, value, color }: { label: string; value: number | null; color: string }) {
  const displayValue = value !== null ? value.toFixed(1) : "—";
  const pct = value !== null ? Math.min((value / 5) * 100, 100) : 0;

  return (
    <View style={styles.avgRow}>
      <Text style={styles.avgLabel}>{label}</Text>
      <View style={styles.avgBarBg}>
        <View style={[styles.avgBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.avgValue}>{displayValue}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  content: { padding: 16, gap: 16 },
  periodRow: { flexDirection: "row", gap: 8 },

  warningCard: { borderColor: colors.amber[200], backgroundColor: colors.amber[50] },
  warningBody: { flexDirection: "row", alignItems: "center", gap: 8 },
  warningIcon: { fontSize: 18 },
  warningText: { flex: 1, fontSize: 13, color: colors.amber[600], fontFamily: "Raleway_500Medium", lineHeight: 18 },

  summaryBody: { gap: 16 },
  summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryTitle: { fontSize: 18, fontWeight: "600", color: colors.slate[700], fontFamily: "Lora_600SemiBold" },

  statsRow: { flexDirection: "row", gap: 24 },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "700", color: colors.slate[700], fontFamily: "Raleway_700Bold" },
  statLabel: { fontSize: 12, color: colors.slate[500], fontFamily: "Raleway_400Regular" },

  averages: { gap: 10 },
  avgRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  avgLabel: { width: 80, fontSize: 13, color: colors.slate[600], fontFamily: "Raleway_500Medium" },
  avgBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.cream[200], overflow: "hidden" },
  avgBarFill: { height: "100%", borderRadius: 4 },
  avgValue: { width: 32, fontSize: 13, color: colors.slate[600], fontFamily: "Raleway_600SemiBold", textAlign: "right" },

  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.slate[700], fontFamily: "Lora_600SemiBold", marginBottom: 8 },
  listItem: { flexDirection: "row", gap: 8, marginBottom: 6 },
  listBullet: { fontSize: 14, color: colors.slate[400] },
  listText: { flex: 1, fontSize: 14, color: colors.slate[600], fontFamily: "Raleway_400Regular", lineHeight: 20 },

  dateRange: { fontSize: 12, color: colors.slate[400], fontFamily: "Raleway_400Regular", textAlign: "center" },
});
