import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { api } from "../lib/api";
import { useNetwork, enqueue } from "../lib/offline";
import { Card, CardBody, Button, Badge } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { colors } from "../config/theme";
import type { ApiCheckInTodayResponse } from "../types/api";

export function TodayScreen() {
  const { isOnline } = useNetwork();
  const [status, setStatus] = useState<"loading" | "error" | "loaded">("loading");
  const [data, setData] = useState<ApiCheckInTodayResponse | null>(null);
  const [error, setError] = useState<string>("");
  const [refreshing, setRefreshing] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);

  const fetchToday = useCallback(async () => {
    const result = await api.get<ApiCheckInTodayResponse>("/api/checkins/today");
    if (result.ok) {
      setData(result.data);
      setStatus("loaded");
    } else {
      setError(result.error.message);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchToday();
    setRefreshing(false);
  }, [fetchToday]);

  if (status === "loading") {
    return <LoadingState />;
  }

  if (status === "error") {
    return <ErrorState message={error} onRetry={fetchToday} />;
  }

  const checkedIn = data?.checkedInToday ?? false;
  const checkin = data?.checkin;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.coral[500]}
        />
      }
    >
      {/* Status Card */}
      <Card style={styles.statusCard}>
        <CardBody style={styles.statusBody}>
          <Text style={styles.greeting}>
            {getGreeting()}
          </Text>

          {checkedIn && checkin ? (
            <>
              <Badge variant="low" label="Checked in today" />
              <View style={styles.scores}>
                <ScoreItem label="Energy" value={checkin.energy} color={colors.coral[500]} />
                <ScoreItem label="Stress" value={checkin.stress} color={colors.rose[500]} />
                <ScoreItem label="Social" value={checkin.social} color={colors.sage[500]} />
              </View>
              {checkin.keyContact ? (
                <Text style={styles.keyContact}>
                  Key contact: {checkin.keyContact}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              <Badge variant="moderate" label="Not checked in yet" />
              <Text style={styles.prompt}>
                Take 30 seconds to record how you&apos;re feeling today.
              </Text>
            </>
          )}
        </CardBody>
      </Card>

      {/* CTA */}
      <Button
        title={checkedIn ? "View Today's Entry" : "Start Check-in"}
        variant="primary"
        size="lg"
        onPress={() => setShowCheckin(true)}
        style={styles.cta}
      />

      {/* Micro-action placeholder */}
      <Card style={styles.actionCard}>
        <CardBody style={styles.actionBody}>
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionTitle}>Today&apos;s Micro-Action</Text>
          <Text style={styles.actionText}>
            {checkedIn
              ? "Take a 5-minute walk outside to reset your energy."
              : "Check in first to get a personalized action."}
          </Text>
        </CardBody>
      </Card>

      {/* Check-in Modal */}
      {showCheckin ? (
        <CheckinModal
          visible={showCheckin}
          onClose={() => setShowCheckin(false)}
          onSuccess={() => {
            setShowCheckin(false);
            fetchToday();
          }}
          isAlreadyCheckedIn={checkedIn}
          existingCheckin={checkin}
          isOnline={isOnline}
        />
      ) : null}
    </ScrollView>
  );
}

// ── Check-in Modal ──

import { Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SegmentedControl, Input } from "../components/ui";
import type { ApiCheckIn, ApiCheckInResponse } from "../types/api";

type CheckinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isAlreadyCheckedIn: boolean;
  existingCheckin: ApiCheckIn | null | undefined;
  isOnline: boolean;
};

function CheckinModal({
  visible,
  onClose,
  onSuccess,
  isAlreadyCheckedIn,
  existingCheckin,
  isOnline,
}: CheckinModalProps) {
  const [energy, setEnergy] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [social, setSocial] = useState<number | null>(null);
  const [keyContact, setKeyContact] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = energy !== null && stress !== null && social !== null && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setSubmitError(null);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    // Offline: queue locally and show success
    if (!isOnline) {
      await enqueue({
        date: dateStr,
        energy: energy!,
        stress: stress!,
        social: social!,
        keyContact: keyContact.trim() || undefined,
      });
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => onSuccess(), 1500);
      return;
    }

    // Online: submit directly
    const result = await api.post<ApiCheckInResponse>("/api/checkins", {
      date: dateStr,
      energy,
      stress,
      social,
      key_contact: keyContact.trim() || undefined,
    });

    setSubmitting(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } else if (result.status === 409) {
      setSubmitError("You've already checked in today.");
    } else {
      setSubmitError(result.error.message);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isAlreadyCheckedIn ? "Today's Entry" : "Daily Check-in"}
            </Text>
            <Button
              title="Close"
              variant="ghost"
              size="sm"
              onPress={onClose}
            />
          </View>

          {isAlreadyCheckedIn && existingCheckin ? (
            // View mode
            <Card>
              <CardBody style={styles.viewBody}>
                <View style={styles.scores}>
                  <ScoreItem label="Energy" value={existingCheckin.energy} color={colors.coral[500]} />
                  <ScoreItem label="Stress" value={existingCheckin.stress} color={colors.rose[500]} />
                  <ScoreItem label="Social" value={existingCheckin.social} color={colors.sage[500]} />
                </View>
                {existingCheckin.keyContact ? (
                  <Text style={styles.keyContact}>
                    Key contact: {existingCheckin.keyContact}
                  </Text>
                ) : null}
              </CardBody>
            </Card>
          ) : success ? (
            // Success state
            <View style={styles.successContainer}>
              <Text style={styles.successIcon}>✅</Text>
              <Text style={styles.successText}>Check-in submitted successfully!</Text>
            </View>
          ) : (
            // Input mode
            <>
              <SegmentedControl
                label="Energy"
                options={[1, 2, 3, 4, 5]}
                value={energy}
                onChange={setEnergy}
              />

              <SegmentedControl
                label="Stress"
                options={[1, 2, 3, 4, 5]}
                value={stress}
                onChange={setStress}
              />

              <SegmentedControl
                label="Social"
                options={[1, 2, 3, 4, 5]}
                value={social}
                onChange={setSocial}
              />

              <Input
                label="Key Contact (optional)"
                placeholder="Who did you connect with today?"
                value={keyContact}
                onChangeText={setKeyContact}
              />

              {submitError ? (
                <Text style={styles.submitError} accessibilityRole="alert">
                  {submitError}
                </Text>
              ) : null}

              <Button
                title={submitting ? "Submitting..." : "Submit Check-in"}
                variant="primary"
                size="lg"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!canSubmit}
                style={styles.submitButton}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Helpers ──

function ScoreItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.scoreItem}>
      <Text style={styles.scoreLabel}>{label}</Text>
      <View style={[styles.scoreCircle, { backgroundColor: color }]}>
        <Text style={styles.scoreValue}>{value}</Text>
      </View>
    </View>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  content: {
    padding: 16,
    gap: 16,
  },
  statusCard: {},
  statusBody: {
    gap: 12,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.slate[700],
    fontFamily: "Lora_700Bold",
  },
  scores: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  scoreItem: {
    alignItems: "center",
    gap: 4,
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.slate[500],
    fontFamily: "Raleway_500Medium",
  },
  scoreCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
    fontFamily: "Raleway_700Bold",
  },
  keyContact: {
    fontSize: 13,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
  },
  prompt: {
    fontSize: 14,
    color: colors.slate[600],
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
  },
  cta: {
    marginTop: 4,
  },
  actionCard: {},
  actionBody: {
    alignItems: "center",
    gap: 8,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  actionText: {
    fontSize: 14,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  modalContent: {
    padding: 24,
    gap: 20,
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.slate[700],
    fontFamily: "Lora_700Bold",
  },
  viewBody: {
    gap: 12,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 16,
  },
  successIcon: {
    fontSize: 48,
  },
  successText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.sage[600],
    fontFamily: "Raleway_600SemiBold",
  },
  submitError: {
    fontSize: 13,
    color: colors.rose[500],
    textAlign: "center",
    fontFamily: "Raleway_400Regular",
  },
  submitButton: {
    marginTop: 8,
  },
});
