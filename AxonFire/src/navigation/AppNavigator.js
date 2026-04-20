import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Importar pantallas
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import AddFirefighterScreen from '../screens/AddFirefighterScreen';
import MapScreen from '../screens/MapScreen';
import AlertsScreen from '../screens/AlertsScreen';
import ResourcesScreen from '../screens/ResourcesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import NewAlertScreen from '../screens/NewAlertScreen';
import EmergencyScreen from '../screens/EmergencyScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Navegador de pestañas principal (Main App)
function MainTabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Mapa"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Mapa') iconName = 'map-marker-radius';
          else if (route.name === 'Alertas') iconName = 'bell-ring';
          else if (route.name === 'Crear Alertas') iconName = 'alarm-light';
          else if (route.name === 'Personal') iconName = 'account-plus';
          else if (route.name === 'Recursos') iconName = 'account-group-outline';
          else if (route.name === 'Reportes') iconName = 'chart-areaspline';
          return <MaterialCommunityIcons name={iconName} size={24} color={color} />;
        },
        tabBarActiveTintColor: '#dc2626',
        tabBarInactiveTintColor: '#455a64',
        tabBarStyle: {
          backgroundColor: '#0a0f12',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          height: 60,
          paddingBottom: 10,
        },
        headerStyle: { backgroundColor: '#0a0f12' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '900', letterSpacing: 1.5, fontSize: 13 },
      })}
    >
      <Tab.Screen name="Mapa" component={MapScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Alertas" component={AlertsScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Crear Alertas" component={NewAlertScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Personal" component={AddFirefighterScreen} options={{ title: 'ALTA PERSONAL', headerShown: false }} />
      <Tab.Screen name="Recursos" component={ResourcesScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Reportes" component={ReportsScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MainApp" // cambiar a login al final
        screenOptions={{
          headerShown: false,
        }}
      > 
        <Stack.Screen name="Emergency" component={EmergencyScreen} />
        {/* Auth Flow */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Main App Flow */}
        <Stack.Screen name="MainApp" component={MainTabNavigator} />
        
        {/* Detail Screens (Accessible from everywhere) */}
        <Stack.Screen 
          name="AddFirefighter" 
          component={AddFirefighterScreen} 
          options={{ 
            headerShown: true, 
            title: 'ALTA DE PERSONAL',
            headerStyle: { backgroundColor: '#0a0f12' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '900', letterSpacing: 2, fontSize: 14 }
          }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
