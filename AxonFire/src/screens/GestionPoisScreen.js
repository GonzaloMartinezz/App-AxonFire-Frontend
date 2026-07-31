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
  Alert,
  TextInput,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import { styles } from '../styles/GestionPoisScreenStyles';

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
  const { token, logout } = useAuth();
  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => logout(), style: "destructive" },
      ]
    );
  };

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

  const handleLocationSelect = ({ latitude, longitude }) => {
    setFormLatitud(String(latitude));
    setFormLongitud(String(longitude));
  };

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

      {/* Toast principal (sin modales activos) */}
      {!formVisible && !deleteModalVisible && (
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />
      )}

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <MaterialCommunityIcons name="map-marker-radius" size={22} color="#e11d48" />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => fetchPois(true)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout} activeOpacity={0.7}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
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
              scrollEnabled={true}
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
                  Buscá una dirección o mové el mapa para ajustar la ubicación exacta.
                </Text>
                <LocationPicker
                  initialLocation={
                    formLatitud && formLongitud
                      ? {
                        latitude: parseFloat(formLatitud),
                        longitude: parseFloat(formLongitud),
                      }
                      : editingPoi
                        ? {
                          latitude: editingPoi.latitud,
                          longitude: editingPoi.longitud,
                        }
                        : undefined
                  }
                  onLocationSelect={handleLocationSelect}
                  mapHeight={220}
                />

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
          <Toast visible={toast.visible && formVisible} message={toast.message} type={toast.type} onHide={hideToast} />
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
          <Toast visible={toast.visible && deleteModalVisible} message={toast.message} type={toast.type} onHide={hideToast} />
        </View>
      </Modal>
    </View>
  );
};


