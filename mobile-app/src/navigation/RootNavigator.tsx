import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../lib/auth/AuthContext";
import { useNetwork } from "../lib/offline/NetworkContext";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { LoadingState } from "../components/LoadingState";
import { OfflineBanner } from "../components/OfflineBanner";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { PaywallScreen } from "../screens/PaywallScreen";
import { View, StyleSheet } from "react-native";
import { colors } from "../config/theme";

// ── Root Stack (authenticated) ──
// MainTabs is the main screen; Paywall is presented as a modal overlay.

export type RootStackParamList = {
  Main: undefined;
  Paywall: { source?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthenticatedStack() {
  const { isOnline } = useNetwork();

  return (
    <View style={styles.root}>
      <OfflineBanner visible={!isOnline} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
            headerShown: true,
            headerTitle: "",
            headerStyle: { backgroundColor: colors.cream[50] },
            headerShadowVisible: false,
          }}
        />
      </Stack.Navigator>
    </View>
  );
}

export function RootNavigator() {
  const { isLoading, isAuthenticated, isOnboarded, completeOnboarding } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState message="Starting Drift..." />
      </View>
    );
  }

  // Not authenticated → auth stack
  if (!isAuthenticated) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }

  // Authenticated but not onboarded → onboarding flow
  if (!isOnboarded) {
    return <OnboardingScreen onComplete={completeOnboarding} />;
  }

  // Authenticated + onboarded → main tabs with modal Paywall
  return (
    <NavigationContainer>
      <AuthenticatedStack />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.cream[50],
    justifyContent: "center",
    alignItems: "center",
  },
});
