import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';

export default function App() {

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

async function registerForPushNotifications() {
  await Notifications.requestPermissionsAsync();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergencias',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      sound: 'default',
    });
  }
}