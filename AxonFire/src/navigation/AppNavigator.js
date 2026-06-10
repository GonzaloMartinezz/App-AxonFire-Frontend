import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
// import { NavigationContainer } from '@react-navigation/native'; // Movido a App.js
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

// Pantallas existentes
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import AdminPersonnelScreen from '../screens/AdminPersonnelScreen';
import AdminEquipmentScreen from '../screens/AdminEquipmentScreen';
import AdminRoutesScreen from '../screens/AdminRoutesScreen';
import AdminAlertsScreen from '../screens/AdminAlertsScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AddFirefighterScreen from '../screens/AddFirefighterScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import NewAlertScreen from '../screens/NewAlertScreen';

import AdminAttendanceBoardScreen from '../screens/AdminAttendanceBoardScreen';
import EmergencyScreen from '../screens/EmergencyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import InformePostEmergenciaScreen from '../screens/InformePostEmergenciaScreen';


// ── JUAMPI ESTAS SON LAS 4 TAREAS NUEVAS. ────────────────────────────────────────
import PanelControlScreen from '../screens/PanelControlScreen';
import PedidosSuministroScreen from '../screens/PedidosSuministroScreen';
import WeeklyChecklistScreen from '../screens/WeeklyChecklistScreen';
import ChecklistBolsosScreen from '../screens/ChecklistBolsosScreen';
import EstadisticasScreen from '../screens/EstadisticasScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// ── Bombero Tab Bar ─────────────────────────────────────────────
// 5 tabs: Mapa · Alertas · SOS (FAB) · Emergencia · Perfil
// Logística y Asistencia siguen accesibles como Stack screens.
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Icon pairs: [inactive (outline), active (filled)]
  const ICON_MAP = {
    Mapa: ['map-outline', 'map'],
    Alertas: ['bell-outline', 'bell'],
    Emergencia: ['shield-alert-outline', 'shield-alert'],
    Perfil: ['account-outline', 'account'],
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // FAB central de SOS
          if (route.name === 'SOS') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.fabContainer}
                activeOpacity={0.85}
              >
                <View style={styles.fab}>
                  <MaterialCommunityIcons name="alarm-light" size={28} color="#fff" />
                </View>
                <Text style={styles.fabLabel}>ALERTA</Text>
              </TouchableOpacity>
            );
          }

          const icons = ICON_MAP[route.name] || ['circle-outline', 'circle'];
          const iconName = isFocused ? icons[1] : icons[0];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.tabIconPill, isFocused && styles.tabIconPillActive]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={isFocused ? '#fff' : '#475569'}
                />
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {String(label).toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Mapa" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="Alertas" component={AlertsScreen} options={{ title: 'Alertas' }} />
      <Tab.Screen name="SOS" component={NewAlertScreen} options={{ title: 'Alerta' }} />
      <Tab.Screen name="Emergencia" component={EmergencyScreen} options={{ title: 'Emergencia' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

// ── Admin Tab Bar ───────────────────────────────────────────────
function AdminTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  // Icon pairs: [inactive (outline), active (filled)]
  const ICON_MAP = {
    Panel: ['monitor-dashboard-outline', 'monitor-dashboard'],
    Mapa: ['map-outline', 'map'],
    Alertas: ['bell-outline', 'bell'],
    Asistencia: ['clipboard-list-outline', 'clipboard-list'],
  };

  return (
    <View style={[styles.adminTabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
      <View style={styles.adminTabInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          // FAB central para SOS
          if (route.name === 'SOS') {
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={styles.adminFabWrap}
                activeOpacity={0.85}
              >
                <View style={styles.adminFab}>
                  <MaterialCommunityIcons name="alarm-light" size={28} color="#fff" />
                </View>
                <Text style={styles.adminFabLabel}>ALERTA</Text>
              </TouchableOpacity>
            );
          }

          const icons = ICON_MAP[route.name] || ['circle-outline', 'circle'];
          const iconName = isFocused ? icons[1] : icons[0];

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.adminTabItem}
              activeOpacity={0.7}
            >
              <View style={[styles.adminIconPill, isFocused && styles.adminIconPillActive]}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={20}
                  color={isFocused ? '#fff' : '#475569'}
                />
              </View>
              <Text style={[styles.adminTabLabel, isFocused && styles.adminTabLabelActive]}>
                {String(label).toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function AdminTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <AdminTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Panel" component={PanelControlScreen} options={{ title: 'Panel' }} />
      <Tab.Screen name="Mapa" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tab.Screen name="SOS" component={NewAlertScreen} options={{ title: 'Alerta' }} />
      <Tab.Screen name="Alertas" component={AlertsScreen} options={{ title: 'Alertas' }} />
      <Tab.Screen name="Asistencia" component={AdminAttendanceBoardScreen} options={{ title: 'Asistencia' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token ? (
        // Pantallas de Auth
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        // Pantallas de la App (Logueado)
        <>
          {user?.rol === 'ADMIN' && (
            <Stack.Screen name="AdminApp" component={AdminTabNavigator} />
          )}
          <Stack.Screen name="MainApp" component={MainTabNavigator} />

          {/* Pantallas comunes/modales */}
          <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ presentation: 'modal' }} />
          <Stack.Screen name="NewAlert" component={NewAlertScreen} />

          <Stack.Screen name="AddFirefighter" component={AddFirefighterScreen} />

          <Stack.Screen name="AttendanceBoard" component={AdminAttendanceBoardScreen} />
          <Stack.Screen name="Emergency" component={EmergencyScreen} />
          <Stack.Screen name="Reports" component={ReportsScreen} />
          <Stack.Screen name="Personal" component={AdminPersonnelScreen} />

          {/* Pantallas nuevas */}
          <Stack.Screen name="PanelControl" component={PanelControlScreen} />
          <Stack.Screen name="PedidosSuministro" component={PedidosSuministroScreen} />
          <Stack.Screen name="WeeklyChecklist" component={WeeklyChecklistScreen} />
          <Stack.Screen name="AdminEquipment" component={AdminEquipmentScreen} />
          <Stack.Screen name="InformePostEmergencia" component={InformePostEmergenciaScreen} />
          <Stack.Screen name="ChecklistBolsos" component={ChecklistBolsosScreen} />
          <Stack.Screen name="Logistica" component={ResourcesScreen} />
          <Stack.Screen name="Estadisticas" component={EstadisticasScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  // ── Bombero Tab Bar ──────────────────────────────────────────
  tabBarContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#1a1c23', // Matches admin exact background color
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 20 },
      web: { boxShadow: '0px -4px 16px rgba(0,0,0,0.4)' },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    maxWidth: 80,
  },
  tabIconPill: {
    width: 40,
    height: 32,
    borderRadius: 8, // squircle radius matching admin
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabIconPillActive: {
    backgroundColor: '#0284c7', // Cian táctico active state
  },
  tabLabel: {
    fontSize: 8, // Matches admin
    fontWeight: '800',
    color: '#475569', // Matches admin inactive text color
    letterSpacing: 0.8,
  },
  tabLabelActive: {
    color: '#f8fafc',
  },

  // FAB central bombero
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 80,
    paddingBottom: 4,
    top: -10, // Matches admin top offset
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 14, // squircle FAB
    backgroundColor: '#0284c7', // Cian táctico
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0369a1', // Darker cian border
    ...Platform.select({
      ios: { shadowColor: '#0284c7', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 10 },
      android: { elevation: 10 },
      web: { boxShadow: '0px 4px 16px rgba(2, 132, 199, 0.6)' },
    }),
  },
  fabLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#e0f2fe', // Very light blue / cian
    letterSpacing: 1,
    marginTop: 4,
  },

  // ── Admin Tab Bar ────────────────────────────────────────────
  adminTabBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#1a1c23',
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 20 },
      web: { boxShadow: '0px -4px 16px rgba(0,0,0,0.4)' },
    }),
  },
  adminTabInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  adminTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
    maxWidth: 80,
  },
  adminIconPill: {
    width: 40,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  adminIconPillActive: {
    backgroundColor: '#dc2626',
  },
  adminTabLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.8,
  },
  adminTabLabelActive: {
    color: '#f8fafc',
  },
  // FAB central admin
  adminFabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 80,
    paddingBottom: 4,
    top: -10,
  },
  adminFab: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#b91c1c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7f1d1d',
    ...Platform.select({
      ios: { shadowColor: '#b91c1c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.6, shadowRadius: 10 },
      android: { elevation: 10 },
      web: { boxShadow: '0px 4px 16px rgba(185, 28, 28, 0.6)' },
    }),
  },
  adminFabLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#fca5a5',
    letterSpacing: 1,
    marginTop: 4,
  },
  // Legacy (kept for bombero tab bar)
  adminIconBox: { padding: 8, borderRadius: 6, marginBottom: 4 },
  tabLabelAdminRed: { fontSize: 9, fontWeight: '900', marginTop: 6, color: '#fca5a5', letterSpacing: 1 },
  fabContainerAdmin: { alignItems: 'center', top: -16 },
  fabAdmin: {
    width: 56, height: 56, borderRadius: 12, backgroundColor: '#b91c1c', alignItems: 'center', justifyContent: 'center',
  },
});
