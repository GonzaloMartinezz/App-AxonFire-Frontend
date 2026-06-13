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
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';

// ── Category helpers ─────────────────────────────────────────────────────────
const CATEGORIAS = ['HIDRANTE', 'SALUD', 'MATERIAL_PELIGROSO', 'CUARTEL_APOYO'];

function getCategoriaInfo(cat = '') {
  switch (cat) {
    case 'HIDRANTE':
      return { icon: 'fire-hydrant', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Hidrante' };
    case 'SALUD':
      return { icon: 'hospital-box', color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Salud' };
    case 'MATERIAL_PELIGROSO':
      return { icon: 'biohazard', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Mat. Peligroso' };
    case 'CUARTEL_APOYO':
      return { icon: 'office-building', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Cuartel Apoyo' };
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

  // Delete confirmation modal
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingPoi, setDeletingPoi] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Map
  const mapRef = useRef(null);

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
    setFormVisible(true);
  }

  function openEditForm(poi) {
    setEditingPoi(poi);
    setFormNombre(poi.nombre || '');
    setFormCategoria(poi.categoria || 'HIDRANTE');
    setFormDescripcion(poi.descripcion || '');
    setFormLatitud(poi.latitud != null ? String(poi.latitud) : '');
    setFormLongitud(poi.longitud != null ? String(poi.longitud) : '');
    setFormVisible(true);
  }

  function closeForm() {
    setFormVisible(false);
    setEditingPoi(null);
  }

  // Handle map press
  function handleMapPress(e) {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setFormLatitud(latitude.toFixed(6));
    setFormLongitud(longitude.toFixed(6));
  }

  // Update map when inputs change manually
  useEffect(() => {
    if (!formVisible || !mapRef.current) return;
    const lat = parseFloat(formLatitud);
    const lng = parseFloat(formLongitud);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  }, [formLatitud, formLongitud, formVisible]);

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
              ? { ...p, nombre: body.nombre, categoria: body.categoria, descripcion: body.descripcion || p.descripcion, latitud: body.latitud, longitud: body.longitud }
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
          /* ── POI Table ──────────────────────────────────────────── */
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={[styles.thText, { flex: 2 }]}>NOMBRE</Text>
              <Text style={[styles.thText, { flex: 1.5 }]}>CATEGORÍA</Text>
              <Text style={[styles.thText, { flex: 1.5 }]}>COORDENADAS</Text>
              <Text style={[styles.thText, { width: 90, textAlign: 'center' }]}>ACCIONES</Text>
            </View>

            {/* Table Rows */}
            {pois.map((poi, idx) => {
              const catInfo = getCategoriaInfo(poi.categoria);
              return (
                <View
                  key={poi.id || idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 0 && styles.tableRowAlt,
                  ]}
                >
                  {/* Nombre */}
                  <View style={[styles.tdCell, { flex: 2 }]}>
                    <View style={[styles.poiIcon, { backgroundColor: catInfo.bg }]}>
                      <MaterialCommunityIcons name={catInfo.icon} size={16} color={catInfo.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.poiName} numberOfLines={1}>{poi.nombre || '—'}</Text>
                      {poi.descripcion ? (
                        <Text style={styles.poiDesc} numberOfLines={1}>{poi.descripcion}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* Categoría */}
                  <View style={[styles.tdCell, { flex: 1.5 }]}>
                    <View style={[styles.catBadge, { backgroundColor: catInfo.bg }]}>
                      <View style={[styles.catDot, { backgroundColor: catInfo.color }]} />
                      <Text style={[styles.catBadgeText, { color: catInfo.color }]} numberOfLines={1}>
                        {catInfo.label}
                      </Text>
                    </View>
                  </View>

                  {/* Coordenadas */}
                  <View style={[styles.tdCell, { flex: 1.5, flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <Text style={styles.coordText}>
                      <Text style={styles.coordLabel}>Lat </Text>
                      {formatCoord(poi.latitud)}
                    </Text>
                    <Text style={styles.coordText}>
                      <Text style={styles.coordLabel}>Lng </Text>
                      {formatCoord(poi.longitud)}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={[styles.tdCell, { width: 90, justifyContent: 'center', gap: 6 }]}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditForm(poi)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="pencil" size={14} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(poi)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#ef4444" />
                    </TouchableOpacity>
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
          <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled">
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
                onChangeText={setFormNombre}
              />

              {/* Categoría */}
              <Text style={styles.fieldLabel}>CATEGORÍA</Text>
              <TouchableOpacity
                style={styles.pickerBtn}
                onPress={() => setCatPickerOpen(true)}
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
                <MaterialCommunityIcons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>

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
              <View style={styles.mapContainer}>
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  provider={PROVIDER_GOOGLE}
                  customMapStyle={tacticalMapStyle}
                  initialRegion={{
                    latitude: editingPoi?.latitud || -34.60368,
                    longitude: editingPoi?.longitud || -58.38159,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }}
                  onPress={handleMapPress}
                >
                  {(parseFloat(formLatitud) && parseFloat(formLongitud)) ? (
                    <Marker
                      coordinate={{
                        latitude: parseFloat(formLatitud),
                        longitude: parseFloat(formLongitud)
                      }}
                    >
                      <View style={[styles.markerIcon, { backgroundColor: getCategoriaInfo(formCategoria).bg }]}>
                        <MaterialCommunityIcons 
                          name={getCategoriaInfo(formCategoria).icon} 
                          size={18} 
                          color={getCategoriaInfo(formCategoria).color} 
                        />
                      </View>
                    </Marker>
                  ) : null}
                </MapView>
              </View>

              {/* Coordenadas */}
              <View style={styles.coordRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>LATITUD</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="-34.60368"
                    placeholderTextColor="#64748b"
                    value={formLatitud}
                    onChangeText={setFormLatitud}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>LONGITUD</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="-58.38159"
                    placeholderTextColor="#64748b"
                    value={formLongitud}
                    onChangeText={setFormLongitud}
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
        </View>
      </Modal>

      {/* ── Category Picker Modal ─────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={catPickerOpen}
        onRequestClose={() => setCatPickerOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerModalTitle}>SELECCIONAR CATEGORÍA</Text>
            {CATEGORIAS.map(cat => {
              const info = getCategoriaInfo(cat);
              const isSelected = formCategoria === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.pickerOption, isSelected && styles.pickerOptionSelected]}
                  onPress={() => {
                    setFormCategoria(cat);
                    setCatPickerOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.pickerOptionIcon, { backgroundColor: info.bg }]}>
                    <MaterialCommunityIcons name={info.icon} size={20} color={info.color} />
                  </View>
                  <Text style={[styles.pickerOptionText, isSelected && { color: '#f8fafc' }]}>
                    {info.label}
                  </Text>
                  {isSelected && (
                    <MaterialCommunityIcons name="check-circle" size={18} color="#10b981" />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnCancel, { marginTop: 16 }]}
              onPress={() => setCatPickerOpen(false)}
            >
              <Text style={styles.modalBtnTextCancel}>CERRAR</Text>
            </TouchableOpacity>
          </View>
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

  // ── Table ────────────────────────────────────────────────────
  tableContainer: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#26282f',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1c23',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  thText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2028',
    backgroundColor: '#16181d',
  },
  tableRowAlt: {
    backgroundColor: '#1b1d24',
  },
  tdCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // POI row
  poiIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poiName: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
  },
  poiDesc: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  catDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  catBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  coordText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  coordLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
  },

  // Action Buttons
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(59,130,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Modals ───────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    padding: 20,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
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
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  pickerBtnText: {
    color: '#f8fafc',
    fontSize: 14,
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
    paddingVertical: 14,
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

  // Category Picker Modal
  pickerModal: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1b1d24',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#26282f',
    padding: 20,
  },
  pickerModalTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#26282f',
  },
  pickerOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },

  // Delete Modal
  deleteModalIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 12,
  },
  deleteModalDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});
