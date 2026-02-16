import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";

import { api } from "../lib/api";
import { Button, Card, CardBody, SegmentedControl } from "../components/ui";
import { colors } from "../config/theme";
import type { ApiReminderSettingsResponse } from "../types/api";

type OnboardingStep = "welcome" | "preferences" | "first-checkin" | "feedback";

type OnboardingScreenProps = {
  onComplete: () => void;
};

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress — 4 steps: welcome → preferences → first-checkin → feedback */}
        <View style={styles.progress}>
          <ProgressDot active={step === "welcome"} completed={step !== "welcome"} />
          <View style={styles.progressLine} />
          <ProgressDot active={step === "preferences"} completed={step === "first-checkin" || step === "feedback"} />
          <View style={styles.progressLine} />
          <ProgressDot active={step === "first-checkin"} completed={step === "feedback"} />
          <View style={styles.progressLine} />
          <ProgressDot active={step === "feedback"} completed={false} />
        </View>

        {step === "welcome" && (
          <PromiseStep onNext={() => setStep("preferences")} />
        )}
        {step === "preferences" && (
          <PreferenceStep onNext={() => setStep("first-checkin")} />
        )}
        {step === "first-checkin" && (
          <FirstCheckinStep onNext={() => setStep("feedback")} />
        )}
        {step === "feedback" && (
          <FeedbackStep onComplete={onComplete} />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Step 0: Promise / Value Proposition ──

function PromiseStep({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.promiseHero}>
        <Text style={styles.promiseEmoji}>🌊</Text>
        <Text style={styles.stepTitle}>Welcome to Drift</Text>
      </View>

      <Text style={styles.stepSubtitle}>
        A 30-second daily check-in that helps you spot emotional drift before it
        becomes a problem.
      </Text>

      <View style={styles.promiseList}>
        <PromiseItem icon="📊" text="Track energy, stress, and social connection" />
        <PromiseItem icon="🔔" text="Get alerts when patterns shift" />
        <PromiseItem icon="💡" text="Weekly insights to keep you balanced" />
        <PromiseItem icon="🔒" text="Private by default — your data stays yours" />
      </View>

      <Button
        title="Get Started"
        variant="primary"
        size="lg"
        onPress={onNext}
        style={styles.continueButton}
      />
    </View>
  );
}

function PromiseItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.promiseItem}>
      <Text style={styles.promiseItemIcon}>{icon}</Text>
      <Text style={styles.promiseItemText}>{text}</Text>
    </View>
  );
}

// ── Step 1: Preferences ──

function PreferenceStep({ onNext }: { onNext: () => void }) {
  const [hour, setHour] = useState(20);
  const [saving, setSaving] = useState(false);

  const hours = [8, 9, 12, 18, 20, 21];

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await api.post<ApiReminderSettingsResponse>("/api/settings/reminder", {
        reminderHourLocal: hour,
        notificationsEnabled: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (!result.ok) {
        Alert.alert("Could not save", result.error.message, [{ text: "OK" }]);
        setSaving(false);
        return;
      }
      setSaving(false);
      onNext();
    } catch {
      Alert.alert("Network error", "Please check your connection and try again.", [{ text: "OK" }]);
      setSaving(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Set Your Reminder</Text>
      <Text style={styles.stepSubtitle}>
        Choose the best time to check in daily. You can change this later.
      </Text>

      <Card>
        <CardBody style={styles.prefBody}>
          <Text style={styles.prefLabel}>Reminder Time</Text>
          <View style={styles.hourGrid}>
            {hours.map((h) => (
              <Button
                key={h}
                title={`${String(h).padStart(2, "0")}:00`}
                variant={hour === h ? "primary" : "secondary"}
                size="sm"
                onPress={() => setHour(h)}
                style={styles.hourButton}
              />
            ))}
          </View>

          <Text style={styles.timezoneHint}>
            Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
          </Text>
        </CardBody>
      </Card>

      <Button
        title={saving ? "Saving..." : "Continue"}
        variant="primary"
        size="lg"
        onPress={handleSave}
        loading={saving}
        style={styles.continueButton}
      />

      <Button
        title="Skip for now"
        variant="ghost"
        size="md"
        onPress={onNext}
      />
    </View>
  );
}

// ── Step 2: First Check-in ──

function FirstCheckinStep({ onNext }: { onNext: () => void }) {
  const [energy, setEnergy] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [social, setSocial] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = energy !== null && stress !== null && social !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    try {
      const result = await api.post("/api/checkins", {
        date: dateStr,
        energy,
        stress,
        social,
      });
      if (!result.ok) {
        Alert.alert("Check-in failed", result.error.message, [{ text: "OK" }]);
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      onNext();
    } catch {
      Alert.alert("Network error", "Please check your connection and try again.", [{ text: "OK" }]);
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Your First Check-in</Text>
      <Text style={styles.stepSubtitle}>
        How are you feeling right now? Rate each area 1-5.
      </Text>

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
        label="Social Connection"
        options={[1, 2, 3, 4, 5]}
        value={social}
        onChange={setSocial}
      />

      <Button
        title={submitting ? "Submitting..." : "Submit Check-in"}
        variant="primary"
        size="lg"
        onPress={handleSubmit}
        loading={submitting}
        disabled={!canSubmit}
        style={styles.continueButton}
      />
    </View>
  );
}

// ── Step 3: Feedback ──

function FeedbackStep({ onComplete }: { onComplete: () => void }) {
  return (
    <View style={styles.stepContainer}>
      <View style={styles.feedbackHero}>
        <Text style={styles.feedbackIcon}>🎉</Text>
        <Text style={styles.stepTitle}>You&apos;re all set!</Text>
      </View>

      <Card>
        <CardBody style={styles.feedbackBody}>
          <Text style={styles.feedbackHeading}>Today&apos;s Micro-Action</Text>
          <Text style={styles.feedbackAction}>
            Take a 5-minute walk outside to reset your energy levels.
          </Text>
        </CardBody>
      </Card>

      <Card style={styles.teaserCard}>
        <CardBody style={styles.teaserBody}>
          <Text style={styles.teaserTitle}>What&apos;s Next</Text>
          <View style={styles.teaserItem}>
            <Text style={styles.teaserBullet}>📊</Text>
            <Text style={styles.teaserText}>Day 3: Your first pattern emerges</Text>
          </View>
          <View style={styles.teaserItem}>
            <Text style={styles.teaserBullet}>💡</Text>
            <Text style={styles.teaserText}>Day 7: Your first weekly summary</Text>
          </View>
          <View style={styles.teaserItem}>
            <Text style={styles.teaserBullet}>🔔</Text>
            <Text style={styles.teaserText}>We&apos;ll alert you if we detect drift</Text>
          </View>
        </CardBody>
      </Card>

      <Button
        title="Go to Home"
        variant="primary"
        size="lg"
        onPress={onComplete}
        style={styles.continueButton}
      />
    </View>
  );
}

// ── Progress Dot ──

function ProgressDot({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <View
      style={[
        styles.dot,
        active && styles.dotActive,
        completed && styles.dotCompleted,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: colors.cream[200],
    marginHorizontal: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cream[200],
    borderWidth: 2,
    borderColor: colors.cream[200],
  },
  dotActive: {
    backgroundColor: colors.coral[500],
    borderColor: colors.coral[500],
  },
  dotCompleted: {
    backgroundColor: colors.sage[500],
    borderColor: colors.sage[500],
  },

  stepContainer: {
    gap: 20,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.slate[700],
    fontFamily: "Lora_700Bold",
    textAlign: "center",
  },
  stepSubtitle: {
    fontSize: 15,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },

  // Preferences
  prefBody: { gap: 12 },
  prefLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Raleway_600SemiBold",
  },
  hourGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  hourButton: {
    minWidth: 72,
  },
  timezoneHint: {
    fontSize: 12,
    color: colors.slate[400],
    fontFamily: "Raleway_400Regular",
  },

  continueButton: {
    marginTop: 8,
  },

  // Promise
  promiseHero: {
    alignItems: "center",
    gap: 12,
  },
  promiseEmoji: {
    fontSize: 56,
  },
  promiseList: {
    gap: 14,
    paddingHorizontal: 8,
  },
  promiseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  promiseItemIcon: {
    fontSize: 20,
  },
  promiseItemText: {
    flex: 1,
    fontSize: 15,
    color: colors.slate[600],
    fontFamily: "Raleway_500Medium",
    lineHeight: 22,
  },

  // Feedback
  feedbackHero: {
    alignItems: "center",
    gap: 12,
  },
  feedbackIcon: {
    fontSize: 48,
  },
  feedbackBody: { gap: 8 },
  feedbackHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  feedbackAction: {
    fontSize: 15,
    color: colors.coral[600],
    fontFamily: "Raleway_500Medium",
    lineHeight: 22,
  },

  teaserCard: {
    borderColor: colors.coral[100],
    backgroundColor: colors.coral[50],
  },
  teaserBody: { gap: 10 },
  teaserTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  teaserItem: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  teaserBullet: { fontSize: 16 },
  teaserText: {
    flex: 1,
    fontSize: 14,
    color: colors.slate[600],
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
  },
});
