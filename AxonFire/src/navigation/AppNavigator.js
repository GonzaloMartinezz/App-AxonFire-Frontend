import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing } from '../theme';

import MapScreen from '../screens/MapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import NewAlertScreen from '../screens/NewAlertScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Tab = createBottomTabNavigator();

const ICON_MAP = {
  Mapa: { outline: 'map-outline', filled: 'map' },
  Alertas: { outline: 'bell-outline', filled: 'bell' },
  Recursos: { outline: 'clipboard-text-outline', filled: 'clipboard-text' },
  Reportes: { outline: 'chart-bar', filled: 'chart-bar' },
};

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={styles.tabBarWrapper}>
      {/* ── Central FAB ── */}
      <TouchableOpacity
        style={[styles.fabContainer, { bottom: bottomPad + 36 }]}
        onPress={() => navigation.navigate('NuevaAlerta')}
        activeOpacity={0.85}
      >
        <View style={styles.fabPulse} />
        <LinearGradient
          colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
          style={styles.fab}
        >
          <MaterialCommunityIcons name="plus" size={28} color="#fff" />
        </LinearGradient>
        <Text style={styles.fabLabel}>SOS</Text>
      </TouchableOpacity>

      {/* ── Tab Bar ── */}
      <View style={[styles.tabBar, { paddingBottom: bottomPad }]}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          if (route.name === 'NuevaAlerta') {
            return <View key={route.key} style={styles.fabSpacer} />;
          }

          const icons = ICON_MAP[route.name] || { outline: 'circle', filled: 'circle' };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => {
                if (!isFocused) navigation.navigate(route.name);
              }}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={isFocused ? icons.filled : icons.outline}
                size={22}
                color={isFocused ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {route.name}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Alertas" component={AlertsScreen} />
      <Tab.Screen name="NuevaAlerta" component={NewAlertScreen} />
      <Tab.Screen name="Recursos" component={ResourcesScreen} />
      <Tab.Screen name="Reportes" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 10,
    alignItems: 'center',
  },
  fabPulse: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: Colors.primary,
    opacity: 0.1,
    top: -3,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 6px 14px rgba(175,16,26,0.35)',
    elevation: 10,
  },
  fabLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 3,
    letterSpacing: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    boxShadow: '0px -8px 24px rgba(17,29,35,0.06)',
    elevation: 20,
    width: '100%',
  },
  fabSpacer: {
    width: 58,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radius.xl,
    minWidth: 52,
  },
  tabItemActive: {
    backgroundColor: `${Colors.primary}10`,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
    marginTop: 3,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    marginTop: 3,
  },
});
