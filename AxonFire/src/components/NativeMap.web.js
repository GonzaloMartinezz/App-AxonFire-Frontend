import React, { useImperativeHandle, useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';
export const Marker = ({ children }) => <View>{children}</View>;
export const Polyline = () => null;
export const Callout = ({ children }) => <View>{children}</View>;

const NativeMap = React.forwardRef((props, ref) => {
  const iframeRef = useRef(null);
  const { initialRegion, onRegionChange, onRegionChangeComplete, style } = props;

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data) {
        if (event.data.type === 'REGION_CHANGE') {
          if (onRegionChange) {
            onRegionChange();
          }
        } else if (event.data.type === 'REGION_CHANGE_COMPLETE') {
          if (onRegionChangeComplete) {
            onRegionChangeComplete({
              latitude: event.data.latitude,
              longitude: event.data.longitude,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            });
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onRegionChange, onRegionChangeComplete]);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'ANIMATE_TO_REGION',
          latitude: region.latitude,
          longitude: region.longitude,
        }, '*');
      }
    },
    animateCamera: (camera) => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'ANIMATE_CAMERA',
          center: camera.center,
        }, '*');
      }
    },
    fitToCoordinates: () => {},
  }));

  const initialLat = initialRegion?.latitude || -26.8083;
  const initialLng = initialRegion?.longitude || -65.2176;

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

        map.on('movestart', function() {
          window.parent.postMessage({ type: 'REGION_CHANGE' }, '*');
        });

        map.on('moveend', function() {
          var center = map.getCenter();
          window.parent.postMessage({
            type: 'REGION_CHANGE_COMPLETE',
            latitude: center.lat,
            longitude: center.lng
          }, '*');
        });

        window.addEventListener('message', function(event) {
          var data = event.data;
          if (data.type === 'ANIMATE_TO_REGION') {
            map.setView([data.latitude, data.longitude], 15, { animate: true, duration: 0.5 });
          } else if (data.type === 'ANIMATE_CAMERA') {
            map.setView([data.center.latitude, data.center.longitude], 15, { animate: true, duration: 0.5 });
          }
        });
      </script>
    </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
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

export default NativeMap;
