import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function NuevoPOIScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Nuevo POI Screen (Placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#16181d',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
