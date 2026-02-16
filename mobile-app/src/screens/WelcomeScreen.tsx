import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation/AuthStack";
import { Button } from "../components/ui";
import { colors } from "../config/theme";

type WelcomeNav = NativeStackNavigationProp<AuthStackParamList, "Welcome">;

export function WelcomeScreen() {
  const navigation = useNavigation<WelcomeNav>();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>D</Text>
          </View>
        </View>

        {/* Headline */}
        <Text style={styles.headline}>30 sec/day,{"\n"}see drift early.</Text>

        {/* Value bullets */}
        <View style={styles.bullets}>
          <BulletPoint icon="📊" text="Quick daily check-in — energy, stress, social" />
          <BulletPoint icon="🔔" text="Early warning before obvious burnout" />
          <BulletPoint icon="✅" text="One actionable step for today" />
        </View>
      </View>

      {/* CTAs */}
      <View style={styles.ctas}>
        <Button
          title="Get Started"
          variant="primary"
          size="lg"
          onPress={() => navigation.navigate("Login")}
        />
        <Button
          title="Privacy"
          variant="ghost"
          size="md"
          onPress={() => {
            // TODO: open privacy info
          }}
        />
      </View>
    </View>
  );
}

function BulletPoint({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.bullet}>
      <Text style={styles.bulletIcon}>{icon}</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream[50],
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 32,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.coral[500],
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
    fontFamily: "Lora_700Bold",
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.slate[800],
    fontFamily: "Lora_700Bold",
    textAlign: "center",
    lineHeight: 40,
  },
  bullets: {
    gap: 16,
  },
  bullet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
  },
  bulletIcon: {
    fontSize: 24,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: colors.slate[600],
    fontFamily: "Raleway_400Regular",
    lineHeight: 22,
  },
  ctas: {
    gap: 12,
  },
});
