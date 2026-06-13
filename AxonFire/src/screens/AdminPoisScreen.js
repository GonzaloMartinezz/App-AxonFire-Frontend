import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminPoisScreen({ navigation }) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  // Route Guard: Verificación de Rol
  if (!user || user.rol !== 'ADMIN') {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />
        <MaterialCommunityIcons name="shield-alert-outline" size={80} color="#ef4444" />
        <Text style={styles.errorTitle}>ACCESO RESTRINGIDO</Text>
        <Text style={styles.errorText}>
          Error 403. No posees los permisos de Administrador necesarios para acceder a la gestión operativa de Puntos de Interés.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.replace('MainApp')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          <Text style={styles.backButtonText}>VOLVER AL INICIO</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vista Base para Administrador (Se ampliará en AX-GESTION-F2 y F3)
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <TouchableOpacity 
          style={styles.iconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#94a3b8" />
        </TouchableOpacity>
        <View style={styles.topBarTitleGroup}>
          <Text style={styles.topBarTitle}>GESTIÓN DE POIs</Text>
          <Text style={styles.topBarSubtitle}>Administración del Mapa</Text>
        </View>
        <View style={{ width: 24 }} /> {/* Spacer */}
      </View>

      {/* Contenido Placeholder */}
      <View style={styles.content}>
        <MaterialCommunityIcons name="map-marker-multiple-outline" size={60} color="#334155" />
        <Text style={styles.placeholderTitle}>Módulo en Construcción</Text>
        <Text style={styles.placeholderText}>
          Aquí se desarrollará la grilla y el formulario de puntos de interés. (AX-GESTION-F2 / F3)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Contenedores Base
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  // Top Bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  iconBtn: {
    padding: 4,
  },
  topBarTitleGroup: {
    alignItems: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  topBarSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Vista de Error 403
  errorContainer: {
    flex: 1,
    backgroundColor: '#16181d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26282f',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },

  // Estilos Temporales del Placeholder
  placeholderTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  placeholderText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  }
});
