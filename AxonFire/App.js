import React, { useEffect, useRef, useState } from 'react';
import 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, View, ActivityIndicator, StyleSheet, Alert, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { API_BASE_URL } from './src/config/api';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';

import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';

export const navigationRef = createNavigationContainerRef();

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  });
}

const sirenSound = require('./assets/siren.wav');

let appSirenSound = null;

async function playSiren() {
  try {
    if (appSirenSound) {
      await appSirenSound.stopAsync().catch(() => {});
      await appSirenSound.unloadAsync().catch(() => {});
      appSirenSound = null;
    }

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

    appSirenSound = sound;

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
        if (appSirenSound === sound) {
          appSirenSound = null;
        }
      }
    });
  } catch (error) {
    console.warn('Error reproduciendo sirena:', error);
  }
}

global.stopAppSiren = async function() {
  if (appSirenSound) {
    try {
      await appSirenSound.stopAsync();
      await appSirenSound.unloadAsync();
    } catch (e) {
      console.warn('Error stopping app siren:', e);
    }
    appSirenSound = null;
  }
};

function AppContent() {
  const { isLoading, user, token } = useAuth();
  const lastNotificationResponse = Platform.OS === 'web' ? null : Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (user && token) {
      registrarTokenPush(user, token);
    }
  }, [user, token]);

  useEffect(() => {
    if (lastNotificationResponse && navigationRef.isReady()) {
      const data = lastNotificationResponse.notification?.request?.content?.data;
      const targetAlertaId = data?.alertaId ?? data?.alerta_id;
      if (targetAlertaId) {
        navigationRef.navigate('Emergency', {
          alerta_id: targetAlertaId,
        });
      }
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Web custom alert and desktop layout states
  const [customAlert, setCustomAlert] = useState(null);
  const [globalError, setGlobalError] = useState(null);
  const isWeb = Platform.OS === 'web';
  const [useDesktopLayout, setUseDesktopLayout] = useState(
    isWeb && typeof window !== 'undefined' && window.innerWidth > 768
  );

  useEffect(() => {
    if (!isWeb) return;
    const handleError = (message, source, lineno, colno, error) => {
      setGlobalError({
        message: String(message),
        source: String(source),
        lineno,
        colno,
        stack: error ? String(error.stack) : 'No stack available'
      });
      return false;
    };
    const handleRejection = (event) => {
      setGlobalError({
        message: 'Unhandled Rejection: ' + String(event.reason),
        stack: event.reason && event.reason.stack ? String(event.reason.stack) : 'No stack available'
      });
    };
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    const handleResize = () => {
      setUseDesktopLayout(window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isWeb) {
      global.showCustomAlert = (title, message, buttons) => {
        setCustomAlert({ title, message, buttons });
      };

      Alert.alert = (title, message, buttons) => {
        if (global.showCustomAlert) {
          global.showCustomAlert(title, message, buttons);
        } else {
          window.alert(`${title}\n\n${message}`);
        }
      };
    }
  }, []);

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
      const data = response.notification.request.content.data;
      const targetAlertaId = data?.alertaId ?? data?.alerta_id;
      if (targetAlertaId && navigationRef.isReady()) {
        navigationRef.navigate('Emergency', { alerta_id: targetAlertaId });
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

  const renderCustomAlert = () => {
    if (!isWeb || !customAlert) return null;
    return (
      <View style={styles.webModalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{customAlert.title}</Text>
          {customAlert.message ? (
            <Text style={styles.modalMessage}>{customAlert.message}</Text>
          ) : null}
          <View style={styles.modalActions}>
            {(!customAlert.buttons || customAlert.buttons.length === 0) ? (
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setCustomAlert(null)}
              >
                <Text style={styles.buttonText}>Aceptar</Text>
              </TouchableOpacity>
            ) : (
              customAlert.buttons.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.modalButton,
                      isCancel ? styles.cancelButton : (isDestructive ? styles.destructiveButton : styles.confirmButton),
                    ]}
                    onPress={() => {
                      setCustomAlert(null);
                      if (btn.onPress) btn.onPress();
                    }}
                  >
                    <Text style={[styles.buttonText, isCancel && styles.cancelButtonText]}>
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </View>
    );
  };

  if (globalError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1e1e24', padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#ef4444', fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>Unhandled Runtime Error</Text>
        <Text style={{ color: '#fca5a5', fontSize: 14, fontWeight: '600', marginBottom: 8 }}>{globalError.message}</Text>
        {globalError.source ? <Text style={{ color: '#94a3b8', fontSize: 12 }}>Source: {globalError.source}:{globalError.lineno}:{globalError.colno}</Text> : null}
        <ScrollView style={{ marginTop: 16, backgroundColor: '#111216', padding: 12, borderRadius: 8 }}>
          <Text style={{ color: '#cbd5e1', fontSize: 11, fontFamily: 'monospace' }}>{globalError.stack}</Text>
        </ScrollView>
        <TouchableOpacity onPress={() => setGlobalError(null)} style={{ marginTop: 24, backgroundColor: '#ef4444', padding: 12, borderRadius: 8, alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (useDesktopLayout) {
    const isWideDesktop = windowWidth >= 1280;
    const isUltraWide = windowWidth >= 1600;
    const desktopFrameStyle = {
      width: isUltraWide ? '94%' : '96%',
      maxWidth: isUltraWide ? 1480 : (isWideDesktop ? 1320 : 1120),
      height: windowHeight >= 850 ? '92%' : '94%',
      maxHeight: isUltraWide ? 920 : 860,
      borderWidth: isWideDesktop ? 8 : 10,
      borderRadius: isWideDesktop ? 22 : 26,
    };

    return (
      <View style={styles.webOuterContainer}>
        <View style={[styles.webPhoneContainer, desktopFrameStyle]}>
          <SafeAreaProvider>
            <AuthProvider>
              <NotificationProvider>
                <AppContent />
                {renderCustomAlert()}
              </NotificationProvider>
            </AuthProvider>
          </SafeAreaProvider>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
          {renderCustomAlert()}
        </NotificationProvider>
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
  webOuterContainer: {
    flex: 1,
    backgroundColor: '#0a0b0d',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  webPhoneContainer: {
    width: '96%',
    maxWidth: 1320,
    height: '92%',
    maxHeight: 860,
    backgroundColor: '#16181d',
    borderRadius: 22,
    borderWidth: 8,
    borderColor: '#2d3139',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  webModalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1b1d24',
    borderWidth: 1,
    borderColor: '#26282f',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    backgroundColor: '#e11d48',
  },
  cancelButton: {
    backgroundColor: '#26282f',
    borderWidth: 1,
    borderColor: '#334155',
  },
  destructiveButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButtonText: {
    color: '#cbd5e1',
  },
});
