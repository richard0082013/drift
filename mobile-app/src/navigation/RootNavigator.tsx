import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { useAuth } from "../lib/auth/AuthContext";
import { AuthStack } from "./AuthStack";
import { MainTabs } from "./MainTabs";
import { LoadingState } from "../components/LoadingState";
import { View, StyleSheet } from "react-native";
import { colors } from "../config/theme";

export function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingState message="Starting Drift..." />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.cream[50],
    justifyContent: "center",
    alignItems: "center",
  },
});
