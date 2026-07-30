import React, { useImperativeHandle, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

const CATEGORY_EMOJIS = {
  HIDRANTE: '💧',
  SALUD: '🏥',
  MATERIAL_PELIGROSO: '⚠️',
  CUARTEL_APOYO: '🏢',
};

const GestionPoisMap = React.forwardRef(({
  initialRegion,
  onRegionChangeComplete,
  onPress,
  formLatitud,
  formLongitud,
  formCategoria,
  getCategoriaInfo,
  tacticalMapStyle
}, ref) => {
  const iframeRef = useRef(null);

  // Handle messages from iframe (Leaflet map clicks)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'MAP_PRESS') {
        if (onPress) {
          onPress({
            nativeEvent: {
              coordinate: {
                latitude: event.data.latitude,
                longitude: event.data.longitude,
              }
            }
          });
        }
      }
    };

    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('message', handleMessage);
      return () => {
        if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
          window.removeEventListener('message', handleMessage);
        }
      };
    }
  }, [onPress]);

  // Update marker inside iframe when coords or category changes
  useEffect(() => {
    const lat = parseFloat(formLatitud);
    const lng = parseFloat(formLongitud);
    const catInfo = getCategoriaInfo(formCategoria);
    const emoji = CATEGORY_EMOJIS[formCategoria] || '📍';

    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_MARKER',
        latitude: isNaN(lat) ? null : lat,
        longitude: isNaN(lng) ? null : lng,
        color: catInfo?.color || '#ef4444',
        emoji: emoji
      }, '*');
    }
  }, [formLatitud, formLongitud, formCategoria, getCategoriaInfo]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'ANIMATE_TO_REGION',
          latitude: region.latitude,
          longitude: region.longitude,
          zoom: 16
        }, '*');
      }
    }
  }));

  const initialLat = initialRegion?.latitude || -26.8118;
  const initialLng = initialRegion?.longitude || -65.2975;

  const html = `
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
        .custom-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .marker-bubble {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          color: white;
          font-size: 14px;
          line-height: 1;
        }
        .marker-arrow {
          width: 0; height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid;
          margin-top: -1px;
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', { zoomControl: false }).setView([${initialLat}, ${initialLng}], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 20,
          attribution: '&copy; OpenStreetMap'
        }).addTo(map);

        var marker = null;

        function updateMarker(lat, lng, color, emoji) {
          if (marker) {
            map.removeLayer(marker);
          }
          if (lat && lng) {
            var customIcon = L.divIcon({
              className: 'custom-div-icon',
              html: '<div class="custom-marker">' +
                    '  <div class="marker-bubble" style="background-color: ' + color + ';">' + emoji + '</div>' +
                    '  <div class="marker-arrow" style="border-top-color: ' + color + ';"></div>' +
                    '</div>',
              iconSize: [30, 42],
              iconAnchor: [15, 42]
            });
            marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
          }
        }

        map.on('click', function(e) {
          window.parent.postMessage({
            type: 'MAP_PRESS',
            latitude: e.latlng.lat,
            longitude: e.latlng.lng
          }, '*');
        });

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (data.type === 'ANIMATE_TO_REGION') {
            map.setView([data.latitude, data.longitude], data.zoom || 16, { animate: true, duration: 0.5 });
          } else if (data.type === 'UPDATE_MARKER') {
            updateMarker(data.latitude, data.longitude, data.color, data.emoji);
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
});

export default GestionPoisMap;
