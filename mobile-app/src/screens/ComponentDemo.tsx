import React, { useState } from "react";
import { ScrollView, View, Text, StyleSheet, Alert } from "react-native";

import { Button, Card, CardHeader, CardBody, CardFooter, Input, Badge, SegmentedControl } from "../components/ui";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";
import { OfflineBanner } from "../components/OfflineBanner";
import { ProGate } from "../components/ProGate";
import { colors } from "../config/theme";

/**
 * Demo screen that renders all UI primitives.
 * Used to verify design system during Task 1 acceptance.
 */
export function ComponentDemo() {
  const [energy, setEnergy] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [showLoading, setShowLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const [showOffline, setShowOffline] = useState(false);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Offline Banner */}
      <OfflineBanner visible={showOffline} />

      {/* Header */}
      <Text style={styles.heading}>Drift Design System</Text>
      <Text style={styles.subtitle}>Component Demo</Text>

      {/* Buttons */}
      <Section title="Buttons">
        <Button title="Primary" onPress={() => Alert.alert("Primary pressed")} />
        <Button title="Secondary" variant="secondary" onPress={() => {}} />
        <Button title="Danger" variant="danger" onPress={() => {}} />
        <Button title="Ghost" variant="ghost" onPress={() => {}} />
        <Button title="Loading..." variant="primary" loading />
        <Button title="Disabled" variant="primary" disabled />
        <View style={styles.row}>
          <Button title="SM" size="sm" onPress={() => {}} />
          <Button title="MD" size="md" onPress={() => {}} />
          <Button title="LG" size="lg" onPress={() => {}} />
        </View>
      </Section>

      {/* Cards */}
      <Section title="Card">
        <Card>
          <CardHeader>
            <Text style={styles.cardTitle}>Card Title</Text>
          </CardHeader>
          <CardBody>
            <Text style={styles.bodyText}>
              This is a card body with some content. Cards use the warm cream
              background with subtle shadow.
            </Text>
          </CardBody>
          <CardFooter>
            <Text style={styles.footerText}>Card Footer</Text>
          </CardFooter>
        </Card>
      </Section>

      {/* Inputs */}
      <Section title="Input">
        <Input
          label="Email"
          placeholder="you@example.com"
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Input
          label="Name"
          placeholder="Optional"
          helperText="Your display name"
        />
        <Input
          label="With Error"
          placeholder="Type something"
          error="This field is required"
          value=""
        />
      </Section>

      {/* Badges */}
      <Section title="Badges">
        <View style={styles.row}>
          <Badge variant="low" label="Low" />
          <Badge variant="moderate" label="Moderate" />
          <Badge variant="high" label="High" />
          <Badge variant="info" label="Info" />
        </View>
      </Section>

      {/* Segmented Control */}
      <Section title="Segmented Control">
        <SegmentedControl
          label="Energy"
          options={[1, 2, 3, 4, 5]}
          value={energy}
          onChange={setEnergy}
        />
        <Text style={styles.bodyText}>
          Selected: {energy ?? "none"}
        </Text>
      </Section>

      {/* Feedback States */}
      <Section title="Feedback States">
        <View style={styles.row}>
          <Button
            title={showLoading ? "Hide" : "Loading"}
            variant="ghost"
            size="sm"
            onPress={() => setShowLoading(!showLoading)}
          />
          <Button
            title={showError ? "Hide" : "Error"}
            variant="ghost"
            size="sm"
            onPress={() => setShowError(!showError)}
          />
          <Button
            title={showEmpty ? "Hide" : "Empty"}
            variant="ghost"
            size="sm"
            onPress={() => setShowEmpty(!showEmpty)}
          />
          <Button
            title={showOffline ? "Online" : "Offline"}
            variant="ghost"
            size="sm"
            onPress={() => setShowOffline(!showOffline)}
          />
        </View>

        {showLoading && <LoadingState />}
        {showError && (
          <ErrorState
            message="Failed to load data. Please try again."
            onRetry={() => setShowError(false)}
          />
        )}
        {showEmpty && (
          <EmptyState message="No check-ins yet. Start your first check-in to see data here." />
        )}
      </Section>

      {/* ProGate */}
      <Section title="ProGate (Free Tier)">
        <ProGate feature="trends_30d">
          <Card>
            <CardBody>
              <Text style={styles.bodyText}>
                This content is only visible to Pro users.
              </Text>
            </CardBody>
          </Card>
        </ProGate>
      </Section>

      {/* Color Palette */}
      <Section title="Color Palette">
        <View style={styles.paletteRow}>
          <ColorSwatch name="Coral" color={colors.coral[500]} />
          <ColorSwatch name="Amber" color={colors.amber[500]} />
          <ColorSwatch name="Rose" color={colors.rose[500]} />
          <ColorSwatch name="Sage" color={colors.sage[500]} />
          <ColorSwatch name="Slate" color={colors.slate[600]} />
        </View>
      </Section>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function ColorSwatch({ name, color }: { name: string; color: string }) {
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchColor, { backgroundColor: color }]} />
      <Text style={styles.swatchLabel}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream[50],
  },
  content: {
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.coral[500],
    fontFamily: "Lora_700Bold",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
    marginBottom: 12,
  },
  sectionContent: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.slate[700],
    fontFamily: "Lora_600SemiBold",
  },
  bodyText: {
    fontSize: 14,
    color: colors.slate[600],
    fontFamily: "Raleway_400Regular",
    lineHeight: 20,
  },
  footerText: {
    fontSize: 13,
    color: colors.slate[400],
    fontFamily: "Raleway_400Regular",
  },
  paletteRow: {
    flexDirection: "row",
    gap: 12,
  },
  swatch: {
    alignItems: "center",
    gap: 4,
  },
  swatchColor: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  swatchLabel: {
    fontSize: 11,
    color: colors.slate[500],
    fontFamily: "Raleway_400Regular",
  },
  bottomPadding: {
    height: 40,
  },
});
