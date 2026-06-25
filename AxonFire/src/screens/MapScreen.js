// src/screens/MapScreen.js
// Mapa táctico principal — react-native-maps (nativo)
//
// F1: Mapa base nativo + ubicación del usuario en tiempo real
// F2: Marcador de incidente activo + ruta cuartel→incidente (Polyline)
// F3: POI markers por categoría con toggle de capas
//
// ENDPOINTS:
//   GET /api/maps/config    → { latitud, longitud }
//   GET /api/maps/pois      → [{ id, categoria, nombre, descripcion, latitud, longitud }]
//   GET /alerta/rango       → alertas activas (contador del banner)

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
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, Callout } from '../components/NativeMap';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Colors, Spacing, Radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles } from '../styles/MapScreenStyles';

// ─── Constantes ───────────────────────────────────────────────────────────────
const FALLBACK_LAT = -26.8083;
const FALLBACK_LNG = -65.2176;
const DEFAULT_DELTA = 0.015;

// F3 — Configuración de cada capa de POI
const CAPAS_CONFIG = [
  { value: 'HIDRANTE', label: 'Hidrantes', icono: 'water', color: '#1565c0' },
  { value: 'SALUD', label: 'Salud', icono: 'hospital-box', color: '#2e7d32' },
  { value: 'MATERIAL_PELIGROSO', label: 'Mat. Peligroso', icono: 'alert-octagon', color: '#c2410c' },
  { value: 'CUARTEL_APOYO', label: 'Cuarteles', icono: 'shield', color: '#37474f' },
];

const POI_ICONS = {
  HIDRANTE: 'water',
  SALUD: 'hospital-box',
  MATERIAL_PELIGROSO: 'alert-octagon',
  CUARTEL_APOYO: 'shield',
};

const POI_COLORS = {
  HIDRANTE: '#1565c0',
  SALUD: '#2e7d32',
  MATERIAL_PELIGROSO: '#c2410c',
  CUARTEL_APOYO: '#37474f',
};

// Estilo táctico oscuro para Google Maps (Android)
// En iOS se usa Apple Maps estándar (no soporta customMapStyle)
const tacticalMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
  { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

// ─── Componente ───────────────────────────────────────────────────────────────
export default function MapScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, token, logout } = useAuth();

  const mapRef = useRef(null);
  const iframeRef = useRef(null);

  // Animaciones
  const bannerPulseAnim = useRef(new Animated.Value(1)).current;
  const incidentPulseOpacity = useRef(new Animated.Value(1)).current;
  const incidentPulseScale = useRef(new Animated.Value(1)).current;

  // ── F1 — Estado base ────────────────────────────────────────────────────────
  const [coords, setCoords] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mapaListo, setMapaListo] = useState(Platform.OS === 'web');
  const [currentRegion, setCurrentRegion] = useState(null);
  const [alertasActivas, setAlertasActivas] = useState(0);

  // Ubicación del usuario
  const [locationGranted, setLocationGranted] = useState(false);

  // F2: Incidente
  const [incidente, setIncidente] = useState(null);
  const [alertasData, setAlertasData] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);
  const [responders, setResponders] = useState([]);
  const [modalBomberosVisible, setModalBomberosVisible] = useState(false);

  // F3: POIs y capas
  const [pois, setPois] = useState([]);
  const [panelCapasVisible, setPanelCapasVisible] = useState(false);
  const [capasActivas, setCapasActivas] = useState({
    HIDRANTE: true,
    SALUD: true,
    MATERIAL_PELIGROSO: true,
    CUARTEL_APOYO: true,
  });

  const poisVisibles = pois.filter(p => capasActivas[p.categoria]);

  const [routeOrigin, setRouteOrigin] = useState('STATION'); // 'STATION' or 'USER'

  const isCurrentlyAdmin = navigation.getState()?.routeNames?.includes('Panel');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ─── Handlers de autenticación ──────────────────────────────────────────────
  const handleAdminPress = () => {
    if (user?.rol === 'ADMIN') {
      navigation.navigate(isCurrentlyAdmin ? 'MainApp' : 'AdminApp');
    } else {
      if (Platform.OS === 'web') alert('Esta sección es exclusiva para administradores.');
      else Alert.alert('Acceso Denegado', 'Esta sección es exclusiva para administradores.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const abrirNavegacionGPS = () => {
    if (!incidente) {
      Alert.alert('Sin incidente', 'No hay ningún incidente activo seleccionado.');
      return;
    }
    const { latitud, longitud, direccion_exacta } = incidente;
    const address = direccion_exacta || '';
    const hasNumber = /\b\d+\b/.test(address);
    const destination = hasNumber ? encodeURIComponent(address) : `${latitud},${longitud}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const fallback = hasNumber
            ? `http://maps.google.com/maps?daddr=${encodeURIComponent(address)}`
            : `http://maps.google.com/maps?daddr=${latitud},${longitud}`;
          Linking.openURL(fallback);
        }
      })
      .catch(() => {
        Alert.alert('Error', 'No se pudo abrir la aplicación de mapas.');
      });
  };

  // ─── Controles de mapa ──────────────────────────────────────────────────────
  function centerOnStation() {
    if (!coords) return;
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'CENTER_STATION',
        stationCoords: { lat: coords.latitud, lng: coords.longitud }
      }, '*');
    } else {
      if (!mapRef.current) return;
      mapRef.current.animateToRegion({
        latitude: coords.latitud,
        longitude: coords.longitud,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
      }, 500);
    }
  }

  async function centerOnUser() {
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (Platform.OS === 'web') {
        iframeRef.current?.contentWindow?.postMessage({
          type: 'CENTER_USER',
          userCoords: { lat: loc.coords.latitude, lng: loc.coords.longitude }
        }, '*');
      } else {
        mapRef.current?.animateToRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 500);
      }
    } catch (e) {
      Alert.alert('Ubicación', 'No se pudo obtener tu ubicación actual.');
    }
  }

  function zoomIn() {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({ type: 'ZOOM_IN' }, '*');
    } else {
      if (!currentRegion || !mapRef.current) return;
      mapRef.current.animateToRegion({
        ...currentRegion,
        latitudeDelta: currentRegion.latitudeDelta / 2,
        longitudeDelta: currentRegion.longitudeDelta / 2,
      }, 300);
    }
  }

  function zoomOut() {
    if (Platform.OS === 'web') {
      iframeRef.current?.contentWindow?.postMessage({ type: 'ZOOM_OUT' }, '*');
    } else {
      if (!currentRegion || !mapRef.current) return;
      mapRef.current.animateToRegion({
        ...currentRegion,
        latitudeDelta: Math.min(currentRegion.latitudeDelta * 2, 5),
        longitudeDelta: Math.min(currentRegion.longitudeDelta * 2, 5),
      }, 300);
    }
  }

  function handleToggleCapa(categoria) {
    setCapasActivas(prev => ({ ...prev, [categoria]: !prev[categoria] }));
  }

  // ─── Animaciones ────────────────────────────────────────────────────────────
  // Pulso del banner de alertas
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bannerPulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(bannerPulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Pulso del marcador de incidente
  useEffect(() => {
    if (!incidente) return;
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(incidentPulseScale, { toValue: 2.2, duration: 1500, useNativeDriver: true }),
          Animated.timing(incidentPulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(incidentPulseOpacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
          Animated.timing(incidentPulseOpacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [incidente]);

  // ─── F1: Ubicación del usuario ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationGranted(true);
        }
      } catch (e) {
        console.warn('Error requesting location permission:', e);
      }
    })();
  }, []);

  // ─── F1: GET /api/maps/config ───────────────────────────────────────────────
  async function cargarConfig() {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/config`, { headers });
      if (res.status === 401) throw new Error('No autorizado. Volvé a iniciar sesión.');
      if (!res.ok) throw new Error(`Error ${res.status} al obtener la configuración del mapa.`);
      const data = await res.json();
      if (typeof data.latitud !== 'number' || typeof data.longitud !== 'number') {
        throw new Error('Coordenadas inválidas en la respuesta del servidor.');
      }
      setCoords({ latitud: data.latitud, longitud: data.longitud });
      if (Platform.OS === 'web') {
        setMapaListo(true);
      }
    } catch (err) {
      console.warn('Error al cargar config de mapa:', err.message);
      setCoords({ latitud: FALLBACK_LAT, longitud: FALLBACK_LNG });
      setMapaListo(true);
      if (Platform.OS !== 'web') {
        setError(err.message);
      }
    } finally {
      setCargando(false);
    }
  }

  // ─── F1: Contador de alertas activas ────────────────────────────────────────
  async function cargarAlertasActivas() {
    try {
      const hasta = new Date().toISOString();
      const desde = new Date(Date.now() - 86400000).toISOString();
      const url = `${API_BASE_URL}/alerta/rango?fecha_desde=${encodeURIComponent(desde)}&fecha_hasta=${encodeURIComponent(hasta)}`;
      const res = await fetch(url, { method: 'GET', headers });
      if (!res.ok) return;
      const data = await res.json();
      const rawList = Array.isArray(data?.alertas) ? data.alertas : Array.isArray(data) ? data : [];

      // Filtrar alertas finalizadas / resueltas / cerradas
      const list = rawList.filter(a => {
        const estadoObj = a.estadoAlerta || a.estado || {};
        const nombreEstado = typeof estadoObj === 'string'
          ? estadoObj
          : (estadoObj.nombre_estado || estadoObj.nombre || '');
        const e = nombreEstado.toUpperCase();
        if (e === 'FINALIZADO' || e.includes('RESUEL') || e.includes('CERRAD')) return false;
        return true;
      });

      list.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      setAlertasActivas(list.length);
      setAlertasData(list);
    } catch (_) { }
  }

  // ─── F2: Incidente activo ───────────────────────────────────────────────────
  async function cargarIncidente(idIncidente) {
    if (!idIncidente) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/incidents/${idIncidente}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      const lat = parseFloat(data.latitud);
      const lng = parseFloat(data.longitud);
      if (!isNaN(lat) && !isNaN(lng)) {
        setIncidente({ ...data, latitud: lat, longitud: lng });
      }
      cargarResponders(idIncidente);
    } catch (_) { }
  }

  async function cargarResponders(idIncidente) {
    try {
      const res = await fetch(`${API_BASE_URL}/respuestas_alertas/${idIncidente}`, { headers });
      if (!res.ok) return;
      const responsesData = await res.json();
      const aceptados = (Array.isArray(responsesData) ? responsesData : [])
        .filter(r => r.estado_respuesta === 'ACEPTADO')
        .map((r, i) => {
          const b = r.usuarioId?.bombero || r.bombero || {};
          return {
            id: r.id || String(i),
            name: `${b.nombre || 'B.'} ${b.apellido || ''}`.trim().toUpperCase(),
            role: b.rangoBombero?.nombre_rol || b.rango || 'BOMBERO',
            hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          };
        });
      setResponders(aceptados);
    } catch (_) { }
  }

  // ─── F2: Ruta cuartel → incidente (OSRM) ───────────────────────────────────
  async function fetchRoute(cuartelLat, cuartelLng, incLat, incLng) {
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${cuartelLng},${cuartelLat};${incLng},${incLat}?overview=full&geometries=geojson`;
      const res = await fetch(osrmUrl);
      const json = await res.json();

      if (json.code === 'Ok' && json.routes?.length > 0) {
        const routePoints = json.routes[0].geometry.coordinates.map(c => ({
          latitude: c[1],
          longitude: c[0],
        }));
        setRouteCoords(routePoints);

        // Ajustar cámara para ver toda la ruta
        if (mapRef.current && routePoints.length > 1) {
          mapRef.current.fitToCoordinates(routePoints, {
            edgePadding: { top: 120, right: 60, bottom: 120, left: 60 },
            animated: true,
          });
        }
      } else {
        throw new Error('No route');
      }
    } catch (_) {
      // Fallback: línea recta
      setRouteCoords([
        { latitude: cuartelLat, longitude: cuartelLng },
        { latitude: incLat, longitude: incLng },
      ]);
    }
  }

  // ─── F3: Cargar POIs ────────────────────────────────────────────────────────
  async function cargarPOIs() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/pois`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) setPois(data);
    } catch (err) {
      console.warn('[MapScreen/F3] POIs:', err.message);
    }
  }

  // ─── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    cargarConfig();
    cargarPOIs();

    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (paramId) cargarIncidente(paramId);
  }, []);

  // Sincronización Leaflet en Web y manejo del evento MAP_READY
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleIframeMessage = (e) => {
      if (e.data && e.data.type === 'MAP_READY') {
        setMapaListo(true);
        if (iframeRef.current && iframeRef.current.contentWindow && coords) {
          iframeRef.current.contentWindow.postMessage({
            type: 'UPDATE_STATE',
            stationCoords: { lat: coords.latitud, lng: coords.longitud },
            pois: poisVisibles,
            incident: incidente,
            routeCoords: routeCoords
          }, '*');
        }
      }
    };

    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, [coords, poisVisibles, incidente, routeCoords]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !coords) return;

    const sendStateUpdate = () => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'UPDATE_STATE',
          stationCoords: { lat: coords.latitud, lng: coords.longitud },
          pois: poisVisibles,
          incident: incidente,
          routeCoords: routeCoords
        }, '*');
      }
    };

    const timeout = setTimeout(sendStateUpdate, 150);
    return () => clearTimeout(timeout);
  }, [coords, poisVisibles, incidente, routeCoords]);

  useFocusEffect(
    React.useCallback(() => {
      cargarAlertasActivas();
    }, [token])
  );

  // Cargar incidente si cambian los parámetros de ruta
  useEffect(() => {
    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (paramId) cargarIncidente(paramId);
  }, [route?.params?.incidenteId, route?.params?.alertaId]);

  // Auto-carga de incidente desde alertas activas
  useEffect(() => {
    const paramId = route?.params?.incidenteId || route?.params?.alertaId;
    if (!paramId && alertasData.length > 0) {
      const primeraAlerta = alertasData[0];
      const id = primeraAlerta.id || primeraAlerta.id_alerta;
      const idIncidenteActual = incidente?.id || incidente?.id_alerta;
      if (id && idIncidenteActual !== id) cargarIncidente(id);
    } else if (!paramId && alertasData.length === 0 && incidente) {
      setIncidente(null);
      setRouteCoords([]);
    }
  }, [alertasData]);

  // Dibujar ruta cuando hay incidente + coordenadas
  useEffect(() => {
    async function updateRoute() {
      if (!incidente) {
        setRouteCoords([]);
        return;
      }

      let originLat, originLng;

      if (routeOrigin === 'USER' && locationGranted) {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          originLat = loc.coords.latitude;
          originLng = loc.coords.longitude;
        } catch (e) {
          Alert.alert('Error', 'No se pudo obtener tu ubicación actual.');
          setRouteOrigin('STATION');
          return;
        }
      } else if (coords) {
        originLat = coords.latitud;
        originLng = coords.longitud;
      } else {
        return;
      }

      fetchRoute(originLat, originLng, incidente.latitud, incidente.longitud);
    }

    updateRoute();
  }, [incidente, coords, routeOrigin, locationGranted]);

  // ─── Valores derivados ──────────────────────────────────────────────────────
  const lat = coords?.latitud ?? FALLBACK_LAT;
  const lng = coords?.longitud ?? FALLBACK_LNG;

  const initialRegion = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: DEFAULT_DELTA,
    longitudeDelta: DEFAULT_DELTA,
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── F1: Mapa nativo / Web Leaflet Map ──────────────────────────────────────── */}
      {Platform.OS === 'web' ? (
        <View style={StyleSheet.absoluteFill}>
          <iframe
            ref={iframeRef}
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
                <style>
                  body, html, #map { margin: 0; padding: 0; width: 100%; height: 100%; background: #16181d; }
                  .leaflet-tile-pane {
                    filter: grayscale(0.2) sepia(0.5) hue-rotate(80deg) saturate(0.65) brightness(0.82);
                  }
                  .station-marker {
                    background-color: #3b82f6;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    border: 2px solid #fff;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);
                  }
                  .poi-marker {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    border: 2px solid #fff;
                    box-shadow: 0 0 6px rgba(0,0,0,0.5);
                  }
                  .incident-marker {
                    font-size: 24px;
                    text-align: center;
                    animation: pulse 1.5s infinite;
                  }
                  @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.3); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                  }
                  .leaflet-popup-content-wrapper {
                    background: #1b1d24;
                    color: #f8fafc;
                    border: 1px solid #26282f;
                    border-radius: 8px;
                    font-family: sans-serif;
                  }
                  .leaflet-popup-tip {
                    background: #1b1d24;
                    border: 1px solid #26282f;
                  }
                </style>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js" onload="initMap()"></script>
              </head>
              <body>
                <div id="map"></div>
                <script>
                  var map = null;
                  var stationMarker = null;
                  var incidentMarker = null;
                  var routePolyline = null;
                  var poiMarkersGroup = null;
                  var pendingData = null;

                  var POI_COLORS = {
                    HIDRANTE: '#1565c0',
                    SALUD: '#2e7d32',
                    MATERIAL_PELIGROSO: '#c2410c',
                    CUARTEL_APOYO: '#37474f'
                  };

                  function initMap() {
                    map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
                    
                    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                      maxZoom: 20,
                      attribution: '&copy; OpenStreetMap'
                    }).addTo(map);

                    poiMarkersGroup = L.layerGroup().addTo(map);

                    // Signal ready to parent
                    window.parent.postMessage({ type: 'MAP_READY' }, '*');

                    // If we have any buffered state, update now
                    if (pendingData) {
                      updateState(pendingData);
                      pendingData = null;
                    }
                  }

                  function updateState(data) {
                    if (!map) return;

                    // 1. Station
                    if (data.stationCoords) {
                      var slat = parseFloat(data.stationCoords.lat);
                      var slng = parseFloat(data.stationCoords.lng);
                      if (!isNaN(slat) && !isNaN(slng)) {
                        if (!stationMarker) {
                          stationMarker = L.marker([slat, slng], {
                            icon: L.divIcon({
                              className: 'station-marker',
                              iconSize: [14, 14],
                              iconAnchor: [7, 7]
                            })
                          }).addTo(map).bindPopup('<b>Tu cuartel</b>');
                        } else {
                          stationMarker.setLatLng([slat, slng]);
                        }
                      }
                    }

                    // 2. POIs
                    if (poiMarkersGroup) {
                      poiMarkersGroup.clearLayers();
                      if (data.pois && Array.isArray(data.pois)) {
                        data.pois.forEach(function(poi) {
                          var plat = parseFloat(poi.latitud);
                          var plng = parseFloat(poi.longitud);
                          if (!isNaN(plat) && !isNaN(plng)) {
                            var color = POI_COLORS[poi.categoria] || '#37474f';
                            L.marker([plat, plng], {
                              icon: L.divIcon({
                                className: 'poi-marker',
                                html: '<div style="background-color: ' + color + '; width: 100%; height: 100%; border-radius: 50%;"></div>',
                                iconSize: [12, 12],
                                iconAnchor: [6, 6]
                              })
                            }).addTo(poiMarkersGroup)
                              .bindPopup('<b>' + (poi.nombre || poi.categoria) + '</b><br>' + (poi.descripcion || ''));
                          }
                        });
                      }
                    }

                    // 3. Incident
                    if (data.incident) {
                      var ilat = parseFloat(data.incident.latitud);
                      var ilng = parseFloat(data.incident.longitud);
                      if (!isNaN(ilat) && !isNaN(ilng)) {
                        if (!incidentMarker) {
                          incidentMarker = L.marker([ilat, ilng], {
                            icon: L.divIcon({
                              className: 'incident-marker',
                              html: '🔥',
                              iconSize: [30, 30],
                              iconAnchor: [15, 15]
                            })
                          }).addTo(map);
                        } else {
                          incidentMarker.setLatLng([ilat, ilng]);
                        }
                        incidentMarker.bindPopup('<b>🔥 ' + (data.incident.tipo_emergencia || 'Incidente') + '</b><br>' + (data.incident.direccion_exacta || ''));
                      } else if (incidentMarker) {
                        map.removeLayer(incidentMarker);
                        incidentMarker = null;
                      }
                    } else if (incidentMarker) {
                      map.removeLayer(incidentMarker);
                      incidentMarker = null;
                    }

                    // 4. Route
                    if (routePolyline) {
                      map.removeLayer(routePolyline);
                      routePolyline = null;
                    }
                    if (data.routeCoords && Array.isArray(data.routeCoords) && data.routeCoords.length > 1) {
                      var points = data.routeCoords.map(function(c) { return [c.latitude, c.longitude]; });
                      routePolyline = L.polyline(points, { color: '#dc2626', weight: 4 }).addTo(map);
                      map.fitBounds(routePolyline.getBounds(), { padding: [50, 50] });
                    } else if (data.stationCoords && !data.incident) {
                      map.setView([parseFloat(data.stationCoords.lat), parseFloat(data.stationCoords.lng)], 15);
                    }
                  }

                  window.addEventListener('message', function(event) {
                    var data = event.data;
                    if (!data) return;

                    if (data.type === 'UPDATE_STATE') {
                      if (!map) {
                        pendingData = data;
                      } else {
                        updateState(data);
                      }
                    } else if (data.type === 'ZOOM_IN') {
                      if (map) map.zoomIn();
                    } else if (data.type === 'ZOOM_OUT') {
                      if (map) map.zoomOut();
                    } else if (data.type === 'CENTER_STATION') {
                      if (map && data.stationCoords) {
                        map.setView([parseFloat(data.stationCoords.lat), parseFloat(data.stationCoords.lng)], 15);
                      }
                    } else if (data.type === 'CENTER_USER') {
                      if (map && data.userCoords) {
                        map.setView([parseFloat(data.userCoords.lat), parseFloat(data.userCoords.lng)], 15);
                      }
                    }
                  });
                </script>
              </body>
              </html>
            `}
            style={{ border: 0, width: '100%', height: '100%' }}
          />
        </View>
      ) : (
          coords && (
            <MapView
              ref={mapRef}
            style={StyleSheet.absoluteFill}
            initialRegion={initialRegion}
            customMapStyle={Platform.OS === 'android' ? tacticalMapStyle : undefined}
            showsUserLocation={locationGranted}
            showsMyLocationButton={false}
            showsCompass={false}
            showsScale={false}
            rotateEnabled={false}
            onMapReady={() => setMapaListo(true)}
            onRegionChangeComplete={region => setCurrentRegion(region)}
          >
            {/* Marcador del cuartel */}
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={styles.stationMarker} />
              <Callout>
                <View style={styles.calloutBox}>
                  <Text style={styles.calloutTitle}>Tu cuartel</Text>
                </View>
              </Callout>
            </Marker>

            {/* F3: POI markers (filtrados por capas activas) */}
            {poisVisibles.map((poi, idx) => {
              const color = POI_COLORS[poi.categoria] || '#37474f';
              const icon = POI_ICONS[poi.categoria] || 'map-marker';

              return (
                <Marker
                  key={poi.id || `poi-${idx}`}
                  coordinate={{
                    latitude: parseFloat(poi.latitud),
                    longitude: parseFloat(poi.longitud),
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View style={[styles.poiMarker, { backgroundColor: color }]}>
                    <MaterialCommunityIcons name={icon} size={14} color="#fff" />
                  </View>
                  <Callout>
                    <View style={styles.calloutBox}>
                      <Text style={styles.calloutTitle}>{poi.nombre || poi.categoria}</Text>
                      {poi.descripcion ? (
                        <Text style={styles.calloutDesc}>{poi.descripcion}</Text>
                      ) : null}
                    </View>
                  </Callout>
                </Marker>
              );
            })}

            {/* F2: Marcador de incidente con pulso */}
            {incidente && (
              <Marker
                coordinate={{ latitude: incidente.latitud, longitude: incidente.longitud }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
                onPress={() => setModalBomberosVisible(true)}
              >
                <View style={styles.incidentMarkerContainer}>
                  <Animated.View
                    style={[
                      styles.incidentPulseRing,
                      {
                        opacity: incidentPulseOpacity,
                        transform: [{ scale: incidentPulseScale }],
                      },
                    ]}
                  />
                  <View style={styles.incidentPin}>
                    <Text style={{ fontSize: 16 }}>🔥</Text>
                  </View>
                </View>
              </Marker>
            )}

            {/* F2: Ruta cuartel → incidente */}
            {routeCoords.length > 1 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#dc2626"
                strokeWidth={4}
                lineDashPattern={null}
                lineJoin="round"
                lineCap="round"
              />
            )}
          </MapView>
        )
      )}

      {/* ── Header + Mission card ────────────────────────────────────────── */}
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

        {incidente && (
          <View style={styles.missionCard}>
            <View style={styles.missionLeft}>
              <Text style={styles.missionLabel}>ESTADO DE MISIÓN</Text>
              <View style={styles.missionStatusRow}>
                <View style={styles.statusDotRed} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.missionStatus} numberOfLines={1}>{incidente.tipo_emergencia || 'INCIDENTE EN PROGRESO'}</Text>
                  <Text style={styles.missionLocation} numberOfLines={1}>{incidente.direccion_exacta || 'Ubicación no especificada'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.missionDivider} />
            <TouchableOpacity
              style={styles.missionRightContainer}
              activeOpacity={0.7}
              onPress={() => setModalBomberosVisible(true)}
            >
              <View style={styles.missionRight}>
                <Text style={styles.missionLabel}>RESPONDIENDO</Text>
                <Text style={styles.respondersCount}>{responders.length} UNIDADES</Text>
                <Text style={styles.respondersStatus}>ACTIVAS</Text>
              </View>
              <View style={styles.avatarStack}>
                {responders.slice(0, 2).map((r, i) => (
                  <View key={r.id} style={[styles.miniAvatar, { marginLeft: i > 0 ? -8 : 0, backgroundColor: i === 0 ? Colors.warningOrange : Colors.secondary }]}>
                    <MaterialCommunityIcons name="account" size={12} color="#fff" />
                  </View>
                ))}
                {responders.length > 2 && (
                  <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.primary }]}>
                    <Text style={styles.avatarCount}>+{responders.length - 2}</Text>
                  </View>
                )}
                {responders.length === 0 && (
                  <View style={[styles.miniAvatar, { backgroundColor: '#475569' }]}>
                    <MaterialCommunityIcons name="account-off" size={12} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── Controles del mapa ───────────────────────────────────────────── */}
      <View style={[styles.mapControls, { bottom: 120 }]}>
        {/* Capas */}
        <TouchableOpacity style={styles.controlBtn} onPress={() => setPanelCapasVisible(!panelCapasVisible)}>
          <MaterialCommunityIcons name="layers-outline" size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        {/* Origen de Ruta */}
        {incidente && locationGranted && (
          <TouchableOpacity
            style={[styles.controlBtn, routeOrigin === 'USER' && { backgroundColor: '#fef2f2' }]}
            onPress={() => setRouteOrigin(routeOrigin === 'STATION' ? 'USER' : 'STATION')}
          >
            <MaterialCommunityIcons
              name={routeOrigin === 'STATION' ? 'fire-truck' : 'account-map'}
              size={20}
              color={routeOrigin === 'USER' ? Colors.primary : Colors.onSurface}
            />
          </TouchableOpacity>
        )}

        {/* Centrar en mi ubicación */}
        {locationGranted && (
          <TouchableOpacity style={styles.controlBtn} onPress={centerOnUser}>
            <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
        )}

        {/* Centrar en cuartel */}
        <TouchableOpacity style={styles.controlBtn} onPress={centerOnStation}>
          <MaterialIcons name="my-location" size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        {/* Zoom in */}
        <TouchableOpacity style={styles.controlBtn} onPress={zoomIn}>
          <MaterialCommunityIcons name="plus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>

        {/* Zoom out */}
        <TouchableOpacity style={styles.controlBtn} onPress={zoomOut}>
          <MaterialCommunityIcons name="minus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>

      {/* ── F3: Panel de capas ───────────────────────────────────────────── */}
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

      {/* ── Admin FAB ────────────────────────────────────────────────────── */}
      {user?.rol === 'ADMIN' && (
        <TouchableOpacity
          style={styles.floatingMapFab}
          onPress={() => navigation.navigate('NewAlert')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="alarm-light" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── Botón de navegación GPS ──────────────────────────────────────── */}
      {incidente && (
        <TouchableOpacity
          style={[
            styles.floatingMapFab,
            { left: (user?.rol === 'ADMIN') ? Spacing.lg + 64 : Spacing.lg },
          ]}
          onPress={abrirNavegacionGPS}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="google-maps" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* ── F1: Banner alertas activas ────────────────────────────────────── */}
      {mapaListo && alertasActivas > 0 && (
        <View style={[styles.bannerAlertas, { top: insets.top + 14 }]}>
          <Animated.View style={[styles.puntoPulso, { opacity: bannerPulseAnim }]} />
          <Text style={styles.bannerTexto}>
            {alertasActivas} {alertasActivas === 1 ? 'alerta activa' : 'alertas activas'}
          </Text>
        </View>
      )}

      {/* ── F1: Pantalla de Carga y Error (Bloqueante) ─────────────────────────── */}
      {(cargando || !mapaListo || error) && (
        <View style={styles.overlayLoading}>
          {error && !cargando ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 32 }}>
              <MaterialCommunityIcons name="cloud-off-outline" size={48} color="#fca5a5" />
              <Text style={[styles.overlayTitulo, { color: '#fca5a5', marginTop: 12 }]}>
                Error de Conexión
              </Text>
              <Text style={[styles.overlaySubtitulo, { marginTop: 8 }]}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.errorBotonReintentar}
                onPress={cargarConfig}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
                <Text style={styles.errorBotonTexto}>REINTENTAR</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 24, padding: 8 }}
                onPress={() => setError(null)}
              >
                <Text style={[styles.overlaySubtitulo, { textDecorationLine: 'underline' }]}>
                  Forzar inicio en modo offline
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={styles.overlayTitulo}>Cargando mapa...</Text>
              <Text style={styles.overlaySubtitulo}>
                {cargando ? 'Obteniendo ubicación del cuartel' : 'Inicializando mapa nativo'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── F1: Error no bloqueante ──────────────────────────────────────── */}
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

      {/* ── Modal: Detalles de Misión + Bomberos respondiendo ────────────── */}
      <Modal visible={modalBomberosVisible} animationType="slide" transparent={true} onRequestClose={() => setModalBomberosVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Misión</Text>
              <TouchableOpacity onPress={() => setModalBomberosVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>

              {/* Mission Details Section */}
              <View style={styles.missionDetailsSection}>
                <View style={styles.missionDetailRow}>
                  <MaterialCommunityIcons name="alert-decagram" size={20} color="#e11d48" />
                  <View style={styles.missionDetailTextContainer}>
                    <Text style={styles.missionDetailLabel}>TIPO DE EMERGENCIA</Text>
                    <Text style={styles.missionDetailValue}>{incidente?.tipo_emergencia || 'No especificado'}</Text>
                  </View>
                </View>
                <View style={styles.missionDetailRow}>
                  <MaterialCommunityIcons name="map-marker" size={20} color="#38bdf8" />
                  <View style={styles.missionDetailTextContainer}>
                    <Text style={styles.missionDetailLabel}>UBICACIÓN</Text>
                    <Text style={styles.missionDetailValue}>{incidente?.direccion_exacta || 'Ubicación no especificada'}</Text>
                  </View>
                </View>
                {incidente?.observaciones ? (
                  <View style={styles.missionDetailRow}>
                    <MaterialCommunityIcons name="text-box-outline" size={20} color="#94a3b8" />
                    <View style={styles.missionDetailTextContainer}>
                      <Text style={styles.missionDetailLabel}>DESCRIPCIÓN</Text>
                      <Text style={styles.missionDetailValue}>{incidente.observaciones}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.modalDivider} />

              <Text style={styles.sectionSubtitle}>ASISTENCIA DE BOMBEROS</Text>
              {responders.length === 0 ? (
                <Text style={styles.modalEmpty}>Aún no hay bomberos respondiendo a esta alerta.</Text>
              ) : (
                responders.map((r) => (
                  <View key={r.id} style={styles.responderItem}>
                    <View style={styles.responderAvatar}>
                      <MaterialCommunityIcons name="account" size={20} color="#fff" />
                    </View>
                    <View style={styles.responderInfo}>
                      <Text style={styles.responderName}>{r.name}</Text>
                      <Text style={styles.responderRole}>{r.role}</Text>
                    </View>
                    <View style={styles.responderStatusBadge}>
                      <Text style={styles.responderStatusText}>EN CAMINO</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            <TouchableOpacity style={styles.returnButton} onPress={() => setModalBomberosVisible(false)}>
              <Text style={styles.returnButtonText}>VOLVER AL MAPA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

