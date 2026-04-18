import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation }) {
  const QuickAction = ({ icon, label, onPress, color = '#af101a' }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <MaterialCommunityIcons name={icon} size={32} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Background with Glows */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0a0f12' }]} />
      <View style={[styles.glow, styles.redGlow]} />
      <View style={[styles.glow, styles.blueGlow]} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View>
              <Text style={styles.welcomeText}>BIENVENIDO,</Text>
              <Text style={styles.userName}>OPERADOR AXON-42</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
              <MaterialCommunityIcons name="account-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Emergency Banner */}
          <LinearGradient 
            colors={['#dc2626', '#7f1d1d']} 
            style={styles.emergencyBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.bannerLeft}>
              <MaterialCommunityIcons name="alert-decagram" size={24} color="#fff" />
              <Text style={styles.bannerTitle}>ALERTA ACTIVA</Text>
            </View>
            <Text style={styles.bannerDesc}>Incendio Forestal - Sector Alpha 4</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>VER MAPA</Text>
            </TouchableOpacity>
          </LinearGradient>

          <Text style={styles.sectionTitle}>CENTRO DE COMANDO</Text>
          
          <View style={styles.grid}>
            <QuickAction 
              icon="account-plus" 
              label="ALTA DE PERSONAL" 
              onPress={() => navigation.navigate('AddFirefighter')} 
            />
            <QuickAction 
              icon="map-marker-radius" 
              label="MAPA TÁCTICO" 
              onPress={() => navigation.navigate('Mapa')} 
              color="#2563eb"
            />
            <QuickAction 
              icon="bell-ring" 
              label="ALERTAS" 
              onPress={() => navigation.navigate('Alertas')} 
              color="#f59e0b"
            />
            <QuickAction 
              icon="chart-areaspline" 
              label="REPORTES" 
              onPress={() => navigation.navigate('Reportes')} 
              color="#10b981"
            />
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusLabel}>ESTADO DEL SISTEMA</Text>
            <View style={styles.statusItem}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SERVIDOR CENTRAL: OPERATIVO</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>ENLACE SATELITAL: ACTIVO</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    borderRadius: 500,
    width: 600,
    height: 600,
    opacity: 0.1,
  },
  redGlow: {
    backgroundColor: '#dc2626',
    top: -250,
    left: -200,
  },
  blueGlow: {
    backgroundColor: '#2563eb',
    bottom: -250,
    right: -200,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeText: {
    color: '#90a4ae',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  userName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  profileBtn: {
    opacity: 0.8,
  },
  emergencyBanner: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 8px 12px rgba(220, 38, 38, 0.4)',
      },
    }),
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  bannerDesc: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bannerBtnText: {
    color: '#7f1d1d',
    fontSize: 11,
    fontWeight: '900',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 20,
    opacity: 0.7,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  actionCard: {
    backgroundColor: 'rgba(38, 50, 56, 0.4)',
    width: '47%',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  statusCard: {
    marginTop: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  statusLabel: {
    color: '#455a64',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  statusText: {
    color: '#90a4ae',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
