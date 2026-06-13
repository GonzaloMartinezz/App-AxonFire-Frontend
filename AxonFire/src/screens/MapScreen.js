import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Animated,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';

// ─── Constantes ───────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const FALLBACK_LAT = -26.8083;
const FALLBACK_LNG = -65.2176;
const DEFAULT_ZOOM = 15;

// ─── HTML + CSS de Leaflet ────────────────────────────────────────────────────
function generarMapaHTML(lat, lng, zoom) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          background: #5a7055;
        }
        #map {
          width: 100%;
          height: 100vh;
        }
        /* Filtro táctico — convierte los tiles en verde sage militar */
        .leaflet-tile-pane {
          filter: grayscale(0.2) sepia(0.5) hue-rotate(80deg) saturate(0.65) brightness(0.82);
        }
        /* Ocultamos el zoom nativo — usamos los botones del panel de RN */
        .leaflet-control-zoom {
          display: none !important;
        }
        .leaflet-control-attribution {
          font-size: 8px !important;
          background: rgba(26, 28, 35, 0.6) !important;
          color: #475569 !important;
        }
        .leaflet-control-attribution a {
          color: #64748b !important;
        }
        .leaflet-popup-content-wrapper {
          background: #1a1c23;
          border: 1px solid #334155;
          border-radius: 10px;
          color: #e2e8f0;
          font-family: sans-serif;
          font-size: 12px;
        }
        .leaflet-popup-tip {
          background: #1a1c23;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          center: [${lat}, ${lng}],
          zoom: ${zoom},
          zoomControl: false,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM &copy; CartoDB',
          maxZoom: 19,
          minZoom: 8,
          subdomains: 'abcd',
        }).addTo(map);

        // Marcador del cuartel del usuario logueado
        var iconCuartel = L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;background:#263238;border:2.5px solid #dc2626;border-radius:50%;box-shadow:0 0 8px rgba(220,38,38,0.65)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });

        L.marker([${lat}, ${lng}], { icon: iconCuartel })
          .addTo(map)
          .bindPopup('<b>Tu cuartel</b>');

        // Funciones llamadas desde React Native vía injectJavaScript
        window.zoomIn = function() {
          map.zoomIn();
        };
        window.zoomOut = function() {
          map.zoomOut();
        };
        window.centrarEnCuartel = function() {
          map.flyTo([${lat}, ${lng}], ${zoom}, { animate: true, duration: 1.0 });
        };

        // Avisa a React Native que Leaflet terminó de cargar
        setTimeout(function() {
          try {
            window.ReactNativeWebView.postMessage(JSON.stringify({ tipo: 'MAPA_LISTO' }));
          } catch(e) {}
        }, 400);
      </script>
    </body>
    </html>
  `;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export default function MapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();

  const webViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [coords, setCoords] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mapaListo, setMapaListo] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState(0);

  const isCurrentlyAdmin = navigation.getState()?.routeNames?.includes('Panel');

  const headers = {
    'Content-Type': 'application/json',
    ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {}),
  };

  // ─── Handlers auth (igual que antes) ─────────────────────────────────────
  const handleAdminPress = () => {
    if (user?.rol === 'ADMIN') {
      if (isCurrentlyAdmin) {
        navigation.navigate('MainApp');
      } else {
        navigation.navigate('AdminApp');
      }
    } else {
      if (Platform.OS === 'web') alert('Esta sección es exclusiva para administradores.');
      else Alert.alert('Acceso Denegado', 'Esta sección es exclusiva para administradores.');
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Deseas cerrar sesión?')) {
        logout();
      }
    } else {
      Alert.alert('Cerrar Sesión', '¿Deseas cerrar sesión?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salir', style: 'destructive', onPress: () => logout() },
      ]);
    }
  };

  // ─── Animación del punto pulsante ─────────────────────────────────────────
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // ─── GET /api/maps/config — centrar en el cuartel del usuario ─────────────
  async function cargarConfig() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/maps/config`, { headers });
      if (res.status === 401) throw new Error('No autorizado. Volvé a iniciar sesión.');
      if (!res.ok) throw new Error(`Error ${res.status} al obtener la configuración del mapa.`);
      const data = await res.json();
      if (typeof data.latitud !== 'number' || typeof data.longitud !== 'number') {
        throw new Error('El servidor no devolvió coordenadas válidas.');
      }
      setCoords({ latitud: data.latitud, longitud: data.longitud });
    } catch (err) {
      setError(err.message);
      // Fallback: igual se muestra el mapa, centrado en Tucumán
      setCoords({ latitud: FALLBACK_LAT, longitud: FALLBACK_LNG });
    } finally {
      setCargando(false);
    }
  }

  // ─── Contador de alertas activas (últimas 24hs) ───────────────────────────
  async function cargarAlertasActivas() {
    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 86400000).toISOString();
      const res = await fetch(`${BASE_URL}/alerta/rango`, {
        method: 'GET',
        headers,
        body: JSON.stringify({ fecha_desde: desde, fecha_hasta: hasta }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setAlertasActivas(data.length);
    } catch (_) { }
  }

  useEffect(() => {
    cargarConfig();
    cargarAlertasActivas();
  }, []);

  // ─── Mensajes desde Leaflet → React Native ────────────────────────────────
  function onMensajeWebView({ nativeEvent: { data } }) {
    try {
      const msg = JSON.parse(data);
      if (msg.tipo === 'MAPA_LISTO') setMapaListo(true);
    } catch (_) { }
  }

  const lat = coords?.latitud ?? FALLBACK_LAT;
  const lng = coords?.longitud ?? FALLBACK_LNG;
  const mapHTML = coords ? generarMapaHTML(lat, lng, DEFAULT_ZOOM) : null;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Mapa Leaflet real — reemplaza el LinearGradient anterior ── */}
      {mapHTML && (
        <WebView
          ref={webViewRef}
          style={StyleSheet.absoluteFill}
          source={{ html: mapHTML }}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          onMessage={onMensajeWebView}
          mixedContentMode="always"
          {...(Platform.OS === 'android' && { androidLayerType: 'hardware' })}
        />
      )}

      {/* ── Top Overlay (igual que antes) ── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="fire-extinguisher" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>AXON FIRE</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {user?.rol === 'ADMIN' && (
              <TouchableOpacity style={styles.emergencyIcon} onPress={handleAdminPress}>
                <MaterialCommunityIcons
                  name={isCurrentlyAdmin ? 'account-hard-hat' : 'shield-account'}
                  size={16}
                  color={Colors.primary}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.emergencyIcon} onPress={handleLogout}>
              <MaterialCommunityIcons name="logout" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Mission Status Card (igual que antes) */}
        <View style={styles.missionCard}>
          <View style={styles.missionLeft}>
            <Text style={styles.missionLabel}>ESTADO DE MISIÓN</Text>
            <View style={styles.missionStatusRow}>
              <View style={styles.statusDotRed} />
              <Text style={styles.missionStatus}>INCIDENTE EN{'\n'}PROGRESO</Text>
            </View>
          </View>
          <View style={styles.missionDivider} />
          <View style={styles.missionRight}>
            <Text style={styles.missionLabel}>RESPONDIENDO</Text>
            <Text style={styles.respondersCount}>12 UNIDADES</Text>
            <Text style={styles.respondersStatus}>ACTIVAS</Text>
          </View>
          <View style={styles.avatarStack}>
            <View style={[styles.miniAvatar, { backgroundColor: Colors.warningOrange }]}>
              <MaterialCommunityIcons name="account" size={12} color="#fff" />
            </View>
            <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.secondary }]}>
              <MaterialCommunityIcons name="account" size={12} color="#fff" />
            </View>
            <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarCount}>+10</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Map Controls — botones ahora conectados a Leaflet ── */}
      <View style={[styles.mapControls, { bottom: 120 }]}>
        <TouchableOpacity style={styles.controlBtn} onPress={() => {/* F3: toggle capas */ }}>
          <MaterialCommunityIcons name="layers-outline" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => webViewRef.current?.injectJavaScript('centrarEnCuartel(); true;')}
        >
          <MaterialIcons name="my-location" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => webViewRef.current?.injectJavaScript('zoomIn(); true;')}
        >
          <MaterialCommunityIcons name="plus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlBtn}
          onPress={() => webViewRef.current?.injectJavaScript('zoomOut(); true;')}
        >
          <MaterialCommunityIcons name="minus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* ── Admin FAB (igual que antes) ── */}
      {user?.rol === 'ADMIN' && (
        <TouchableOpacity
          style={styles.floatingMapFab}
          onPress={() => navigation.navigate('NewAlert')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alarm-light" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Banner alertas activas ── */}
      {mapaListo && alertasActivas > 0 && (
        <View style={[styles.bannerAlertas, { top: insets.top + 14 }]}>
          <Animated.View style={[styles.puntoPulso, { opacity: pulseAnim }]} />
          <Text style={styles.bannerTexto}>
            {alertasActivas} {alertasActivas === 1 ? 'alerta activa' : 'alertas activas'}
          </Text>
        </View>
      )}

      {/* ── Loading overlay ── */}
      {(cargando || (!mapaListo && !error)) && (
        <View style={styles.overlayLoading}>
          <ActivityIndicator size="large" color="#dc2626" />
          <Text style={styles.overlayTitulo}>Cargando mapa...</Text>
          <Text style={styles.overlaySubtitulo}>
            {cargando ? 'Obteniendo ubicación del cuartel' : 'Inicializando mapa'}
          </Text>
        </View>
      )}

      {/* ── Error no bloqueante ── */}
      {error && mapaListo && (
        <View style={[styles.bannerError, { top: insets.top + 14 }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={13} color="#fca5a5" />
          <Text style={styles.bannerErrorTexto} numberOfLines={1}>
            Fallback activo — {error}
          </Text>
          <TouchableOpacity
            onPress={cargarConfig}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="refresh" size={14} color="#fca5a5" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5a7055',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#fff',
    textTransform: 'uppercase',
    textShadow: '0px 1px 4px rgba(0,0,0,0.3)',
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38,50,56,0.9)',
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  missionLeft: {
    flex: 1,
  },
  missionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  missionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDotRed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  missionStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  missionDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: Spacing.sm,
  },
  missionRight: {
    alignItems: 'flex-start',
  },
  respondersCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.2,
  },
  respondersStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  avatarStack: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(38,50,56,0.9)',
  },
  avatarCount: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  mapControls: {
    position: 'absolute',
    right: Spacing.lg,
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingMapFab: {
    position: 'absolute',
    bottom: 120,
    left: Spacing.lg,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7f1d1d',
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0px 4px 12px rgba(220, 38, 38, 0.5)' },
    }),
  },

  // ── Nuevos estilos F1 ─────────────────────────────────────────────────────
  bannerAlertas: {
    position: 'absolute',
    left: 16,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dc2626',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  puntoPulso: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  bannerTexto: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  overlayLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0f12',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 50,
  },
  overlayTitulo: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
  overlaySubtitulo: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bannerError: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(127,0,0,0.88)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.4)',
    zIndex: 20,
  },
  bannerErrorTexto: {
    flex: 1,
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '600',
  },
});