import React, { useState, useRef } from 'react';
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
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

// ─── Componentes reutilizables (igual que antes) ──────────────────────────────
const InputField = ({ label, placeholder, value, onChangeText, multiline = false }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={[styles.inputWrapper, multiline && styles.inputWrapperMultiline]}>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  </View>
);

const DropdownField = ({ label, value, onPress }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownWrapper} onPress={onPress}>
      <Text style={styles.dropdownValue}>{value}</Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color="#a1a1aa" />
    </TouchableOpacity>
  </View>
);

// ─── HTML del mini-mapa para seleccionar coordenadas ─────────────────────────
// El usuario toca el mapa → aparece un marcador rojo + se envían lat/lng a RN
function generarMapaAlertaHTML(lat, lng) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"/>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:100%; height:100%; background:#26282f; }
    #map { width:100%; height:100vh; cursor:crosshair; }
    .leaflet-control-zoom { display:none !important; }
    .leaflet-control-attribution {
      font-size:7px !important;
      background:rgba(26,28,35,0.7) !important;
      color:#475569 !important;
    }
    #hint {
      position:absolute; top:8px; left:50%;
      transform:translateX(-50%);
      background:rgba(26,28,35,0.88);
      color:#94a3b8; font-size:10px; font-family:sans-serif;
      padding:4px 12px; border-radius:12px; border:1px solid #334155;
      pointer-events:none; z-index:1000; white-space:nowrap;
    }
    #hint.oculto { display:none; }
    .leaflet-popup-content-wrapper {
      background:#1a1c23; border:1px solid #334155;
      border-radius:8px; color:#e2e8f0;
      font-family:sans-serif; font-size:11px;
    }
    .leaflet-popup-tip { background:#1a1c23; }
  </style>
</head>
<body>
<div id="hint">Tocá el mapa para marcar la emergencia</div>
<div id="map"></div>
<script>
  var map = L.map('map', { center:[${lat},${lng}], zoom:14, zoomControl:false });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution:'&copy; OSM &copy; CartoDB', maxZoom:19, subdomains:'abcd'
  }).addTo(map);

  var marker = null;
  var iconEmergencia = L.divIcon({
    className:'',
    html:'<div style="width:22px;height:22px;background:#dc2626;border-radius:50%;border:3px solid white;box-shadow:0 2px 10px rgba(220,38,38,0.7)"></div>',
    iconSize:[22,22], iconAnchor:[11,11], popupAnchor:[0,-14]
  });

  function colocarMarcador(lat, lng) {
    if(marker) {
      marker.setLatLng([lat, lng]);
    } else {
      marker = L.marker([lat,lng], { icon:iconEmergencia, draggable:true }).addTo(map);
      marker.on('dragend', function(e) {
        var p = e.target.getLatLng();
        enviarCoords(parseFloat(p.lat.toFixed(6)), parseFloat(p.lng.toFixed(6)));
      });
    }
    marker.bindPopup('<b>Emergencia</b><br>Lat: ' + lat.toFixed(5) + '<br>Lng: ' + lng.toFixed(5)).openPopup();
    document.getElementById('hint').className = 'oculto';
  }

  function enviarCoords(lat, lng) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        tipo: 'COORDS_ALERTA',
        latitud: lat,
        longitud: lng
      }));
    } catch(e) {}
  }

  map.on('click', function(e) {
    var lat = parseFloat(e.latlng.lat.toFixed(6));
    var lng = parseFloat(e.latlng.lng.toFixed(6));
    colocarMarcador(lat, lng);
    enviarCoords(lat, lng);
  });

  // Llamado desde RN cuando el usuario tipea coordenadas manualmente
  window.moverMarcador = function(lat, lng) {
    if(!isNaN(lat) && !isNaN(lng)) {
      colocarMarcador(lat, lng);
      map.setView([lat, lng], map.getZoom(), { animate:true });
    }
  };

  setTimeout(function(){
    try{ window.ReactNativeWebView.postMessage(JSON.stringify({ tipo:'MAPA_ALERTA_LISTO' })); } catch(e){}
  }, 350);
</script>
</body>
</html>`;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const DEFAULT_LAT = -26.8083;
const DEFAULT_LNG = -65.2176;

const TIPOS_INCIDENTE = [
  { label: 'Incendio Estructural', id: '1' },
  { label: 'Incendio Forestal', id: '1' },
  { label: 'Rescate Vehicular', id: '2' },
  { label: 'Emergencia Médica', id: '3' },
  { label: 'Fuga de Gas', id: '3' },
  { label: 'Accidente Industrial', id: '1' },
];

const NIVELES_SEVERIDAD = [
  'NIVEL 1 - MENOR',
  'NIVEL 2 - MODERADO',
  'NIVEL 3 - ALTO',
  'NIVEL 4 - CRÍTICO',
  'NIVEL 5 - EXTREMO',
];

// ─── Componente principal ─────────────────────────────────────────────────────
export default function NewAlertScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const webViewRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'Incendio Estructural',
    severity: 'NIVEL 4 - CRÍTICO',
    location: '',
    description: '',
    latitud: '',       // ← NUEVO: requerido por el contrato
    longitud: '',       // ← NUEVO: requerido por el contrato
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showSeverityPicker, setShowSeverityPicker] = useState(false);
  const [mapaAlertaListo, setMapaAlertaListo] = useState(false);
  const [coordsSeleccionadas, setCoordsSeleccionadas] = useState(false);

  // ── NUEVO: Estados y ref para autocompletado de direcciones ────────────────
  const searchTimeoutRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);

  const parentState = navigation.getParent()?.getState();
  const isCurrentlyAdmin = parentState?.routeNames?.includes('Panel')
    || navigation.getState()?.routeNames?.includes('Panel')
    || false;

  const colorPrimario = isCurrentlyAdmin ? '#dc2626' : '#0284c7';

  // Cleanup de timeout al desmontar
  React.useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  // ── NUEVO: Búsqueda de direcciones y selección ────────────────────────────
  const buscarDirecciones = async (text) => {
    // Coordenadas base para priorizar búsqueda en Tucumán/Yerba Buena
    const viewbox = "-65.35,-26.88,-65.15,-26.75";
    
    // Si la búsqueda no incluye Tucumán, se la agregamos para forzar búsqueda local específica
    let queryText = text;
    if (!text.toLowerCase().includes("tucuman") && !text.toLowerCase().includes("tucumán")) {
      queryText = `${text}, Yerba Buena, Tucumán, Argentina`;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AxonFire-App',
          }
        }
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (error) {
      console.warn('Error al buscar dirección:', error);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  function onCambioUbicacion(text) {
    updateForm('location', text);
    
    if (!text || text.trim().length < 4) {
      setSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }
    
    setIsSearchingAddress(true);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      buscarDirecciones(text);
    }, 600);
  }

  const seleccionarSugerencia = async (item) => {
    // 1. Extraer número de altura del input original (ej: "av aconquija 2300" -> "2300")
    const matchNumero = formData.location.match(/\b\d+\b/);
    const numero = matchNumero ? matchNumero[0] : null;

    const addr = item.address || {};
    const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || item.name || '';
    const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';
    const provincia = addr.state || 'Tucumán';

    let nombreLimpio = '';
    if (calle) {
      // Inyectar el número después de la calle si se especificó y si la calle no lo incluye ya
      nombreLimpio = (numero && !calle.includes(numero)) ? `${calle} ${numero}` : calle;
      if (ciudad && ciudad !== calle) {
        nombreLimpio += `, ${ciudad}`;
      }
      if (provincia && provincia !== ciudad) {
        nombreLimpio += `, ${provincia}`;
      }
    } else {
      const partes = item.display_name.split(',');
      nombreLimpio = partes.slice(0, 3).map(p => p.trim()).join(', ');
      if (numero && !nombreLimpio.includes(numero)) {
        nombreLimpio = `${partes[0]} ${numero}, ${partes.slice(1, 3).join(', ')}`;
      }
    }
    
    updateForm('location', nombreLimpio);
    
    // 2. Geocodificar usando el geocodificador nativo (Apple Maps en iOS, Google en Android)
    // para obtener las coordenadas exactas de la altura
    let lat = parseFloat(item.lat);
    let lng = parseFloat(item.lon);

    try {
      const geocoded = await Location.geocodeAsync(nombreLimpio);
      if (geocoded && geocoded.length > 0) {
        lat = geocoded[0].latitude;
        lng = geocoded[0].longitude;
      }
    } catch (err) {
      console.warn('Geocodificación nativa falló, usando Nominatim:', err);
    }
    
    updateForm('latitud', String(lat.toFixed(6)));
    updateForm('longitud', String(lng.toFixed(6)));
    setCoordsSeleccionadas(true);
    
    if (mapaAlertaListo) {
      webViewRef.current?.injectJavaScript(`moverMarcador(${lat.toFixed(6)}, ${lng.toFixed(6)}); true;`);
    }
    
    setSuggestions([]);
  };

  // ─── Mensajes del mini-mapa → React Native ────────────────────────────────
  function onMensajeMapaAlerta({ nativeEvent: { data } }) {
    try {
      const msg = JSON.parse(data);
      if (msg.tipo === 'MAPA_ALERTA_LISTO') {
        setMapaAlertaListo(true);
      }
      if (msg.tipo === 'COORDS_ALERTA') {
        updateForm('latitud', String(msg.latitud));
        updateForm('longitud', String(msg.longitud));
        setCoordsSeleccionadas(true);
      }
    } catch (_) { }
  }

  // Cuando el usuario toca el mapa, las coordenadas se pasan a los inputs.
  // Si después tipea manualmente en los inputs, movemos el marcador en el mapa.
  function onCambioLatitud(text) {
    updateForm('latitud', text);
    const lat = parseFloat(text);
    const lng = parseFloat(formData.longitud);
    if (!isNaN(lat) && !isNaN(lng) && mapaAlertaListo) {
      webViewRef.current?.injectJavaScript(`moverMarcador(${lat}, ${lng}); true;`);
    }
  }

  function onCambioLongitud(text) {
    updateForm('longitud', text);
    const lat = parseFloat(formData.latitud);
    const lng = parseFloat(text);
    if (!isNaN(lat) && !isNaN(lng) && mapaAlertaListo) {
      webViewRef.current?.injectJavaScript(`moverMarcador(${lat}, ${lng}); true;`);
    }
  }

  // ─── Submit ────────────────────────────────────────────────────────────────
  const submitAlertData = async () => {
    if (!formData.location) {
      Alert.alert('Error', 'Por favor completá la ubicación de la emergencia.');
      return;
    }

    let lat = parseFloat(formData.latitud);
    let lng = parseFloat(formData.longitud);

    // Si las coordenadas no están seteadas o falló antes, intentamos una geocodificación nativa de último momento
    if (isNaN(lat) || isNaN(lng)) {
      try {
        const geocoded = await Location.geocodeAsync(formData.location);
        if (geocoded && geocoded.length > 0) {
          lat = geocoded[0].latitude;
          lng = geocoded[0].longitude;
        }
      } catch (err) {
        console.warn('Geocodificación nativa final falló:', err);
      }
    }

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(
        'Coordenadas requeridas',
        'No pudimos determinar las coordenadas para esa dirección. Tocá el mapa para seleccionar la ubicación exacta.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const selectedType = TIPOS_INCIDENTE.find(t => t.label === formData.type);
      const subCategoriaId = selectedType ? selectedType.id : '1';

      const body = {
        sub_categoria_alerta_id: subCategoriaId,
        ubicacion: formData.location,
        latitud: lat,             // ← NUEVO
        longitud: lng,             // ← NUEVO
        observaciones: `[${formData.severity}] - ${formData.description || 'Sin descripción'}`,
        destinatariosIds: [],          // se notifica a todos los activos
      };

      const response = await fetch(`${API_BASE_URL}/alerta/crear-con-notificacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al crear la alerta');

      Alert.alert('Despacho Confirmado', 'Las unidades de emergencia han sido notificadas.');
      setFormData({
        type: 'Incendio Estructural',
        severity: 'NIVEL 4 - CRÍTICO',
        location: '',
        description: '',
        latitud: '',
        longitud: '',
      });
      setCoordsSeleccionadas(false);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo crear la alerta.');
    } finally {
      setIsLoading(false);
    }
  };

  const mapaHTML = generarMapaAlertaHTML(DEFAULT_LAT, DEFAULT_LNG);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Header (igual que antes) */}
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.headerTitleBox}>
              <View style={[styles.redBorder, { backgroundColor: colorPrimario }]} />
            </View>

            <View style={styles.formContainer}>

              {/* Tipo e incidente (igual que antes) */}
              <DropdownField
                label="TIPO DE INCIDENTE"
                value={formData.type}
                onPress={() => setShowTypePicker(!showTypePicker)}
              />
              {showTypePicker && (
                <View style={styles.pickerContainer}>
                  {TIPOS_INCIDENTE.map(tipo => (
                    <TouchableOpacity
                      key={tipo.label}
                      style={styles.pickerOption}
                      onPress={() => { updateForm('type', tipo.label); setShowTypePicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{tipo.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <DropdownField
                label="NIVEL DE SEVERIDAD"
                value={formData.severity}
                onPress={() => setShowSeverityPicker(!showSeverityPicker)}
              />
              {showSeverityPicker && (
                <View style={styles.pickerContainer}>
                  {NIVELES_SEVERIDAD.map(nivel => (
                    <TouchableOpacity
                      key={nivel}
                      style={styles.pickerOption}
                      onPress={() => { updateForm('severity', nivel); setShowSeverityPicker(false); }}
                    >
                      <Text style={styles.pickerOptionText}>{nivel}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Ubicación texto con autocompletado */}
              <View style={styles.inputGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.label}>UBICACIÓN EXACTA</Text>
                  {isSearchingAddress && (
                    <ActivityIndicator size="small" color={colorPrimario} style={{ marginBottom: 8 }} />
                  )}
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="DIRECCIÓN O DESCRIPCIÓN DEL LUGAR..."
                    placeholderTextColor="#52525b"
                    value={formData.location}
                    onChangeText={onCambioUbicacion}
                  />
                </View>
                
                {suggestions.length > 0 && (
                  <View style={styles.suggestionsContainer}>
                    {suggestions.map((item, index) => {
                      const matchNumero = formData.location.match(/\b\d+\b/);
                      const numero = matchNumero ? matchNumero[0] : null;

                      const addr = item.address || {};
                      const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || item.name || '';
                      const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';

                      let textoMostrar = item.display_name;
                      if (calle) {
                        const calleConNumero = (numero && !calle.includes(numero)) ? `${calle} ${numero}` : calle;
                        textoMostrar = calleConNumero;
                        if (ciudad && ciudad !== calle) {
                          textoMostrar += `, ${ciudad}`;
                        }
                      }

                      return (
                        <TouchableOpacity
                          key={item.place_id || String(index)}
                          style={styles.suggestionItem}
                          onPress={() => seleccionarSugerencia(item)}
                        >
                          <MaterialCommunityIcons name="map-marker-outline" size={16} color={colorPrimario} />
                          <Text style={styles.suggestionText} numberOfLines={2}>
                            {textoMostrar}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* ── NUEVO: Mini-mapa para seleccionar coordenadas ── */}
              <View style={styles.inputGroup}>
                <View style={styles.mapaLabel}>
                  <MaterialCommunityIcons name="map-marker-radius" size={14} color={colorPrimario} />
                  <Text style={styles.label}>COORDENADAS DE LA EMERGENCIA</Text>
                  {coordsSeleccionadas && (
                    <View style={styles.badgeCoords}>
                      <MaterialCommunityIcons name="check" size={10} color="#22c55e" />
                      <Text style={styles.badgeCoordsTexto}>SELECCIONADAS</Text>
                    </View>
                  )}
                </View>

                {/* Mapa interactivo */}
                <View style={styles.mapaContenedor}>
                  {!mapaAlertaListo && (
                    <View style={styles.mapaLoader}>
                      <ActivityIndicator size="small" color={colorPrimario} />
                      <Text style={styles.mapaLoaderTexto}>Cargando mapa...</Text>
                    </View>
                  )}
                  <WebView
                    ref={webViewRef}
                    style={[styles.mapa, !mapaAlertaListo && { opacity: 0 }]}
                    source={{ html: mapaHTML }}
                    originWhitelist={['*']}
                    javaScriptEnabled
                    domStorageEnabled
                    scrollEnabled={false}
                    onMessage={onMensajeMapaAlerta}
                    mixedContentMode="always"
                    {...(Platform.OS === 'android' && { androidLayerType: 'hardware' })}
                  />
                </View>

                <Text style={styles.mapaHint}>
                  Tocá el mapa para colocar el marcador de emergencia
                </Text>

                {/* Inputs manuales de lat/lng */}
                <View style={styles.coordsRow}>
                  <View style={styles.coordInput}>
                    <Text style={styles.coordLabel}>LATITUD</Text>
                    <TextInput
                      style={styles.coordInputField}
                      value={formData.latitud}
                      onChangeText={onCambioLatitud}
                      placeholder="-26.8083"
                      placeholderTextColor="#52525b"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={styles.coordInput}>
                    <Text style={styles.coordLabel}>LONGITUD</Text>
                    <TextInput
                      style={styles.coordInputField}
                      value={formData.longitud}
                      onChangeText={onCambioLongitud}
                      placeholder="-65.2176"
                      placeholderTextColor="#52525b"
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              </View>

              {/* Descripción (igual que antes) */}
              <InputField
                label="EVALUACIÓN INICIAL / DESCRIPCIÓN"
                placeholder="DETALLES TÁCTICOS DEL INCIDENTE..."
                value={formData.description}
                onChangeText={text => updateForm('description', text)}
                multiline
              />

              {/* Botón submit */}
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colorPrimario }]}
                onPress={submitAlertData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="alert-decagram" size={20} color="#fff" />
                    <Text style={styles.buttonText}>INICIAR PROTOCOLO DE DESPACHO</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Bottom actions (igual que antes) */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    marginRight: 12,
  },
  formContainer: {
    backgroundColor: '#1b1d24',
    padding: 24,
    borderRadius: 4,
  },

  // ── Inputs existentes ──────────────────────────────────────────────────────
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

  // ── Nuevo: mapa de coordenadas ─────────────────────────────────────────────
  mapaLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  badgeCoords: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeCoordsTexto: {
    color: '#22c55e',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapaContenedor: {
    height: 350,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#26282f',
    position: 'relative',
  },
  mapaLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#26282f',
    zIndex: 10,
  },
  mapaLoaderTexto: {
    color: '#64748b',
    fontSize: 11,
  },
  mapa: {
    flex: 1,
    backgroundColor: '#26282f',
  },
  mapaHint: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '500',
    marginTop: 6,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  coordsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  coordInput: {
    flex: 1,
  },
  coordLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  coordInputField: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 12,
    color: '#22c55e',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '700',
  },

  // ── Botones y acciones ────────────────────────────────────────────────────
  primaryButton: {
    borderRadius: 4,
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
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
  // ── Nuevo: autocompletado de direcciones ───────────────────────────────────
  suggestionsContainer: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginTop: 4,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 1000,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1b1d24',
    gap: 10,
  },
  suggestionText: {
    color: '#e2e8f0',
    fontSize: 13,
    flex: 1,
  },
});