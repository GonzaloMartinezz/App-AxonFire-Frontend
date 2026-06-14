import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import SelectorBomberos from '../components/SelectorBomberos';

// ── Reusable Input ─────────────────────────────────────────────────────────
const InputField = ({ label, placeholder, value, onChangeText, multiline = false, editable = true }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline, !editable && { color: '#64748b' }]}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        editable={editable}
      />
    </View>
  </View>
);

// ── Reusable Dropdown ──────────────────────────────────────────────────────
const DropdownField = ({ label, value, onPress }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownWrapper} onPress={onPress}>
      <Text style={styles.dropdownValue}>{value}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color="#a1a1aa" />
    </TouchableOpacity>
  </View>
);

// ── Leaflet Map HTML for the picker ────────────────────────────────────────
function generarMapaPickerHTML(initialLat, initialLng) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body, #map { width: 100%; height: 100%; background: #16181d; }
        .leaflet-tile-pane {
          filter: grayscale(0.2) sepia(0.5) hue-rotate(80deg) saturate(0.65) brightness(0.82);
        }
        .leaflet-control-zoom { display: none !important; }
        .leaflet-control-attribution {
          font-size: 8px !important;
          background: rgba(26, 28, 35, 0.6) !important;
          color: #475569 !important;
        }
        .crosshair-hint {
          position: absolute;
          bottom: 8px; left: 50%;
          transform: translateX(-50%);
          background: rgba(26,28,35,0.85);
          color: #94a3b8;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 12px;
          z-index: 1000;
          pointer-events: none;
          font-family: sans-serif;
        }
        .selected-marker {
          width: 32px; height: 32px;
          position: relative;
        }
        .selected-marker .ring {
          position: absolute; top: 0; left: 0;
          width: 32px; height: 32px;
          border-radius: 50%;
          border: 3px solid #dc2626;
          background: rgba(220,38,38,0.15);
        }
        .selected-marker .dot {
          position: absolute; top: 50%; left: 50%;
          width: 10px; height: 10px;
          margin: -5px 0 0 -5px;
          background: #dc2626;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(220,38,38,0.7);
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <div class="crosshair-hint">Tocá el mapa para ubicar la emergencia</div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          attribution: '&copy; OSM &copy; CartoDB',
          subdomains: 'abcd',
        }).addTo(map);

        var marker = null;

        function placeMarker(lat, lng) {
          if (marker) map.removeLayer(marker);
          var icon = L.divIcon({
            className: '',
            html: '<div class="selected-marker"><div class="ring"></div><div class="dot"></div></div>',
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          });
          marker = L.marker([lat, lng], { icon: icon }).addTo(map);
        }

        map.on('click', function(e) {
          placeMarker(e.latlng.lat, e.latlng.lng);
          window.parent.postMessage({
            type: 'MAP_PICK',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }, '*');
        });

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (data.type === 'FLY_TO') {
            map.flyTo([data.latitude, data.longitude], data.zoom || 17, { animate: true, duration: 0.8 });
            placeMarker(data.latitude, data.longitude);
          }
          if (data.type === 'PLACE_MARKER') {
            placeMarker(data.latitude, data.longitude);
            map.setView([data.latitude, data.longitude], data.zoom || 17);
          }
        });
      </script>
    </body>
    </html>
  `;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function NewAlertScreen({ navigation }) {
  const [formData, setFormData] = useState({
    type: 'Incendio Estructural',
    severity: 'NIVEL 4 - CRÍTICO',
    location: '',
    description: '',
    latitud: null,
    longitud: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [destinatarios, setDestinatarios] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const iframeRef = useRef(null);
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const parentState = navigation.getParent()?.getState();
  const isCurrentlyAdmin = parentState?.routeNames?.includes('Panel') || navigation.getState()?.routeNames?.includes('Panel') || false;

  const accentColor = isCurrentlyAdmin ? '#dc2626' : '#0284c7';

  const tiposIncidente = [
    { label: 'Incendio Estructural', id: '1' },
    { label: 'Incendio Forestal', id: '1' },
    { label: 'Rescate Vehicular', id: '2' },
    { label: 'Emergencia Médica', id: '3' },
    { label: 'Fuga de Gas', id: '3' },
    { label: 'Accidente Industrial', id: '1' }
  ];

  const nivelesSeveridad = [
    'NIVEL 1 - MENOR',
    'NIVEL 2 - MODERADO',
    'NIVEL 3 - ALTO',
    'NIVEL 4 - CRÍTICO',
    'NIVEL 5 - EXTREMO'
  ];

  const updateForm = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  // ── Handle map pick from iframe ────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MAP_PICK') {
        setFormData(prev => ({
          ...prev,
          latitud: parseFloat(event.data.latitude.toFixed(6)),
          longitud: parseFloat(event.data.longitude.toFixed(6)),
        }));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ── Geocode search (Nominatim) ─────────────────────────────────────────
  const handleSearchLocation = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const query = encodeURIComponent(searchQuery.trim());
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=ar`,
        { headers: { 'User-Agent': 'AxonFire/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const parsedLat = parseFloat(lat);
        const parsedLng = parseFloat(lon);
        setFormData(prev => ({
          ...prev,
          latitud: parseFloat(parsedLat.toFixed(6)),
          longitud: parseFloat(parsedLng.toFixed(6)),
          location: display_name || searchQuery,
        }));
        // Fly to the location on the map
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'FLY_TO',
            latitude: parsedLat,
            longitude: parsedLng,
            zoom: 17,
          }, '*');
        }
      } else {
        Alert.alert('Sin resultados', 'No se encontró la ubicación. Intentá con otro nombre o tocá directamente en el mapa.');
      }
    } catch (error) {
      console.error('Geocode error:', error);
      Alert.alert('Error', 'No se pudo buscar la ubicación.');
    } finally {
      setSearching(false);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const submitAlertData = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Por favor completa la ubicación de la emergencia.');
      return;
    }
    if (formData.latitud == null || formData.longitud == null) {
      Alert.alert('Error', 'Seleccioná un punto en el mapa o buscá una dirección para establecer las coordenadas.');
      return;
    }

    setIsLoading(true);

    try {
      const selectedType = tiposIncidente.find(t => t.label === formData.type);
      const subCategoriaId = selectedType ? selectedType.id : '1';

      const response = await fetch(`${API_BASE_URL}/alerta/crear-con-notificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sub_categoria_alerta_id: subCategoriaId,
          ubicacion: formData.location,
          latitud: formData.latitud,
          longitud: formData.longitud,
          observaciones: `[${formData.severity}] - ${formData.description || 'Sin descripción'}`,
          usuario_alta_alerta: user?.id || 'abc1',
          destinatariosIds: destinatarios.length > 0
            ? destinatarios.map(b => b.id)
            : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la alerta');
      }

      Alert.alert('Despacho Confirmado', 'Las unidades de emergencia han sido notificadas.');
      setFormData({
        type: 'Incendio Estructural',
        severity: 'NIVEL 4 - CRÍTICO',
        location: '',
        description: '',
        latitud: null,
        longitud: null,
      });
      setDestinatarios([]);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la alerta.');
    } finally {
      setIsLoading(false);
    }
  };

  // Default center for the map (Yerba Buena, Tucumán)
  const mapCenterLat = -26.8083;
  const mapCenterLng = -65.2176;

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>ALERTA</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerTitleBox}>
              <View style={[styles.redBorder, { backgroundColor: accentColor }]} />
            </View>

            <View style={styles.formContainer}>
              {/* Tipo de incidente */}
              <DropdownField
                label="TIPO DE INCIDENTE"
                value={formData.type}
                onPress={() => setShowTypePicker(!showTypePicker)}
              />

              {showTypePicker && (
                <View style={styles.pickerContainer}>
                  {tiposIncidente.map((tipo) => (
                    <TouchableOpacity
                      key={tipo.label}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateForm('type', tipo.label);
                        setShowTypePicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{tipo.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Nivel de severidad */}
              <DropdownField
                label="NIVEL DE SEVERIDAD"
                value={formData.severity}
                onPress={() => setShowSeverityPicker(!showSeverityPicker)}
              />

              {showSeverityPicker && (
                <View style={styles.pickerContainer}>
                  {nivelesSeveridad.map((nivel) => (
                    <TouchableOpacity
                      key={nivel}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateForm('severity', nivel);
                        setShowSeverityPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{nivel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Ubicación */}
              <InputField
                label="UBICACIÓN EXACTA"
                placeholder="DIRECCIÓN DE LA EMERGENCIA..."
                value={formData.location}
                onChangeText={(text) => updateForm('location', text)}
              />

              {/* ── Map Picker ─────────────────────────────────────────────── */}
              <Text style={styles.label}>UBICACIÓN EN MAPA</Text>
              <Text style={styles.mapHint}>
                Buscá una dirección o tocá el mapa para marcar las coordenadas de la emergencia.
              </Text>

              {/* Search bar */}
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar dirección... (ej: UNSTA Tucumán)"
                  placeholderTextColor="#52525b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearchLocation}
                  returnKeyType="search"
                />
                <TouchableOpacity
                  style={[styles.searchBtn, { backgroundColor: accentColor }]}
                  onPress={handleSearchLocation}
                  disabled={searching}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="magnify" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Leaflet map iframe */}
              {Platform.OS === 'web' && (
                <View style={styles.mapContainer}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={generarMapaPickerHTML(mapCenterLat, mapCenterLng)}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4 }}
                  />
                </View>
              )}

              {/* Coordinates display */}
              {formData.latitud != null && formData.longitud != null && (
                <View style={styles.coordsRow}>
                  <View style={styles.coordBadge}>
                    <MaterialCommunityIcons name="latitude" size={12} color="#22c55e" />
                    <Text style={styles.coordText}>{formData.latitud}</Text>
                  </View>
                  <View style={styles.coordBadge}>
                    <MaterialCommunityIcons name="longitude" size={12} color="#3b82f6" />
                    <Text style={styles.coordText}>{formData.longitud}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.coordClear}
                    onPress={() => setFormData(prev => ({ ...prev, latitud: null, longitud: null }))}
                  >
                    <MaterialCommunityIcons name="close-circle" size={14} color="#64748b" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Descripción */}
              <InputField
                label="EVALUACIÓN INICIAL / DESCRIPCIÓN"
                placeholder="DETALLES TÁCTICOS DEL INCIDENTE..."
                value={formData.description}
                onChangeText={(text) => updateForm('description', text)}
                multiline={true}
              />

              {/* ── Selector de Destinatarios (Bomberos) ────────────────── */}
              <View style={styles.sectionDivider}>
                <View style={styles.sectionLine} />
                <Text style={styles.sectionLabel}>NOTIFICACIONES</Text>
                <View style={styles.sectionLine} />
              </View>

              <SelectorBomberos
                token={token}
                seleccionados={destinatarios}
                onChange={setDestinatarios}
              />

              <Text style={styles.destinatariosHint}>
                {destinatarios.length === 0
                  ? 'Sin selección → se notificará a TODOS los bomberos.'
                  : `${destinatarios.length} bombero(s) serán notificados.`}
              </Text>

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: accentColor }]}
                onPress={submitAlertData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="alert-decagram" size={20} color="#fff" />
                    <Text style={styles.buttonText}>INICIAR PROTOCOLO DE DESPACHO</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.bottomActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="radio-handheld" size={16} color="#e2e8f0" />
                <Text style={styles.actionBtnText}>RADIO COMMS</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
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
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
  },
  headerTitleBox: {
    flexDirection: 'row',
    marginBottom: 32,
  },
  redBorder: {
    width: 3,
    backgroundColor: '#dc2626',
    marginRight: 12,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  formContainer: {
    backgroundColor: '#1b1d24',
    padding: 24,
    borderRadius: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  inputWrapperMultiline: {
    height: 120,
    paddingTop: 16,
  },
  input: {
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputMultiline: {
    height: '100%',
  },
  dropdownWrapper: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValue: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    gap: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
  },
  pickerContainer: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1d24',
  },
  pickerOptionText: {
    color: '#e2e8f0',
    fontSize: 14,
  },
  roleBreadcrumb: {
    height: 24,
    backgroundColor: '#1b1d24',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderLeftWidth: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
    marginTop: 6,
    borderRadius: 2,
  },
  roleBreadcrumbDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  roleBreadcrumbText: {
    fontSize: 9,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 1.2,
  },

  // ── Map Picker styles ──────────────────────────────────────────────────
  mapHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 10,
    marginTop: -4,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 14,
    color: '#e2e8f0',
    fontSize: 13,
  },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapContainer: {
    height: 220,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#16181d',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  coordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  coordText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  coordClear: {
    marginLeft: 'auto',
  },

  // ── Section divider ────────────────────────────────────────────────────
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#26282f',
  },
  sectionLabel: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  destinatariosHint: {
    fontSize: 11,
    color: '#64748b',
    marginTop: -8,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});