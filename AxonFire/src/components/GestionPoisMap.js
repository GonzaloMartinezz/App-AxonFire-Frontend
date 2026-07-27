import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const GestionPoisMap = React.forwardRef(({
  initialRegion,
  onRegionChangeComplete,
  onPress,
  formLatitud,
  formLongitud,
  formCategoria,
  getCategoriaInfo,
  tacticalMapStyle,
  customMarkerContainerStyle,
  customMarkerBubbleStyle,
  customMarkerArrowStyle
}, ref) => {
  const catInfo = getCategoriaInfo(formCategoria);

  return (
    <MapView
      ref={ref}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      customMapStyle={tacticalMapStyle}
      initialRegion={initialRegion}
      onRegionChangeComplete={onRegionChangeComplete}
      onPress={onPress}
      liteMode={Platform.OS === 'android'}
      showsBuildings={Platform.OS !== 'android'}
      showsTraffic={false}
      showsIndoors={Platform.OS !== 'android'}
    >
      {(parseFloat(formLatitud) && parseFloat(formLongitud)) ? (
        <Marker
          coordinate={{
            latitude: parseFloat(formLatitud),
            longitude: parseFloat(formLongitud)
          }}
          anchor={{ x: 0.5, y: 1.0 }}
        >
          <View style={customMarkerContainerStyle}>
            <View style={[customMarkerBubbleStyle, { backgroundColor: catInfo.color }]}>
              <MaterialCommunityIcons 
                name={catInfo.icon} 
                size={16} 
                color="#ffffff"
              />
            </View>
            <View style={[customMarkerArrowStyle, { borderTopColor: catInfo.color }]} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
});

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});

export default GestionPoisMap;
