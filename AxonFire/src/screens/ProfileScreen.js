import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Platform,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../theme';

const { width } = Dimensions.get('window');

const STATS = [
  { label: 'Bomberos Activos', value: '42', icon: 'account-group', color: Colors.primary },
  { label: 'Vehículos Operativos', value: '8', icon: 'fire-truck', color: Colors.tertiary },
  { label: 'Alertas Mes', value: '156', icon: 'bell-alert', color: Colors.alertBlue },
  { label: 'Tiempo Promedio', value: '4m 32s', icon: 'timer-outline', color: Colors.warningOrange },
];

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => logout(), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.responsiveWrapper}>

          <View style={styles.headerBar}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation?.navigate('Mapa')}
            >
              <MaterialCommunityIcons name="home" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <MaterialCommunityIcons name="logout" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <MaterialCommunityIcons name="shield-star" size={48} color={Colors.primary} />
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>{user?.rol || 'ADMINISTRADOR'}</Text>
              </View>
            </View>
            <Text style={styles.userName}>Jefatura Central</Text>
            <Text style={styles.userRole}>Comando Operativo - Cuartel 1</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Métricas del Cuartel</Text>
            <View style={styles.statsGrid}>
              {STATS.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <View style={[styles.statIconBox, { backgroundColor: `${stat.color}15` }]}>
                    <MaterialCommunityIcons name={stat.icon} size={24} color={stat.color} />
                  </View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gestión Administrativa</Text>

            <TouchableOpacity
              style={styles.adminMenuCard}
              onPress={() => navigation.navigate('AddFirefighter')}
            >
              <View style={[styles.adminMenuIcon, { backgroundColor: '#e0e7ff' }]}>
                <MaterialCommunityIcons name="account-cog" size={24} color="#4338ca" />
              </View>
              <View style={styles.adminMenuContent}>
                <Text style={styles.adminMenuTitle}>Gestión de Usuarios</Text>
                <Text style={styles.adminMenuSubtitle}>Agregar, editar o suspender bomberos</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.adminMenuCard}>
              <View style={[styles.adminMenuIcon, { backgroundColor: '#fce7f3' }]}>
                <MaterialCommunityIcons name="fire-truck" size={24} color="#be185d" />
              </View>
              <View style={styles.adminMenuContent}>
                <Text style={styles.adminMenuTitle}>Flota Vehicular</Text>
                <Text style={styles.adminMenuSubtitle}>Mantenimiento y estado de unidades</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.adminMenuCard}>
              <View style={[styles.adminMenuIcon, { backgroundColor: '#dcfce7' }]}>
                <MaterialCommunityIcons name="file-document-multiple" size={24} color="#15803d" />
              </View>
              <View style={styles.adminMenuContent}>
                <Text style={styles.adminMenuTitle}>Reportes Oficiales</Text>
                <Text style={styles.adminMenuSubtitle}>Exportar actas e informes mensuales</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.adminMenuCard}>
              <View style={[styles.adminMenuIcon, { backgroundColor: '#f3f4f6' }]}>
                <MaterialCommunityIcons name="cog" size={24} color="#4b5563" />
              </View>
              <View style={styles.adminMenuContent}>
                <Text style={styles.adminMenuTitle}>Configuración del Sistema</Text>
                <Text style={styles.adminMenuSubtitle}>Parámetros de alertas y notificaciones</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  responsiveWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#263238',
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 },
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }
    })
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 6 },
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.1)' }
    })
  },
  adminBadge: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  adminBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  userRole: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }
    })
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  adminMenuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }
    })
  },
  adminMenuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  adminMenuContent: {
    flex: 1,
  },
  adminMenuTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  adminMenuSubtitle: {
    fontSize: 13,
    color: '#64748b',
  }
});