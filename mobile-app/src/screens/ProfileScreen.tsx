import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native";

import { useAuth } from "../lib/auth/AuthContext";
import { api } from "../lib/api";
import { exportAndShare } from "../lib/export/csv-export";
import { Card, CardBody, Button, Badge } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { colors } from "../config/theme";
import type { ApiReminderSettingsResponse, ApiReminderStatusResponse, ApiReminderStatusItem } from "../types/api";

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const [status, setStatus] = useState<"loading" | "error" | "loaded">("loading");
  const [reminderSettings, setReminderSettings] = useState<ApiReminderSettingsResponse["settings"] | null>(null);
  const [reminderStatus, setReminderStatus] = useState<ApiReminderStatusItem[]>([]);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    const [settingsResult, statusResult] = await Promise.all([
      api.get<ApiReminderSettingsResponse>("/api/settings/reminder"),
      api.get<ApiReminderStatusResponse>("/api/jobs/reminders/status", { limit: "3", hours: "24" }),
    ]);

    if (settingsResult.ok) {
      setReminderSettings(settingsResult.data.settings);
    }
    if (statusResult.ok) {
      setReminderStatus(statusResult.data.items);
    }

    if (settingsResult.ok || statusResult.ok) {
      setStatus("loaded");
    } else {
      setError(settingsResult.ok ? "" : settingsResult.error.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportAndShare();
      if (!result.ok) {
        Alert.alert("Export Failed", result.error);
      } else {
        Alert.alert(
          "Export Complete",
          `Exported ${result.metadata.recordCount} records.`
        );
      }
    } catch {
      Alert.alert("Export Failed", "An unexpected error occurred.");
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return <ErrorState message={error} onRetry={fetchProfile} />;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.coral[500]} />
      }
    >
      {/* User Card */}
      <Card>
        <CardBody style={styles.userBody}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name?.[0] ?? user?.email?.[0] ?? "?").toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name ?? "User"}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ""}</Text>
          </View>
        </CardBody>
      </Card>

      {/* Reminder Summary */}
      {reminderSettings ? (
        <Card>
          <CardBody style={styles.reminderBody}>
            <View style={styles.reminderHeader}>
              <Text style={styles.sectionTitle}>Daily Reminder</Text>
              <Badge
                variant={reminderSettings.enabled ? "low" : "moderate"}
                label={reminderSettings.enabled ? "On" : "Off"}
              />
            </View>
            <Text style={styles.reminderTime}>
              {reminderSettings.reminderTime} ({reminderSettings.timezone})
            </Text>
          </CardBody>
        </Card>
      ) : null}

      {/* Reminder Status */}
      {reminderStatus.length > 0 ? (
        <Card>
          <CardBody>
            <Text style={styles.sectionTitle}>Recent Reminders</Text>
            {reminderStatus.map((item) => (
              <View key={item.id} style={styles.statusRow}>
                <Badge
                  variant={item.status === "sent" ? "low" : item.status === "pending" ? "info" : "high"}
                  label={item.status}
                />
                <Text style={styles.statusTime}>
                  {new Date(item.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {/* Actions */}
      <View style={styles.actions}>
        <Button title="Reminder Settings" variant="secondary" onPress={() => {/* TODO: modal */}} />
        <Button title="Export Data (CSV)" variant="secondary" onPress={handleExport} loading={exporting} />
        <Button title="Privacy" variant="ghost" onPress={() => {/* TODO: open privacy */}} />
        <Button title="Log Out" variant="danger" onPress={handleLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.cream[50] },
  content: { padding: 16, gap: 16 },

  userBody: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.coral[500],
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.white, fontFamily: "Lora_700Bold" },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 18, fontWeight: "600", color: colors.slate[700], fontFamily: "Lora_600SemiBold" },
  userEmail: { fontSize: 14, color: colors.slate[500], fontFamily: "Raleway_400Regular" },

  reminderBody: { gap: 8 },
  reminderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: colors.slate[700], fontFamily: "Lora_600SemiBold" },
  reminderTime: { fontSize: 14, color: colors.slate[600], fontFamily: "Raleway_500Medium" },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  statusTime: { fontSize: 13, color: colors.slate[500], fontFamily: "Raleway_400Regular" },

  actions: { gap: 8, marginTop: 8 },
});
