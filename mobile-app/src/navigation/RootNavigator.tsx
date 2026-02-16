import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../lib/auth/AuthContext";
import { useNetwork } from "../lib/offline/NetworkContext";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { LoadingState } from "../components/LoadingState";
import { OfflineBanner } from "../components/OfflineBanner";
import { View, StyleSheet } from "react-native";
import { colors } from "../config/theme";

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { isOnline } = useNetwork();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState message="Starting Drift..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <View style={styles.root}>
        <OfflineBanner visible={!isOnline} />
        {isAuthenticated ? <MainTabs /> : <AuthStack />}
      </View>
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
