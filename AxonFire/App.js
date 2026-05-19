import React, { useEffect, useRef } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { API_BASE_URL } from './src/config/api';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';

export const navigationRef = createNavigationContainerRef();

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

const sirenSound = require('./assets/siren.mp3');

async function playSiren() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(sirenSound, {
      shouldPlay: true,
      volume: 1.0,
      isLooping: false,
    });

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn('Error reproduciendo sirena:', error);
  }
}

function AppContent() {
  const { isLoading, user, token } = useAuth();
  const lastNotificationResponse = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (user && token) {
      registrarTokenPush(user, token);
    }
  }, [user, token]);

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification?.request?.content?.data?.alertaId &&
      navigationRef.isReady()
    ) {
      navigationRef.navigate('Emergency', {
        alerta_id: lastNotificationResponse.notification.request.content.data.alertaId,
      });
    }
  }, [lastNotificationResponse]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#af101a" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    registerForPushNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Solo reproducir sirena si NO es una notificación silenciosa
      const isSilent = notification.request.content.data?.silent;
      if (!isSilent) {
        playSiren();
      }
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const { alertaId } = response.notification.request.content.data;
      if (alertaId && navigationRef.isReady()) {
        navigationRef.navigate('Emergency', { alerta_id: alertaId });
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
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
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergencias',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      sound: 'siren.mp3',
    });
  }
}

async function registrarTokenPush(user, authToken) {
  if (Platform.OS === 'web') return;
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus === 'granted') {
      const pushTokenString = (await Notifications.getExpoPushTokenAsync({
        projectId: 'ea3e82f6-533d-454d-8f71-1a7e2720dd3b',
      })).data;

      await fetch(`${API_BASE_URL}/notificaciones/registrar-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          usuario_id: user.id,
          token: pushTokenString,
          plataforma: Platform.OS
        })
      });
    }
  } catch (e) {
    console.warn('Error registrando token push:', e);
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