import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmergencyScreen() {
  const currentTime = new Date().toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).toUpperCase();

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.time}>{currentTime}</Text>
          <Text style={styles.date}>{currentDate}</Text>
        </View>

        {/* ALERTA */}
        <View style={styles.alertBox}>
          <MaterialCommunityIcons name="alert" size={24} color="#fff" />
          <View>
            <Text style={styles.alertTitle}>¡ALERTA DE EMERGENCIA!</Text>
            <Text style={styles.alertSubtitle}>AXON CODE</Text>
          </View>
        </View>

        {/* DETALLES */}
        <View style={styles.card}>
          <Text style={styles.label}>TIPO DE INCIDENTE</Text>
          <Text style={styles.text}>Incendio Estructural - Edificio</Text>
          <Text style={styles.text}>Av. Corrientes</Text>

          <View style={styles.row}>
            <View>
              <Text style={styles.label}>HORA</Text>
              <Text style={styles.text}>{currentTime} HS</Text>
            </View>
            <View>
              <Text style={styles.label}>PRIORIDAD</Text>
              <Text style={styles.critical}>CRÍTICA</Text>
            </View>
          </View>

          <View style={styles.location}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#3b82f6" />
            <Text style={styles.locationText}>
              Av. Corrientes 1234, CABA. Múltiples focos en piso 4 y 5.
            </Text>
          </View>
        </View>

        {/* BOTONES */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.confirmButton}>
            <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>CONFIRMAR ASISTENCIA</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.rejectButton}>
            <MaterialCommunityIcons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>RECHAZAR</Text>
          </TouchableOpacity>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer}>AXON TACTICAL DRIVE</Text>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f12',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  time: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
  },
  date: {
    color: '#90a4ae',
    fontSize: 12,
    letterSpacing: 2,
  },
  alertBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  alertTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  alertSubtitle: {
    color: '#fecaca',
    fontSize: 12,
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.7)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  label: {
    color: '#90a4ae',
    fontSize: 10,
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    marginBottom: 4,
  },
  critical: {
    color: '#ef4444',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  location: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  locationText: {
    color: '#cfd8dc',
    flex: 1,
  },
  actions: {
    marginTop: 'auto',
    gap: 10,
  },
  confirmButton: {
    backgroundColor: '#dc2626',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  rejectButton: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    textAlign: 'center',
    color: '#455a64',
    marginTop: 20,
    fontSize: 10,
  },
});