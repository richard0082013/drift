import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, StyleSheet } from "react-native";
import { colors } from "../config/theme";

import { TodayScreen } from "../screens/TodayScreen";
import { TrendsScreen } from "../screens/TrendsScreen";
import { AlertsScreen } from "../screens/AlertsScreen";
import { InsightsScreen } from "../screens/InsightsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

export type MainTabParamList = {
  Today: undefined;
  Trends: undefined;
  Alerts: undefined;
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, string> = {
  Today: "🏠",
  Trends: "📈",
  Alerts: "🔔",
  Insights: "💡",
  Profile: "👤",
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.white,
          shadowColor: colors.slate[200],
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 2,
        },
        headerTitleStyle: {
          fontFamily: "Lora_600SemiBold",
          fontSize: 18,
          color: colors.slate[700],
        },
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.cream[200],
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: colors.coral[500],
        tabBarInactiveTintColor: colors.slate[400],
        tabBarLabelStyle: {
          fontFamily: "Raleway_500Medium",
          fontSize: 11,
        },
        tabBarIcon: ({ color }) => (
          <Text style={[styles.tabIcon, { opacity: color === colors.coral[500] ? 1 : 0.5 }]}>
            {tabIcons[route.name]}
          </Text>
        ),
      })}
    >
      <Tab.Screen
        name="Today"
        component={TodayScreen}
        options={{ title: "Today" }}
      />
      <Tab.Screen
        name="Trends"
        component={TrendsScreen}
        options={{ title: "Trends" }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: "Alerts" }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{ title: "Insights" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    fontSize: 20,
  },
});
