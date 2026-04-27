import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminRoutesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const confirmLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => navigation.replace('Login'), style: 'destructive' }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
           <Image source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }} style={styles.avatarTop} />
           <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MainApp')}>
            <MaterialCommunityIcons name="monitor-dashboard" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={confirmLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Text style={styles.subtitle}>MÓDULO DE DESPLIEGUE</Text>
        <Text style={styles.mainTitle}>TRAZADO DE RUTAS</Text>

        {/* Importar Inteligencia Box */}
        <View style={styles.importBox}>
          <View style={styles.importLeftBorder} />
          <Text style={styles.sectionLabel}>IMPORTAR INTELIGENCIA</Text>
          <View style={styles.importBtnsRow}>
            <TouchableOpacity style={styles.importBtn}>
               <MaterialCommunityIcons name="file-upload" size={24} color="#fca5a5" style={{ marginBottom: 8 }} />
               <Text style={styles.importBtnText}>KML / KMZ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.importBtn}>
               <MaterialCommunityIcons name="vector-line" size={24} color="#93c5fd" style={{ marginBottom: 8 }} />
               <Text style={styles.importBtnText}>DIBUJO MANUAL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Rutas Guardadas Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RUTAS GUARDADAS</Text>
          <View style={styles.badgeDark}>
            <Text style={styles.badgeTextDark}>8 ACTIVAS</Text>
          </View>
        </View>

        {/* Route 1 */}
        <View style={styles.routeCard}>
          <View style={styles.routeLeftBorderRed} />
          <View style={styles.routeInfo}>
            <View style={styles.routeHeaderRow}>
              <Text style={styles.routeName}>SECTOR 7 - CAÑÓN NORTE</Text>
              <MaterialCommunityIcons name="eye" size={20} color="#fca5a5" />
            </View>
            <Text style={styles.routeDetails}>DIFICULTAD: ALTA | 4.2 KM</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tagRed}>
                <Text style={styles.tagTextWhite}>ZONA 4</Text>
              </View>
              <View style={styles.tagBlue}>
                <Text style={styles.tagTextBlue}>ACCESO FORESTAL</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route 2 */}
        <View style={styles.routeCard}>
          <View style={styles.routeLeftBorderBlue} />
          <View style={styles.routeInfo}>
            <View style={styles.routeHeaderRow}>
              <Text style={styles.routeName}>RUTA EVACUACIÓN A-12</Text>
              <MaterialCommunityIcons name="eye" size={20} color="#fca5a5" />
            </View>
            <Text style={styles.routeDetails}>DIFICULTAD: MEDIA | 12.5 KM</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tagGray}>
                <Text style={styles.tagTextWhite}>SECTOR 7</Text>
              </View>
              <View style={styles.tagBlue}>
                <Text style={styles.tagTextBlue}>LOGÍSTICA</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route 3 */}
        <View style={styles.routeCard}>
          <View style={styles.routeLeftBorderGray} />
          <View style={styles.routeInfo}>
            <View style={styles.routeHeaderRow}>
              <Text style={styles.routeNameGray}>PERÍMETRO ZONA CERO</Text>
              <MaterialCommunityIcons name="lock" size={20} color="#64748b" />
            </View>
            <Text style={styles.routeDetailsGray}>DIFICULTAD: CRÍTICA | 1.8 KM</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tagRed}>
                <Text style={styles.tagTextWhite}>ZONA 4</Text>
              </View>
              <View style={styles.tagGray}>
                <Text style={styles.tagTextGray}>INCENDIO ACTIVO</Text>
              </View>
            </View>
          </View>
        </View>

        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop' }} 
          style={styles.mapPreview} 
        />

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16181d',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1c23',
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarTop: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  topBarTitle: {
    color: '#e11d48',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 24,
  },
  subtitle: {
    fontSize: 10,
    color: '#fca5a5',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    marginBottom: 24,
  },
  importBox: {
    backgroundColor: '#1b1d24',
    borderRadius: 8,
    padding: 20,
    marginBottom: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  importLeftBorder: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#fca5a5',
  },
  sectionLabel: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  importBtnsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  importBtn: {
    flex: 1,
    backgroundColor: '#26282f',
    borderRadius: 6,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  importBtnText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeDark: {
    backgroundColor: '#26282f',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeTextDark: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  routeCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  routeLeftBorderRed: {
    width: 4,
    backgroundColor: '#fca5a5',
  },
  routeLeftBorderBlue: {
    width: 4,
    backgroundColor: '#3b82f6',
  },
  routeLeftBorderGray: {
    width: 4,
    backgroundColor: '#fca5a5',
    opacity: 0.3,
  },
  routeInfo: {
    flex: 1,
    padding: 16,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
  },
  routeNameGray: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '800',
  },
  routeDetails: {
    color: '#94a3b8',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  routeDetailsGray: {
    color: '#64748b',
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tagRed: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagBlue: {
    backgroundColor: '#1e3a8a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagGray: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagTextWhite: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagTextBlue: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tagTextGray: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mapPreview: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginTop: 24,
    opacity: 0.3,
  }
});
