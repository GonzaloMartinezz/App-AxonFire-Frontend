import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView from './NativeMap';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const DEFAULT_LAT = -26.8083;
const DEFAULT_LNG = -65.2176;
const SEARCH_DEBOUNCE = 600;

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

export default function LocationPicker({
  initialLocation,
  initialAddress = '',
  onLocationSelect,
  mapHeight = 300,
  style,
}) {
  const mapRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [manualLat, setManualLat] = useState(
    initialLocation?.latitude != null ? String(initialLocation.latitude) : ''
  );
  const [manualLng, setManualLng] = useState(
    initialLocation?.longitude != null ? String(initialLocation.longitude) : ''
  );
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);

  const searchTimeoutRef = useRef(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Initialize map only once if initialLocation is provided
  useEffect(() => {
    if (initialLocation?.latitude != null && initialLocation?.longitude != null) {
      const lat = initialLocation.latitude;
      const lng = initialLocation.longitude;
      setManualLat(String(lat));
      setManualLng(String(lng));
      // Small delay to ensure MapView is ready
      setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          },
          500
        );
      }, 300);
    }
  }, []); // Only run on mount

  const searchAddresses = useCallback(async (text) => {
    const viewbox = '-65.35,-26.88,-65.15,-26.75';
    let queryText = text;
    if (!text.toLowerCase().includes('tucuman') && !text.toLowerCase().includes('tucumán')) {
      queryText = `${text}, Yerba Buena, Tucumán, Argentina`;
    }
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`,
        { headers: { 'User-Agent': 'AxonFire-App' } }
      );
      const data = await response.json();
      setSuggestions(data || []);
    } catch (error) {
      console.warn('Error al buscar dirección:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setSelectedAddress(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!text || text.trim().length < 4) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setSuggestions([]);
    searchTimeoutRef.current = setTimeout(() => {
      searchAddresses(text);
    }, SEARCH_DEBOUNCE);
  };

  const selectSuggestion = (item) => {
    const addr = item.address || {};
    const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || item.name || '';
    const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';
    const provincia = addr.state || 'Tucumán';

    let address = '';
    if (calle) {
      address = calle;
      if (ciudad && ciudad !== calle) address += `, ${ciudad}`;
      if (provincia && provincia !== ciudad) address += `, ${provincia}`;
    } else {
      const partes = item.display_name.split(',');
      address = partes.slice(0, 3).map((p) => p.trim()).join(', ');
    }

    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);

    setSearchQuery(address);
    setSelectedAddress(address);
    setSuggestions([]);
    setIsMapMoving(false);

    setManualLat(String(lat.toFixed(6)));
    setManualLng(String(lng.toFixed(6)));

    mapRef.current?.animateCamera(
      {
        center: { latitude: lat, longitude: lng },
        zoom: 16,
      },
      { duration: 500 }
    );

    onLocationSelect?.({
      latitude: lat,
      longitude: lng,
      address,
    });
  };

  const handleRegionChange = () => {
    setIsMapMoving(true);
  };

  const handleRegionChangeComplete = (newRegion) => {
    setIsMapMoving(false);
    const lat = newRegion.latitude;
    const lng = newRegion.longitude;
    setManualLat(String(lat.toFixed(6)));
    setManualLng(String(lng.toFixed(6)));
    onLocationSelect?.({
      latitude: lat,
      longitude: lng,
      address: selectedAddress || searchQuery,
    });
  };

  const handleManualLatChange = (text) => {
    setManualLat(text);
    const lat = parseFloat(text);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: lat, longitude: lng },
          zoom: 16,
        },
        { duration: 300 }
      );
      onLocationSelect?.({
        latitude: lat,
        longitude: lng,
        address: selectedAddress || searchQuery,
      });
    }
  };

  const handleManualLngChange = (text) => {
    setManualLng(text);
    const lat = parseFloat(manualLat);
    const lng = parseFloat(text);
    if (!isNaN(lat) && !isNaN(lng)) {
      mapRef.current?.animateCamera(
        {
          center: { latitude: lat, longitude: lng },
          zoom: 16,
        },
        { duration: 300 }
      );
      onLocationSelect?.({
        latitude: lat,
        longitude: lng,
        address: selectedAddress || searchQuery,
      });
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <MaterialCommunityIcons name="magnify" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR DIRECCIÓN..."
            placeholderTextColor="#52525b"
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {isSearching && (
            <ActivityIndicator size="small" color="#22c55e" style={styles.searchLoader} />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsList}>
            {suggestions.map((item, index) => {
              const addr = item.address || {};
              const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || item.name || '';
              const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';
              let display = item.display_name;
              if (calle) {
                display = calle;
                if (ciudad && ciudad !== calle) display += `, ${ciudad}`;
              }
              return (
                <TouchableOpacity
                  key={item.place_id || String(index)}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#22c55e" />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {display}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Indicador de estado */}
      <View style={styles.statusBar}>
        <MaterialCommunityIcons
          name={isMapMoving ? 'map-marker-path' : 'map-marker-check'}
          size={14}
          color={isMapMoving ? '#f59e0b' : '#22c55e'}
        />
        <Text style={[styles.statusText, { color: isMapMoving ? '#f59e0b' : '#22c55e' }]}>
          {isMapMoving ? 'Seleccionando...' : 'Ubicación fijada'}
        </Text>
      </View>

      {/* Mapa */}
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: initialLocation?.latitude ?? DEFAULT_LAT,
            longitude: initialLocation?.longitude ?? DEFAULT_LNG,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          }}
          onRegionChange={handleRegionChange}
          onRegionChangeComplete={handleRegionChangeComplete}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          showsCompass={false}
          showsPointsOfInterest={true}
          showsBuildings={true}
          showsIndoors={true}
          mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
          customMapStyle={Platform.OS === 'android' ? tacticalMapStyle : undefined}
        />
        {/* Marcador central fijo */}
        <View style={styles.markerFixedContainer} pointerEvents="none">
          <MaterialCommunityIcons name="map-marker" size={40} color="#dc2626" />
          <View style={styles.markerDot} />
        </View>
      </View>

      {/* Inputs manuales */}
      <View style={styles.coordsRow}>
        <View style={styles.coordInput}>
          <Text style={styles.coordLabel}>LATITUD</Text>
          <TextInput
            style={styles.coordInputField}
            value={manualLat}
            onChangeText={handleManualLatChange}
            placeholder="-26.8083"
            placeholderTextColor="#52525b"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.coordInput}>
          <Text style={styles.coordLabel}>LONGITUD</Text>
          <TextInput
            style={styles.coordInputField}
            value={manualLng}
            onChangeText={handleManualLngChange}
            placeholder="-65.2176"
            placeholderTextColor="#52525b"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchContainer: {
    marginBottom: 8,
    position: 'relative',
    zIndex: 10,
  },
  searchInputWrapper: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    color: '#e2e8f0',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  searchLoader: {
    marginLeft: 4,
  },
  suggestionsList: {
    backgroundColor: '#26282f',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#3f3f46',
    marginTop: 4,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 20,
    ...Platform.select({
      android: { elevation: 5 },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
    }),
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
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mapContainer: {
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#26282f',
    position: 'relative',
    marginBottom: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerFixedContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
    position: 'absolute',
    bottom: 0,
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
});
