import React, { useEffect } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#af101a" />
      </View>
    );
  }

  return <AppNavigator />;
}

export default function App() {
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  useEffect(() => {
    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('¡Notificación recibida en primer plano!:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interacción con la notificación detectada:', response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0f12',
  },
});