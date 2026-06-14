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
import { API_BASE_URL } from '../config/api';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FALLBACK_LAT = -26.8083;
const FALLBACK_LNG = -65.2176;
const DEFAULT_ZOOM = 15;

// F3 — Configuración de cada capa de POI (enum del contrato gestion-pois-api.yaml)
const CAPAS_CONFIG = [
  { value: 'HIDRANTE', label: 'Hidrantes', icono: 'water', color: '#1565c0' },
  { value: 'SALUD', label: 'Salud', icono: 'hospital-box', color: '#2e7d32' },
  { value: 'MATERIAL_PELIGROSO', label: 'Mat. Peligroso', icono: 'alert-octagon', color: '#c2410c' },
  { value: 'CUARTEL_APOYO', label: 'Cuarteles', icono: 'shield', color: '#37474f' },
];

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
        .leaflet-popup-content b { color: #fff; font-size: 13px; }

        /* ── F2: Incident marker pulse animation ── */
        @keyframes incident-pulse {
          0%   { transform: scale(1);   opacity: 1;   }
          50%  { transform: scale(1.8); opacity: 0.3; }
          100% { transform: scale(2.2); opacity: 0;   }
        }
        .incident-marker {
          position: relative;
          width: 40px;
          height: 40px;
        }
        .incident-marker .pulse-ring {
          position: absolute;
          top: 50%; left: 50%;
          width: 40px; height: 40px;
          margin: -20px 0 0 -20px;
          border-radius: 50%;
          background: rgba(220,38,38,0.4);
          animation: incident-pulse 2s ease-out infinite;
        }
        .incident-marker .pin {
          position: absolute;
          top: 50%; left: 50%;
          width: 32px; height: 32px;
          margin: -16px 0 0 -16px;
          background: #dc2626;
          border: 3px solid #7f1d1d;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 0 16px rgba(220,38,38,0.7);
          z-index: 2;
        }
        .popup-incident { min-width: 200px; }
        .popup-incident .popup-title {
          font-size: 13px; font-weight: 800; color: #fff;
          margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 6px;
        }
        .popup-incident .popup-row {
          display: flex; align-items: center; gap: 6px; margin-bottom: 5px;
        }
        .popup-incident .popup-label {
          font-size: 9px; font-weight: 700; color: rgba(255,255,255,0.5);
          text-transform: uppercase; letter-spacing: 0.8px; min-width: 65px;
        }
        .popup-incident .popup-value {
          font-size: 12px; font-weight: 600; color: #e2e8f0;
        }
        .popup-incident .prioridad-badge {
          display: inline-block; padding: 2px 8px; border-radius: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 0.5px;
        }
        .popup-incident .prioridad-ALTA  { background: #dc2626; color: #fff; }
        .popup-incident .prioridad-MEDIA { background: #f59e0b; color: #1a1c23; }
        .popup-incident .prioridad-BAJA  { background: #22c55e; color: #1a1c23; }
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

        // ── F2: Marcador de incidente ──────────────────────────────────────
        var incidentMarker = null;

        window.mostrarIncidente = function(data) {
          if (incidentMarker) { map.removeLayer(incidentMarker); }

          var iconHtml = '<div class="incident-marker">' +
            '<div class="pulse-ring"></div>' +
            '<div class="pin">🔥</div>' +
            '</div>';

          var incidentIcon = L.divIcon({
            className: '',
            html: iconHtml,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -22]
          });

          var prioClass = 'prioridad-' + (data.nivel_prioridad || 'ALTA');
          var popupHtml = '<div class="popup-incident">' +
            '<div class="popup-title">🔥 Incidente Activo</div>' +
            '<div class="popup-row"><span class="popup-label">Tipo</span><span class="popup-value">' + (data.tipo_emergencia || '—') + '</span></div>' +
            '<div class="popup-row"><span class="popup-label">Dirección</span><span class="popup-value">' + (data.direccion_exacta || '—') + '</span></div>' +
            '<div class="popup-row"><span class="popup-label">Prioridad</span><span class="prioridad-badge ' + prioClass + '">' + (data.nivel_prioridad || '—') + '</span></div>' +
            '</div>';

          incidentMarker = L.marker([data.latitud, data.longitud], { icon: incidentIcon })
            .addTo(map)
            .bindPopup(popupHtml, { maxWidth: 260, closeButton: true });

          // Auto-zoom animado a la zona del incidente
          map.flyTo([data.latitud, data.longitud], 17, { animate: true, duration: 1.5 });
        };

        // ── F3: LayerGroups — uno por categoría de POI ────────────────────────────
        // Permite activar/desactivar cada capa sin recargar datos del backend
        var capas = {
          'HIDRANTE':           L.layerGroup().addTo(map),
          'SALUD':              L.layerGroup().addTo(map),
          'MATERIAL_PELIGROSO': L.layerGroup().addTo(map),
          'CUARTEL_APOYO':      L.layerGroup().addTo(map),
        };

        // ── F3: Íconos SVG por categoría ──────────────────────────────────────────
        // Gota de agua / Cruz médica / Triángulo de peligro / Escudo de cuartel
        var ICONOS = {
          'HIDRANTE': [
            '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">',
              '<circle cx="14" cy="14" r="13" fill="#1565c0" stroke="white" stroke-width="2"/>',
              '<path d="M14 6 Q9 12 9 16 Q9 22 14 23 Q19 22 19 16 Q19 12 14 6Z" fill="white"/>',
            '</svg>',
          ].join(''),
          'SALUD': [
            '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">',
              '<rect x="1" y="1" width="26" height="26" rx="6" fill="#2e7d32" stroke="white" stroke-width="2"/>',
              '<rect x="12" y="5" width="4" height="18" fill="white"/>',
              '<rect x="5" y="12" width="18" height="4" fill="white"/>',
            '</svg>',
          ].join(''),
          'MATERIAL_PELIGROSO': [
            '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">',
              '<polygon points="14,1 27,26 1,26" fill="#c2410c" stroke="white" stroke-width="2"/>',
              '<rect x="13" y="10" width="2" height="9" fill="white"/>',
              '<circle cx="14" cy="22" r="1.5" fill="white"/>',
            '</svg>',
          ].join(''),
          'CUARTEL_APOYO': [
            '<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">',
              '<path d="M14 2 L24 6 L24 16 Q24 23 14 26 Q4 23 4 16 L4 6 Z" fill="#37474f" stroke="white" stroke-width="2"/>',
              '<text x="14" y="18" text-anchor="middle" fill="white" font-size="10" font-weight="bold" font-family="sans-serif">C</text>',
            '</svg>',
          ].join(''),
        };

        // ── F3: Agregar un POI a su LayerGroup ────────────────────────────────────
        function agregarPOIInterno(lat, lng, categoria, nombre, descripcion) {
          var grupo = capas[categoria];
          if (!grupo) return;

          var svgHtml = ICONOS[categoria] || ICONOS['CUARTEL_APOYO'];
          var icon = L.divIcon({
            className: '',
            html: svgHtml,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
            popupAnchor: [0, -16],
          });

          L.marker([lat, lng], { icon: icon })
            .addTo(grupo)
            .bindPopup(
              '<b>' + (nombre || categoria) + '</b>' +
              (descripcion ? '<br><span style="color:#9ca3af">' + descripcion + '</span>' : '')
            );
        }

        // ── F3: Carga en lote con requestAnimationFrame ────────────────────────────
        window.cargarPOIsEnLote = function(poisArray) {
          if (!Array.isArray(poisArray) || poisArray.length === 0) return;
          var i = 0;
          var LOTE = 15;

          function procesarChunk() {
            var fin = Math.min(i + LOTE, poisArray.length);
            for (; i < fin; i++) {
              var p = poisArray[i];
              agregarPOIInterno(
                p.latitud,
                p.longitud,
                p.categoria,
                p.nombre || '',
                p.descripcion || ''
              );
            }
            if (i < poisArray.length) {
              window.requestAnimationFrame(procesarChunk);
            }
          }
          window.requestAnimationFrame(procesarChunk);
        };

        // ── F3: Toggle de visibilidad por capa ────────────────────────────────────
        window.toggleCapa = function(categoria, visible) {
          var grupo = capas[categoria];
          if (!grupo) return;
          if (visible && !map.hasLayer(grupo)) map.addLayer(grupo);
          if (!visible && map.hasLayer(grupo)) map.removeLayer(grupo);
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
export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();

  const webViewRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [coords, setCoords] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mapaListo, setMapaListo] = useState(false);
  const [alertasActivas, setAlertasActivas] = useState(0);

  // F2: Estado del incidente
  const [incidente, setIncidente] = useState(null);
  const [alertasData, setAlertasData] = useState([]);

  // F3 — Estado del panel de capas
  const [panelCapasVisible, setPanelCapasVisible] = useState(false);
  const [capasActivas, setCapasActivas] = useState({
    HIDRANTE: true,
    SALUD: true,
    MATERIAL_PELIGROSO: true,
    CUARTEL_APOYO: true,
  });

  const isCurrentlyAdmin = navigation.getState()?.routeNames?.includes('Panel');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
      const res = await fetch(`${API_BASE_URL}/api/maps/config`, { headers });
      if (res.status === 401) throw new Error('No autorizado. Volvé a iniciar sesión.');
      if (res.status === 404) {
        setCoords({ latitud: FALLBACK_LAT, longitud: FALLBACK_LNG });
        return;
      }
      if (!res.ok) throw new Error(`Error ${res.status} al obtener la configuración del mapa.`);
      const data = await res.json();
      if (typeof data.latitud !== 'number' || typeof data.longitud !== 'number') {
        throw new Error('El servidor no devolvió coordenadas válidas.');
      }
      setCoords({ latitud: data.latitud, longitud: data.longitud });
    } catch (err) {
      setError(err.message);
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
      const res = await fetch(`${API_BASE_URL}/alerta/rango`, {
        method: 'GET',
        headers,
        body: JSON.stringify({ fecha_desde: desde, fecha_hasta: hasta }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlertasActivas(data.length);
        setAlertasData(data);
      }
    } catch (_) { }
  }

  // ─── F2: GET /api/maps/incidents/{id} — datos del incidente activo ────────
  async function cargarIncidente(idIncidente) {
    if (!idIncidente) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/incidents/${idIncidente}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.latitud === 'number' && typeof data.longitud === 'number') {
        setIncidente(data);
      }
    } catch (_) { }
  }

  // ─── F3: GET /api/maps/pois → inyección en lote ──────────────────────────
  async function cargarPOIs() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/pois`, { headers });
      if (!res.ok) return;
      const poisData = await res.json();
      if (!Array.isArray(poisData) || poisData.length === 0) return;

      const poisSanitizados = poisData.map(p => ({
        latitud: p.latitud,
        longitud: p.longitud,
        categoria: p.categoria,
        nombre: (p.nombre || '').replace(/'/g, "\\'"),
        descripcion: (p.descripcion || '').replace(/'/g, "\\'"),
      }));

      const json = JSON.stringify(poisSanitizados);
      webViewRef.current?.injectJavaScript(`cargarPOIsEnLote(${json}); true;`);
    } catch (err) {
      console.warn('[MapScreen/F3] POIs:', err.message);
    }
  }

  // ─── Carga inicial de datos ───────────────────────────────────────────────
  useEffect(() => {
    cargarConfig();
    cargarAlertasActivas();

    // Si viene un incidenteId/alertaId por route params, cargarlo directamente
    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (paramId) {
      cargarIncidente(paramId);
    }
  }, []);

  // ─── Cargar incidente si cambian los parámetros de la ruta ────────────────
  useEffect(() => {
    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (paramId) {
      cargarIncidente(paramId);
    }
  }, [route?.params?.incidenteId, route?.params?.alertaId]);

  // ─── Auto-carga de incidente desde alertas activas (sin ID explícito) ─────
  useEffect(() => {
    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (!paramId && alertasData.length > 0 && !incidente) {
      const primeraAlerta = alertasData[0];
      const id = primeraAlerta.id || primeraAlerta.id_alerta;
      if (id) {
        cargarIncidente(id);
      }
    }
  }, [alertasData]);

  // ─── F2: Inyectar incidente en Leaflet cuando mapa + datos estén listos ───
  useEffect(() => {
    if (mapaListo && incidente) {
      const js = `mostrarIncidente(${JSON.stringify(incidente)}); true;`;
      webViewRef.current?.injectJavaScript(js);
    }
  }, [mapaListo, incidente]);

  // Cuando Leaflet confirma que cargó → inyectar los POIs
  useEffect(() => {
    if (!mapaListo) return;
    cargarPOIs();
  }, [mapaListo]);

  // ─── F3: Toggle de visibilidad de una capa ───────────────────────────────
  function handleToggleCapa(categoria) {
    const nuevoEstado = !capasActivas[categoria];
    setCapasActivas(prev => ({ ...prev, [categoria]: nuevoEstado }));
    webViewRef.current?.injectJavaScript(
      `toggleCapa('${categoria}', ${nuevoEstado}); true;`
    );
  }

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

      {/* ── Map Controls — botones conectados a Leaflet ── */}
      <View style={[styles.mapControls, { bottom: 120 }]}>
        <TouchableOpacity
          style={[styles.controlBtn, panelCapasVisible && styles.controlBtnActivo]}
          onPress={() => setPanelCapasVisible(v => !v)}
        >
          <MaterialCommunityIcons
            name="layers-outline"
            size={20}
            color={panelCapasVisible ? '#fff' : Colors.onSurface}
          />
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

      {/* F3 — Panel de capas (aparece cuando se toca el botón layers) */}
      {panelCapasVisible && mapaListo && (
        <View style={[styles.panelCapas, { bottom: 180 }]}>
          <Text style={styles.panelCapasTitulo}>CAPAS</Text>
          {CAPAS_CONFIG.map(capa => {
            const activa = capasActivas[capa.value];
            return (
              <TouchableOpacity
                key={capa.value}
                style={[styles.filaToggle, activa && { borderLeftColor: capa.color }]}
                onPress={() => handleToggleCapa(capa.value)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name={capa.icono}
                  size={15}
                  color={activa ? capa.color : '#475569'}
                />
                <Text style={[styles.filaToggleTexto, !activa && styles.filaToggleTextoInactivo]}>
                  {capa.label}
                </Text>
                <View style={[styles.toggleDot, activa && { backgroundColor: capa.color }]} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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

// ─── ESTILOS CORRESPONDIENTES , SIGO LA ESTRUCTURA DE LAS DEMAS SCREENS  ───────────────────────────────────────────────────────────────────
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
  controlBtnActivo: {
    backgroundColor: '#1d4ed8',
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

  // ── F3: Panel de capas ────────────────────────────────────────────────────────
  panelCapas: {
    position: 'absolute',
    right: Spacing.lg + 48,  // a la izquierda del panel de controles
    backgroundColor: '#1a1c23',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
    minWidth: 155,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 10 },
    }),
  },
  panelCapasTitulo: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    textTransform: 'uppercase',
  },
  filaToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  filaToggleTexto: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  filaToggleTextoInactivo: {
    color: '#475569',
  },
  toggleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1f2937',
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