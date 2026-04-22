import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Importar pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import MapScreen from '../screens/MapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AddFirefighterScreen from '../screens/AddFirefighterScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';
import NewAlertScreen from '../screens/NewAlertScreen';
import ChecklistScreen from '../screens/ChecklistScreen';
import PersonnelStatusScreen from '../screens/PersonnelStatusScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Tab Bar to match the Tactical Design
function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
      <View style={styles.tabBarInner}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel !== undefined ? options.tabBarLabel : options.title !== undefined ? options.title : route.name;
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

          // Render FAB for the middle item (Personal/SOS)
          if (route.name === 'SOS') {
            return (
              <TouchableOpacity key={route.key} onPress={onPress} style={styles.fabContainer} activeOpacity={0.8}>
                <LinearGradient colors={['#dc2626', '#991b1b']} style={styles.fab}>
                  <MaterialCommunityIcons name="plus" size={32} color="#fff" />
                </LinearGradient>
                <Text style={styles.tabLabel}>ALERTA</Text>
              </TouchableOpacity>
            );
          }

          let iconName;
          if (route.name === 'Mapa') iconName = isFocused ? 'map' : 'map-outline';
          else if (route.name === 'Alertas') iconName = isFocused ? 'bell' : 'bell-outline';
          else if (route.name === 'Cuarteles') iconName = isFocused ? 'office-building' : 'office-building-outline';
          else if (route.name === 'Perfil') iconName = isFocused ? 'account' : 'account-outline';

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name={iconName} 
                size={26} 
                color={isFocused ? '#fff' : '#90a4ae'} 
              />
              {isFocused && <View style={styles.activeDot} />}
              <Text style={[styles.tabLabel, { color: isFocused ? '#fff' : '#90a4ae' }]}>
                {label}
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
      <Tab.Screen name="Mapa" component={MapScreen} />
      <Tab.Screen name="Alertas" component={AlertsScreen} />
      <Tab.Screen name="SOS" component={AddFirefighterScreen} options={{ title: 'ALERTA' }} />
      <Tab.Screen name="Cuarteles" component={ResourcesScreen} />
      <Tab.Screen name="Perfil" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="NewAlert" component={NewAlertScreen} />
        <Stack.Screen name="Checklist" component={ChecklistScreen} />
        <Stack.Screen name="AddFirefighter" component={AddFirefighterScreen} />
        <Stack.Screen name="PersonnelStatus" component={PersonnelStatusScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#263238',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0px -4px 12px rgba(0,0,0,0.2)',
      }
    })
  },
  tabBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 10,
    flex: 1,
    maxWidth: 70,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
    marginTop: 2,
  },
  fabContainer: {
    alignItems: 'center',
    top: -24,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(220, 38, 38, 0.4)',
      }
    })
  },
});
