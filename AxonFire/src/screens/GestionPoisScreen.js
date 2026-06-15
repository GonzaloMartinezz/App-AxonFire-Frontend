import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
  TextInput,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import GestionPoisMap from '../components/GestionPoisMap';

// ── Category helpers ─────────────────────────────────────────────────────────
const CATEGORIAS = ['HIDRANTE', 'SALUD', 'MATERIAL_PELIGROSO', 'CUARTEL_APOYO'];

// Recomendaciones predefinidas en Yerba Buena, Tucumán
const PREDEFINED_RECOMMENDATIONS = [
  {
    nombre: 'Hospital Ramón Carrillo (Yerba Buena)',
    categoria: 'SALUD',
    descripcion: 'Centro asistencial público y guardia médica de Yerba Buena.',
    latitud: -26.81432,
    longitud: -65.29051,
  },
  {
    nombre: 'Centro de Salud Dr. Ramón Carrillo',
    categoria: 'SALUD',
    descripcion: 'CAPS local y atención primaria de salud.',
    latitud: -26.81524,
    longitud: -65.29128,
  },
  {
    nombre: 'Sanatorio Parque - Sucursal Yerba Buena',
    categoria: 'SALUD',
    descripcion: 'Clínica y centro de emergencias privado.',
    latitud: -26.81235,
    longitud: -65.28546,
  },
  {
    nombre: 'Estación de Servicio YPF (Av. Aconquija)',
    categoria: 'MATERIAL_PELIGROSO',
    descripcion: 'Combustibles líquidos y gaseosos. Punto de abastecimiento crítico.',
    latitud: -26.81895,
    longitud: -65.28854,
  },
  {
    nombre: 'Estación de Servicio Shell (Av. Aconquija)',
    categoria: 'MATERIAL_PELIGROSO',
    descripcion: 'Combustibles de alto octanaje y tienda 24hs.',
    latitud: -26.81652,
    longitud: -65.29913,
  },
  {
    nombre: 'Estación de Servicio Refinor (Av. Perón)',
    categoria: 'MATERIAL_PELIGROSO',
    descripcion: 'Suministro de combustibles líquidos y GNC.',
    latitud: -26.79951,
    longitud: -65.29103,
  },
  {
    nombre: 'Cuartel de Bomberos Voluntarios de Yerba Buena (Sede Central)',
    categoria: 'CUARTEL_APOYO',
    descripcion: 'Nueva sede central de Bomberos Voluntarios de Yerba Buena (Perú y Thames).',
    latitud: -26.8118,
    longitud: -65.2975,
  },
  {
    nombre: 'Hidrante Central Plaza Marcos Paz',
    categoria: 'HIDRANTE',
    descripcion: 'Hidrante de acople rápido en sector este de la plaza.',
    latitud: -26.81154,
    longitud: -65.28628,
  },
  {
    nombre: 'Hidrante Av. Aconquija y Solano Vera',
    categoria: 'HIDRANTE',
    descripcion: 'Boca de incendio de red de agua municipal.',
    latitud: -26.81921,
    longitud: -65.28912,
  },
];

function getCategoriaInfo(cat = '') {
  switch (cat) {
    case 'HIDRANTE':
      return { icon: 'fire-hydrant', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Hidrante' };
    case 'SALUD':
      return { icon: 'hospital-box', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Salud' };
    case 'MATERIAL_PELIGROSO':
      return { icon: 'biohazard', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Mat. Peligroso' };
    case 'CUARTEL_APOYO':
      return { icon: 'fire-station', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Cuartel de Bomberos' };
    default:
      return { icon: 'map-marker', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: cat || 'Sin categoría' };
  }
}

function formatCoord(val) {
  if (val == null) return '—';
  return Number(val).toFixed(5);
}

// ── Map Style ────────────────────────────────────────────────────────────────
const tacticalMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#2f3948" }] },
  { featureType: "transit.station", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
];

// ── Toast Component ──────────────────────────────────────────────────────────
function Toast({ visible, message, type, onHide }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -30, duration: 300, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'rgba(220,38,38,0.95)' : 'rgba(16,185,129,0.95)';
  const iconName = isError ? 'alert-circle' : 'check-circle';

  return (
    <Animated.View
      style={[
        toastStyles.container,
        { backgroundColor: bgColor, opacity: fadeAnim, transform: [{ translateY }] },
      ]}
    >
      <MaterialCommunityIcons name={iconName} size={20} color="#fff" />
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  );
}

const toastStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 8,
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 10 },
      web: { boxShadow: '0px 4px 16px rgba(0,0,0,0.4)' },
    }),
  },
  text: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
    lineHeight: 18,
  },
});

// ── Main Screen ──────────────────────────────────────────────────────────────
export default function GestionPoisScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  // ── State ────────────────────────────────────────────────────
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Form / Edit
  const [formVisible, setFormVisible] = useState(false);
  const [editingPoi, setEditingPoi] = useState(null); // null = create, object = edit
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('HIDRANTE');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formLatitud, setFormLatitud] = useState('');
  const [formLongitud, setFormLongitud] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [catPickerOpen, setCatPickerOpen] = useState(false);

  // Auto-completado y sugerencias
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingPoi, setDeletingPoi] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Map
  const mapRef = useRef(null);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [currentDeltas, setCurrentDeltas] = useState({ latitudeDelta: 0.004, longitudeDelta: 0.004 });

  // Toast
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  // ── Helpers ──────────────────────────────────────────────────
  function showToast(message, type = 'success') {
    setToast({ visible: true, message, type });
  }

  function hideToast() {
    setToast(prev => ({ ...prev, visible: false }));
  }

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }), [token]);

  // ── Fetch POIs ───────────────────────────────────────────────
  const fetchPois = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/pois`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setPois(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching POIs:', err);
      setError('No se pudieron cargar los puntos de interés.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchPois();
  }, [fetchPois]);

  // ── Create / Update POI ──────────────────────────────────────
  function openCreateForm() {
    setEditingPoi(null);
    setFormNombre('');
    setFormCategoria('HIDRANTE');
    setFormDescripcion('');
    setFormLatitud('');
    setFormLongitud('');
    setSuggestions([]);
    setShowSuggestions(false);
    setFormVisible(true);

    // Initial center on Yerba Buena (Perú and Thames) with close zoom
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: -26.8118,
          longitude: -65.2975,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }, 500);
      }
    }, 300);
  }

  // Auto-completar POI sugerido
  function selectRecommendation(item) {
    setFormNombre(item.nombre);
    setFormCategoria(item.categoria);
    setFormDescripcion(item.descripcion || '');
    setFormLatitud(String(item.latitud));
    setFormLongitud(String(item.longitud));
    setSuggestions([]);
    setShowSuggestions(false);
    showToast(`Autocompletado: ${item.nombre}`);

    // Animate camera to recommendation location with close zoom
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: item.latitud,
        longitude: item.longitud,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 500);
    }
  }

  function openEditForm(poi) {
    setEditingPoi(poi);
    setFormNombre(poi.nombre || '');
    setFormCategoria(poi.categoria || 'HIDRANTE');
    setFormDescripcion(poi.descripcion || '');
    setFormLatitud(poi.latitud != null ? String(poi.latitud) : '');
    setFormLongitud(poi.longitud != null ? String(poi.longitud) : '');
    setSuggestions([]);
    setShowSuggestions(false);
    setFormVisible(true);

    // Animate camera to edited location with close zoom
    if (poi.latitud != null && poi.longitud != null) {
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: poi.latitud,
            longitude: poi.longitud,
            latitudeDelta: 0.003,
            longitudeDelta: 0.003,
          }, 500);
        }
      }, 300);
    }
  }

  function closeForm() {
    setFormVisible(false);
    setEditingPoi(null);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  // Controlador de escritura para el autocompletado
  function handleNombreChange(text) {
    setFormNombre(text);
    if (text.trim().length > 1) {
      const filtered = PREDEFINED_RECOMMENDATIONS.filter(item =>
        item.nombre.toLowerCase().includes(text.toLowerCase()) ||
        item.categoria.toLowerCase().includes(text.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(text.toLowerCase()))
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  // Handle map press
  function handleMapPress(e) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setFormLatitud(latitude.toFixed(6));
    setFormLongitud(longitude.toFixed(6));
  }

  // Centrar mapa cuando se terminan de escribir las coordenadas
  function handleCoordInputEnd() {
    if (!mapRef.current) return;
    const lat = parseFloat(formLatitud);
    const lng = parseFloat(formLongitud);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: currentDeltas.latitudeDelta,
        longitudeDelta: currentDeltas.longitudeDelta,
      }, 500);
    }
  }

  async function handleSubmitForm() {
    // Validation
    if (!formNombre.trim()) {
      showToast('El nombre del POI es obligatorio.', 'error');
      return;
    }
    const lat = parseFloat(formLatitud);
    const lng = parseFloat(formLongitud);
    if (isNaN(lat) || isNaN(lng)) {
      showToast('Las coordenadas deben ser números válidos.', 'error');
      return;
    }

    setSubmitting(true);

    const body = {
      nombre: formNombre.trim(),
      categoria: formCategoria,
      descripcion: formDescripcion.trim() || undefined,
      latitud: lat,
      longitud: lng,
    };

    try {
      if (editingPoi) {
        // PATCH
        const res = await fetch(`${API_BASE_URL}/api/maps/pois/${editingPoi.id}`, {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
        // Update locally
        setPois(prev =>
          prev.map(p =>
            p.id === editingPoi.id
              ? { ...p, ...body }
              : p
          )
        );
        showToast('Punto de interés actualizado con éxito.');
      } else {
        // POST
        const res = await fetch(`${API_BASE_URL}/api/maps/pois`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Error ${res.status}`);
        }
        const newPoi = await res.json();
        setPois(prev => [...prev, newPoi]);
        showToast('Punto de interés registrado con éxito.');
      }
      closeForm();
    } catch (err) {
      console.error('Error saving POI:', err);
      showToast(err.message || 'Error al guardar el punto de interés.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete POI ───────────────────────────────────────────────
  function confirmDelete(poi) {
    setDeletingPoi(poi);
    setDeleteModalVisible(true);
  }

  async function handleDelete() {
    if (!deletingPoi) return;
    setDeleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/maps/pois/${deletingPoi.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${res.status}`);
      }
      // Remove locally
      setPois(prev => prev.filter(p => p.id !== deletingPoi.id));
      showToast('Punto de interés eliminado con éxito.');
    } catch (err) {
      console.error('Error deleting POI:', err);
      showToast(err.message || 'Error al eliminar el recurso.', 'error');
    } finally {
      setDeleting(false);
      setDeleteModalVisible(false);
      setDeletingPoi(null);
    }
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="map-marker-radius" size={22} color="#e11d48" />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => fetchPois(true)} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchPois(true)}
            colors={['#dc2626']}
            tintColor="#dc2626"
          />
        }
      >
        {/* Header */}
        <Text style={styles.subtitle}>ADMINISTRACIÓN DE RECURSOS</Text>
        <Text style={styles.mainTitle}>GESTIÓN DE{'\n'}PUNTOS DE INTERÉS</Text>
        <Text style={styles.descText}>
          Alta, modificación y baja de Puntos de Interés operativos del cuartel. Cada POI queda vinculado al mapa táctico.
        </Text>

        {/* Add Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={openCreateForm} activeOpacity={0.8}>
          <MaterialCommunityIcons name="map-marker-plus" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>AGREGAR NUEVO POI</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{pois.length}</Text>
            <Text style={styles.statLabel}>TOTAL</Text>
          </View>
          {CATEGORIAS.map(cat => {
            const info = getCategoriaInfo(cat);
            const count = pois.filter(p => p.categoria === cat).length;
            return (
              <View key={cat} style={[styles.statCard, { borderLeftColor: info.color }]}>
                <Text style={styles.statValue}>{count}</Text>
                <Text style={styles.statLabel} numberOfLines={1}>{info.label.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>PUNTOS REGISTRADOS</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{pois.length}</Text>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.loadingText}>Cargando puntos de interés...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#ef4444" />
            <Text style={styles.loadingText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => fetchPois()}>
              <Text style={styles.retryBtnText}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        ) : pois.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="map-marker-off" size={48} color="#334155" />
            <Text style={styles.emptyText}>No hay puntos de interés registrados</Text>
            <Text style={styles.emptySubtext}>Agregá el primer POI con el botón superior</Text>
          </View>
        ) : (
          /* ── POI Cards List ──────────────────────────────────────────── */
          <View style={styles.cardsListContainer}>
            {pois.map((poi, idx) => {
              const catInfo = getCategoriaInfo(poi.categoria);
              return (
                <View key={poi.id || idx} style={styles.poiCard}>
                  <View style={[styles.poiCardLeftBorder, { backgroundColor: catInfo.color }]} />
                  <View style={styles.poiCardContent}>
                    <View style={styles.poiCardHeader}>
                      <View style={[styles.poiIconBox, { backgroundColor: catInfo.bg }]}>
                        <MaterialCommunityIcons name={catInfo.icon} size={18} color={catInfo.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.poiCardName} numberOfLines={2}>{poi.nombre || '—'}</Text>
                        <Text style={{ color: catInfo.color, fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                          {catInfo.label.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    {poi.descripcion ? (
                      <Text style={styles.poiCardDesc}>{poi.descripcion}</Text>
                    ) : null}

                    <View style={styles.poiCardFooter}>
                      <View style={styles.poiCardCoords}>
                        <MaterialCommunityIcons name="compass-outline" size={12} color="#64748b" />
                        <Text style={styles.poiCardCoordText}>
                          {formatCoord(poi.latitud)}, {formatCoord(poi.longitud)}
                        </Text>
                      </View>
                      <View style={styles.poiCardActions}>
                        <TouchableOpacity
                          style={styles.poiCardEditBtn}
                          onPress={() => openEditForm(poi)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="pencil" size={14} color="#3b82f6" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.poiCardDeleteBtn}
                          onPress={() => confirmDelete(poi)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Create / Edit Modal ───────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={formVisible}
        onRequestClose={closeForm}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
          >
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={parentScrollEnabled}
            >
              <View style={styles.modalView}>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <MaterialCommunityIcons
                    name={editingPoi ? 'pencil-circle' : 'map-marker-plus'}
                    size={24}
                    color="#e11d48"
                  />
                  <Text style={styles.modalTitle}>
                    {editingPoi ? 'EDITAR POI' : 'NUEVO PUNTO DE INTERÉS'}
                  </Text>
                </View>
                <Text style={styles.modalDesc}>
                  {editingPoi
                    ? 'Modificá los datos del punto de interés seleccionado.'
                    : 'Completá los campos para registrar un nuevo punto de interés en el mapa operativo.'}
                </Text>

                {/* Nombre */}
                <Text style={styles.fieldLabel}>NOMBRE</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Ej. Hospital General San Martín"
                  placeholderTextColor="#64748b"
                  value={formNombre}
                  onChangeText={handleNombreChange}
                />

                {/* Auto-completado y Sugerencias */}
                {showSuggestions && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((item, idx) => {
                      const catInfo = getCategoriaInfo(item.categoria);
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.suggestionOption}
                          onPress={() => selectRecommendation(item)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.poiIconBox, { backgroundColor: catInfo.bg, width: 28, height: 28 }]}>
                            <MaterialCommunityIcons name={catInfo.icon} size={14} color={catInfo.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.suggestionName}>{item.nombre}</Text>
                            <Text style={styles.suggestionDesc}>{item.descripcion || catInfo.label}</Text>
                          </View>
                          <MaterialCommunityIcons name="arrow-up-left" size={14} color="#64748b" />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Categoría (Inline Dropdown) */}
                <Text style={styles.fieldLabel}>CATEGORÍA</Text>
                <TouchableOpacity
                  style={styles.pickerBtn}
                  onPress={() => setCatPickerOpen(!catPickerOpen)}
                  activeOpacity={0.7}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons
                      name={getCategoriaInfo(formCategoria).icon}
                      size={18}
                      color={getCategoriaInfo(formCategoria).color}
                    />
                    <Text style={styles.pickerBtnText}>{getCategoriaInfo(formCategoria).label}</Text>
                  </View>
                  <MaterialCommunityIcons name={catPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                </TouchableOpacity>

                {catPickerOpen && (
                  <View style={styles.inlinePickerContainer}>
                    {CATEGORIAS.map(cat => {
                      const info = getCategoriaInfo(cat);
                      const isSelected = formCategoria === cat;
                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.inlinePickerOption, isSelected && styles.inlinePickerOptionSelected]}
                          onPress={() => {
                            setFormCategoria(cat);
                            setCatPickerOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.pickerOptionIcon, { backgroundColor: info.bg, width: 28, height: 28 }]}>
                            <MaterialCommunityIcons name={info.icon} size={14} color={info.color} />
                          </View>
                          <Text style={[styles.inlinePickerOptionText, isSelected && { color: '#f8fafc' }]}>
                            {info.label}
                          </Text>
                          {isSelected && (
                            <MaterialCommunityIcons name="check" size={14} color="#10b981" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Descripción */}
                <Text style={styles.fieldLabel}>DESCRIPCIÓN (OPCIONAL)</Text>
                <TextInput
                  style={[styles.modalInput, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="Detalles adicionales..."
                  placeholderTextColor="#64748b"
                  value={formDescripcion}
                  onChangeText={setFormDescripcion}
                  multiline
                />

                {/* Mapa Interactivo */}
                <Text style={[styles.fieldLabel, { marginTop: 8 }]}>UBICACIÓN EN MAPA</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8, marginTop: -4 }}>
                  Tocá el mapa para ubicar el POI rápidamente.
                </Text>
                <View
                  style={styles.mapContainer}
                  onTouchStart={() => setParentScrollEnabled(false)}
                  onTouchEnd={() => setParentScrollEnabled(true)}
                  onTouchCancel={() => setParentScrollEnabled(true)}
                >
                  <GestionPoisMap
                    ref={mapRef}
                    initialRegion={{
                      latitude: editingPoi?.latitud || -26.8118,
                      longitude: editingPoi?.longitud || -65.2975,
                      latitudeDelta: 0.004,
                      longitudeDelta: 0.004,
                    }}
                    onRegionChangeComplete={(region) => {
                      setCurrentDeltas({
                        latitudeDelta: region.latitudeDelta,
                        longitudeDelta: region.longitudeDelta,
                      });
                    }}
                    onPress={handleMapPress}
                    formLatitud={formLatitud}
                    formLongitud={formLongitud}
                    formCategoria={formCategoria}
                    getCategoriaInfo={getCategoriaInfo}
                    tacticalMapStyle={tacticalMapStyle}
                    customMarkerContainerStyle={styles.customMarkerContainer}
                    customMarkerBubbleStyle={styles.customMarkerBubble}
                    customMarkerArrowStyle={styles.customMarkerArrow}
                  />
                </View>

                {/* Coordenadas */}
                <View style={styles.coordRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>LATITUD</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="-26.81180"
                      placeholderTextColor="#64748b"
                      value={formLatitud}
                      onChangeText={setFormLatitud}
                      onEndEditing={handleCoordInputEnd}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>LONGITUD</Text>
                    <TextInput
                      style={styles.modalInput}
                      placeholder="-65.29750"
                      placeholderTextColor="#64748b"
                      value={formLongitud}
                      onChangeText={setFormLongitud}
                      onEndEditing={handleCoordInputEnd}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={closeForm}
                    disabled={submitting}
                  >
                    <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, styles.modalBtnConfirm, submitting && { opacity: 0.6 }]}
                    onPress={handleSubmitForm}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.modalBtnTextConfirm}>
                        {editingPoi ? 'GUARDAR CAMBIOS' : 'REGISTRAR POI'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => {
          if (!deleting) {
            setDeleteModalVisible(false);
            setDeletingPoi(null);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.deleteModalIcon}>
              <MaterialCommunityIcons name="alert-circle" size={40} color="#ef4444" />
            </View>
            <Text style={styles.deleteModalTitle}>CONFIRMAR ELIMINACIÓN</Text>
            <Text style={styles.deleteModalDesc}>
              ¿Estás seguro que deseas eliminar el punto de interés{' '}
              <Text style={{ fontWeight: '900', color: '#f8fafc' }}>
                {deletingPoi?.nombre?.toUpperCase() || ''}
              </Text>
              ? Esta acción quitará el POI del mapa operativo.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnCancel]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeletingPoi(null);
                }}
                disabled={deleting}
              >
                <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnDelete, deleting && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalBtnTextConfirm}>ELIMINAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  topBarTitle: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconBtn: {
    padding: 4,
  },

  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 10,
    color: '#fca5a5',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 33,
    marginBottom: 12,
  },
  descText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
    marginBottom: 24,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: 56,
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: '#26282f',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 7,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLine: {
    width: 6,
    height: 18,
    borderRadius: 3,
    backgroundColor: '#dc2626',
    marginRight: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#26282f',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  countBadgeText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },

  // Loading / Empty / Error
  centered: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#26282f',
    borderRadius: 4,
  },
  retryBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  emptyText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 11,
    color: '#64748b',
  },

  // ── Card-based List ──────────────────────────────────────────
  cardsListContainer: {
    gap: 12,
  },
  poiCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26282f',
    flexDirection: 'row',
    overflow: 'hidden',
    minHeight: 80,
  },
  poiCardLeftBorder: {
    width: 4,
    height: '100%',
  },
  poiCardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  poiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  poiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiCardName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  poiCardDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  poiCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    paddingTop: 8,
  },
  poiCardCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  poiCardCoordText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  poiCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  poiCardEditBtn: {
    padding: 6,
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 4,
  },
  poiCardDeleteBtn: {
    padding: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 4,
  },

  // Inline Picker
  inlinePickerContainer: {
    backgroundColor: '#16181d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 8,
    marginBottom: 16,
    marginTop: -8,
  },
  inlinePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginBottom: 2,
  },
  inlinePickerOptionSelected: {
    backgroundColor: '#26282f',
  },
  inlinePickerOptionText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },

  // Suggestions
  suggestionsContainer: {
    backgroundColor: '#16181d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 6,
    marginTop: -12,
    marginBottom: 16,
    maxHeight: 180,
    overflow: 'hidden',
  },
  suggestionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  suggestionName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionDesc: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },

  // ── Modals ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  modalView: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#1b1d24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26282f',
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 8 },
      web: { boxShadow: '0px 4px 24px rgba(0,0,0,0.5)' },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 20,
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#16181d',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#16181d',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  pickerBtnText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  coordRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },

  // Map Container
  mapContainer: {
    height: 180,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  map: {
    flex: 1,
  },
  markerIcon: {
    padding: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1e293b',
  },

  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancel: {
    backgroundColor: '#26282f',
  },
  modalBtnConfirm: {
    backgroundColor: '#e11d48',
  },
  modalBtnDelete: {
    backgroundColor: '#dc2626',
  },
  modalBtnTextCancel: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  modalBtnTextConfirm: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Category Picker Modal (pickerModal is now pickerOptionIcon inside inline list)
  pickerOptionIcon: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Delete Modal
  deleteModalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  customMarkerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  customMarkerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
      android: { elevation: 4 },
    }),
  },
  customMarkerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
