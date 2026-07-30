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
import * as Location from 'expo-location';

const DEFAULT_LAT = -26.8118;
const DEFAULT_LNG = -65.2975;
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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [manualLat, setManualLat] = useState(
    initialLocation?.latitude != null ? String(initialLocation.latitude) : ''
  );
  const [manualLng, setManualLng] = useState(
    initialLocation?.longitude != null ? String(initialLocation.longitude) : ''
  );
  const [selectedAddress, setSelectedAddress] = useState(initialAddress);

  const searchTimeoutRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);
  const isProgrammaticRef = useRef(false);
  const targetLocationRef = useRef(null);
  const lastGeocodedCoordsRef = useRef({ latitude: null, longitude: null });

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    };
  }, []);

  // Initialize map only once if initialLocation is provided
  useEffect(() => {
    if (initialLocation?.latitude != null && initialLocation?.longitude != null) {
      const lat = initialLocation.latitude;
      const lng = initialLocation.longitude;
      setManualLat(String(lat));
      setManualLng(String(lng));
      isProgrammaticRef.current = true;
      targetLocationRef.current = { latitude: lat, longitude: lng };
      lastGeocodedCoordsRef.current = { latitude: lat, longitude: lng };
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

  const reverseGeocode = async (lat, lng) => {
    targetLocationRef.current = null;
    lastGeocodedCoordsRef.current = { latitude: lat, longitude: lng };
    setIsGeocoding(true);
    try {
      let resolvedAddress = '';
      
      // 1. Intentar geocodificación inversa nativa
      try {
        const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (result && result.length > 0) {
          const addr = result[0];
          const street = addr.street || '';
          const number = addr.streetNumber || addr.name || '';
          const city = addr.city || addr.subregion || '';
          const region = addr.region || '';
          
          let formattedAddress = '';
          if (street) {
            formattedAddress = street;
            if (number && !number.includes(street) && number !== street) {
              formattedAddress += ` ${number}`;
            }
          } else if (addr.name) {
            formattedAddress = addr.name;
          }
          
          const extraParts = [];
          if (city && city !== street && city !== number) extraParts.push(city);
          if (region && region !== city) extraParts.push(region);
          
          if (extraParts.length > 0) {
            formattedAddress += (formattedAddress ? ', ' : '') + extraParts.join(', ');
          }
          
          if (!formattedAddress && addr.formattedAddress) {
            formattedAddress = addr.formattedAddress;
          }
          
          if (formattedAddress) {
            resolvedAddress = formattedAddress;
          }
        }
      } catch (nativeErr) {
        console.warn('Native reverse geocoding failed, trying Nominatim fallback:', nativeErr);
      }
      
      // 2. Fallback a Nominatim reverse geocoding en caso de error o datos vacíos
      if (!resolvedAddress) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            { headers: { 'User-Agent': 'AxonFire-App' } }
          );
          const data = await response.json();
          if (data && data.display_name) {
            const addr = data.address || {};
            const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || data.name || '';
            const numero = addr.house_number || '';
            const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';
            
            let formattedAddress = '';
            if (calle) {
              formattedAddress = calle;
              if (numero) formattedAddress += ` ${numero}`;
              if (ciudad && ciudad !== calle) formattedAddress += `, ${ciudad}`;
            } else {
              const partes = data.display_name.split(',');
              formattedAddress = partes.slice(0, 3).map((p) => p.trim()).join(', ');
            }
            
            if (formattedAddress) {
              resolvedAddress = formattedAddress;
            }
          }
        } catch (nominatimErr) {
          console.warn('Nominatim reverse geocoding failed:', nominatimErr);
        }
      }
      
      if (resolvedAddress) {
        setSearchQuery(resolvedAddress);
        setSelectedAddress(resolvedAddress);
        onLocationSelect?.({
          latitude: lat,
          longitude: lng,
          address: resolvedAddress,
        });
      } else {
        onLocationSelect?.({
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
      }
    } catch (error) {
      console.warn('Error en reverse geocoding:', error);
      onLocationSelect?.({
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    } finally {
      setIsGeocoding(false);
    }
  };

  const debouncedReverseGeocode = (lat, lng) => {
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    geocodeTimeoutRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, 800);
  };

  const searchAddresses = useCallback(async (text) => {
    let queryText = text;
    if (!text.toLowerCase().includes('tucuman') && !text.toLowerCase().includes('tucumán')) {
      queryText = `${text}, Yerba Buena, Tucumán, Argentina`;
    }
    try {
      let data = [];
      
      // Intentar geocodificación nativa primero
      try {
        const geocodeResults = await Location.geocodeAsync(queryText);
        if (geocodeResults && geocodeResults.length > 0) {
          const limitedResults = geocodeResults.slice(0, 5);
          const suggestionPromises = limitedResults.map(async (item) => {
            try {
              const rev = await Location.reverseGeocodeAsync({
                latitude: item.latitude,
                longitude: item.longitude,
              });
              if (rev && rev.length > 0) {
                const addr = rev[0];
                const street = addr.street || '';
                const number = addr.streetNumber || addr.name || '';
                const city = addr.city || addr.subregion || '';
                
                let formattedAddress = '';
                if (street) {
                  formattedAddress = street;
                  if (number && !number.includes(street) && number !== street) {
                    formattedAddress += ` ${number}`;
                  }
                } else if (addr.name) {
                  formattedAddress = addr.name;
                }
                
                const extraParts = [];
                if (city && city !== street && city !== number) extraParts.push(city);
                
                if (extraParts.length > 0) {
                  formattedAddress += (formattedAddress ? ', ' : '') + extraParts.join(', ');
                }
                
                if (!formattedAddress && addr.formattedAddress) {
                  formattedAddress = addr.formattedAddress;
                }
                
                return {
                  latitude: item.latitude,
                  longitude: item.longitude,
                  display_name: formattedAddress || `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`,
                };
              }
            } catch (err) {
              // Ignorar error individual
            }
            return {
              latitude: item.latitude,
              longitude: item.longitude,
              display_name: `${item.latitude.toFixed(6)}, ${item.longitude.toFixed(6)}`,
            };
          });
          data = await Promise.all(suggestionPromises);
        }
      } catch (nativeErr) {
        console.warn('Native autocomplete failed, falling back to Nominatim:', nativeErr);
      }
      
      // Fallback a Nominatim si lo nativo falló o no devolvió resultados
      if (!data || data.length === 0) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=5&addressdetails=1`,
            { headers: { 'User-Agent': 'AxonFire-App' } }
          );
          const rawData = await response.json();
          if (rawData && rawData.length > 0) {
            data = rawData.map(item => {
              const addr = item.address || {};
              const calle = addr.road || addr.pedestrian || addr.footway || addr.suburb || item.name || '';
              const numero = addr.house_number || '';
              const ciudad = addr.city || addr.town || addr.village || addr.suburb || 'Yerba Buena';
              
              let formattedAddress = '';
              if (calle) {
                formattedAddress = calle;
                if (numero) formattedAddress += ` ${numero}`;
                if (ciudad && ciudad !== calle) formattedAddress += `, ${ciudad}`;
              } else {
                const partes = item.display_name.split(',');
                formattedAddress = partes.slice(0, 3).map((p) => p.trim()).join(', ');
              }
              
              return {
                latitude: parseFloat(item.lat),
                longitude: parseFloat(item.lon),
                display_name: formattedAddress,
              };
            });
          }
        } catch (nominatimErr) {
          console.warn('Nominatim autocomplete fallback failed:', nominatimErr);
        }
      }
      
      setSuggestions(data || []);
    } catch (error) {
      console.warn('Error al buscar dirección:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setSelectedAddress(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!text || text.trim().length < 3) {
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
    const lat = item.latitude;
    const lng = item.longitude;
    const address = item.display_name;

    setSearchQuery(address);
    setSelectedAddress(address);
    setSuggestions([]);
    setIsMapMoving(false);

    setManualLat(String(lat.toFixed(6)));
    setManualLng(String(lng.toFixed(6)));

    targetLocationRef.current = { latitude: lat, longitude: lng };
    lastGeocodedCoordsRef.current = { latitude: lat, longitude: lng };
    isProgrammaticRef.current = true;
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

  const handleSearchSubmit = async () => {
    if (!searchQuery || searchQuery.trim().length < 3) return;
    setIsSearching(true);
    setSuggestions([]);

    let queryText = searchQuery;
    if (!queryText.toLowerCase().includes('tucuman') && !queryText.toLowerCase().includes('tucumán')) {
      queryText = `${queryText}, Yerba Buena, Tucumán, Argentina`;
    }

    try {
      let lat = null;
      let lng = null;

      // 1. Intentar geocodificación nativa
      try {
        const results = await Location.geocodeAsync(queryText);
        if (results && results.length > 0) {
          lat = results[0].latitude;
          lng = results[0].longitude;
        }
      } catch (nativeErr) {
        console.warn('Native geocoding failed on search submit:', nativeErr);
      }

      // 2. Fallback a Nominatim
      if (lat === null || lng === null) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryText)}&limit=1`,
            { headers: { 'User-Agent': 'AxonFire-App' } }
          );
          const data = await response.json();
          if (data && data.length > 0) {
            lat = parseFloat(data[0].lat);
            lng = parseFloat(data[0].lon);
          }
        } catch (nominatimErr) {
          console.warn('Nominatim geocoding failed on search submit:', nominatimErr);
        }
      }

      // 3. Fallback: Limpiar números e intentar de nuevo si falló y la consulta original contiene números
      if ((lat === null || lng === null) && /\d+/.test(searchQuery)) {
        const textWithoutNumbers = searchQuery.replace(/\d+/g, '').trim();
        if (textWithoutNumbers.length >= 3) {
          let fallbackQuery = textWithoutNumbers;
          if (!fallbackQuery.toLowerCase().includes('tucuman') && !fallbackQuery.toLowerCase().includes('tucumán')) {
            fallbackQuery = `${fallbackQuery}, Yerba Buena, Tucumán, Argentina`;
          }

          // Intentar nativo sin números
          try {
            const results = await Location.geocodeAsync(fallbackQuery);
            if (results && results.length > 0) {
              lat = results[0].latitude;
              lng = results[0].longitude;
            }
          } catch (err) {}

          // Intentar Nominatim sin números
          if (lat === null || lng === null) {
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1`,
                { headers: { 'User-Agent': 'AxonFire-App' } }
              );
              const data = await response.json();
              if (data && data.length > 0) {
                lat = parseFloat(data[0].lat);
                lng = parseFloat(data[0].lon);
              }
            } catch (err) {}
          }
        }
      }

      if (lat !== null && lng !== null) {
        targetLocationRef.current = { latitude: lat, longitude: lng };
        lastGeocodedCoordsRef.current = { latitude: lat, longitude: lng };
        isProgrammaticRef.current = true;
        mapRef.current?.animateCamera(
          {
            center: { latitude: lat, longitude: lng },
            zoom: 16,
          },
          { duration: 500 }
        );

        setManualLat(String(lat.toFixed(6)));
        setManualLng(String(lng.toFixed(6)));

        // Conservar exactamente la dirección que el usuario ingresó
        setSelectedAddress(searchQuery);
        onLocationSelect?.({
          latitude: lat,
          longitude: lng,
          address: searchQuery,
        });
      } else {
        console.warn('No se encontraron coordenadas para la búsqueda:', queryText);
      }
    } catch (err) {
      console.warn('Error en proceso de búsqueda:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegionChange = () => {
    setIsMapMoving(true);
  };

  const handleRegionChangeComplete = (newRegion, gestureInfo) => {
    setIsMapMoving(false);
    const lat = newRegion.latitude;
    const lng = newRegion.longitude;
    setManualLat(String(lat.toFixed(6)));
    setManualLng(String(lng.toFixed(6)));

    const wasProgrammatic = isProgrammaticRef.current;

    const target = targetLocationRef.current;
    let isCloseToTarget = false;
    if (target) {
      const latDiff = Math.abs(lat - target.latitude);
      const lngDiff = Math.abs(lng - target.longitude);
      if (latDiff < 0.0002 && lngDiff < 0.0002) {
        isCloseToTarget = true;
      }
    }

    if (wasProgrammatic) {
      isProgrammaticRef.current = false;
    }

    const lastGeo = lastGeocodedCoordsRef.current;
    const hasMovedSignificantly =
      lastGeo.latitude === null ||
      Math.abs(lat - lastGeo.latitude) > 0.00005 ||
      Math.abs(lng - lastGeo.longitude) > 0.00005;

    onLocationSelect?.({
      latitude: lat,
      longitude: lng,
      address: selectedAddress || searchQuery,
    });

    if (!wasProgrammatic && !isCloseToTarget && hasMovedSignificantly) {
      debouncedReverseGeocode(lat, lng);
    }
  };

  const handleManualLatChange = (text) => {
    setManualLat(text);
    const lat = parseFloat(text);
    const lng = parseFloat(manualLng);
    if (!isNaN(lat) && !isNaN(lng)) {
      isProgrammaticRef.current = true;
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
      debouncedReverseGeocode(lat, lng);
    }
  };

  const handleManualLngChange = (text) => {
    setManualLng(text);
    const lat = parseFloat(manualLat);
    const lng = parseFloat(text);
    if (!isNaN(lat) && !isNaN(lng)) {
      isProgrammaticRef.current = true;
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
      debouncedReverseGeocode(lat, lng);
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Buscador */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <TouchableOpacity onPress={handleSearchSubmit} activeOpacity={0.7}>
            <MaterialCommunityIcons name="magnify" size={18} color="#64748b" style={styles.searchIcon} />
          </TouchableOpacity>
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR DIRECCIÓN..."
            placeholderTextColor="#52525b"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {(isSearching || isGeocoding) && (
            <ActivityIndicator size="small" color="#22c55e" style={styles.searchLoader} />
          )}
        </View>
        {suggestions.length > 0 && (
          <View style={styles.suggestionsList}>
            {suggestions.map((item, index) => {
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <MaterialCommunityIcons name="map-marker-outline" size={16} color="#22c55e" />
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {item.display_name}
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
          name={isMapMoving ? 'map-marker-path' : isGeocoding ? 'autorenew' : 'map-marker-check'}
          size={14}
          color={isMapMoving ? '#f59e0b' : isGeocoding ? '#3b82f6' : '#22c55e'}
        />
        <Text style={[styles.statusText, { color: isMapMoving ? '#f59e0b' : isGeocoding ? '#3b82f6' : '#22c55e' }]}>
          {isMapMoving ? 'Seleccionando...' : isGeocoding ? 'Obteniendo dirección...' : 'Ubicación fijada'}
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
          liteMode={Platform.OS === 'android'}
          showsBuildings={Platform.OS !== 'android'}
          showsTraffic={false}
          showsIndoors={Platform.OS !== 'android'}
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
