import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";

import { api } from "../lib/api";
import { Card, CardBody, Badge } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { colors } from "../config/theme";
import type { ApiAlertsResponse, ApiAlert, DriftLevel } from "../types/api";

const LEVEL_VARIANT: Record<DriftLevel, "low" | "moderate" | "high"> = {
  low: "low",
  moderate: "moderate",
  high: "high",
};

export function AlertsScreen() {
  const [status, setStatus] = useState<"loading" | "error" | "empty" | "loaded">("loading");
  const [alerts, setAlerts] = useState<ApiAlert[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = useCallback(async () => {
    const result = await api.get<ApiAlertsResponse>("/api/alerts");
    if (result.ok) {
      if (result.data.data.length === 0) {
        setStatus("empty");
      } else {
        setAlerts(result.data.data);
        setStatus("loaded");
      }
    } else {
      setError(result.error.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  }, [fetchAlerts]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return <ErrorState message={error} onRetry={fetchAlerts} />;
  }

  if (status === "empty") {
    return (
      <EmptyState
        message="No active alerts. Alerts appear when your check-in patterns show notable changes."
        icon="🔔"
      />
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral[500]} />
      }
    >
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </ScrollView>
  );
}

function AlertCard({ alert }: { alert: ApiAlert }) {
  const levelColor = {
    low: colors.sage,
    moderate: colors.amber,
    high: colors.rose,
  }[alert.level];

  return (
    <Card style={{ borderLeftWidth: 4, borderLeftColor: levelColor[500] }}>
      <CardBody style={styles.alertBody}>
        {/* Header */}
        <View style={styles.alertHeader}>
          <Badge variant={LEVEL_VARIANT[alert.level]} label={alert.level} />
          <Text style={styles.alertDate}>{alert.date}</Text>
        </View>

        {/* Reason */}
        <View style={styles.alertSection}>
          <Text style={styles.alertSectionLabel}>Why</Text>
          <Text style={styles.alertReason}>{alert.reason}</Text>
        </View>

        {/* Action */}
        <View style={styles.alertSection}>
          <Text style={styles.alertSectionLabel}>What to do</Text>
          <Text style={styles.alertAction}>{alert.action}</Text>
        </View>
      </CardBody>
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  content: { padding: 16, gap: 12 },

  alertBody: { gap: 12 },
  alertHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  alertDate: { fontSize: 12, color: colors.slate[400], fontFamily: "Raleway_400Regular" },

  alertSection: { gap: 2 },
  alertSectionLabel: { fontSize: 11, fontWeight: "600", color: colors.slate[400], fontFamily: "Raleway_600SemiBold", textTransform: "uppercase", letterSpacing: 0.5 },
  alertReason: { fontSize: 14, color: colors.slate[700], fontFamily: "Raleway_500Medium", lineHeight: 20 },
  alertAction: { fontSize: 14, color: colors.coral[600], fontFamily: "Raleway_500Medium", lineHeight: 20 },
});
