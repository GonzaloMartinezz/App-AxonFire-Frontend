import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
  TextInput,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PERSONNEL = [
  {
    id: '1',
    rank: 'CAPITÁN',
    unit: 'UNIDAD ALFA-1',
    name: 'CARLOS MENDOZA',
    status: 'ACTIVO',
    timeRest: '12H REST.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    rank: 'SARGENTO',
    unit: 'UNIDAD BRAVO-2',
    name: 'DAVID ORTIZ',
    status: 'ACTIVO',
    timeRest: '04H REST.',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    id: '3',
    rank: 'BOMBERO',
    unit: 'RESCATE X',
    name: 'ELENA RÍOS',
    status: 'LIBRE',
    timeRest: '48H OFF',
    isFree: true,
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: '4',
    rank: 'BOMBERO',
    unit: 'UNIDAD ALFA-1',
    name: 'ANA GARCÍA',
    status: 'ACTIVO',
    timeRest: '08H REST.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    id: '5',
    rank: 'SARGENTO',
    unit: 'RESCATE-X',
    name: 'JULIÁN SOTO',
    status: 'ACTIVO',
    timeRest: '02H REST.',
    avatar: 'https://randomuser.me/api/portraits/men/46.jpg'
  },
  {
    id: '6',
    rank: 'CAPITÁN',
    unit: 'UNIDAD BRAVO-2',
    name: 'MARCO POLO',
    status: 'ACTIVO',
    timeRest: '10H REST.',
    avatar: 'https://randomuser.me/api/portraits/men/90.jpg'
  }
];

export default function AdminPersonnelScreen({ navigation }) {
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
        <Text style={styles.mainTitle}>GESTIÓN DE{'\n'}PERSONAL</Text>
        <Text style={styles.subtitle}>PANEL DE CONTROL ADMINISTRATIVO /{'\n'}SECTOR 7G</Text>

        <TouchableOpacity style={styles.actionBtn}>
          <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>ALTA DE PERSONAL</Text>
        </TouchableOpacity>

        {/* Filters Box */}
        <View style={styles.filtersBox}>
          <View style={styles.searchRow}>
            <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput}
              placeholder="BUSCAR BOMBERO O UNIDAD"
              placeholderTextColor="#64748b"
            />
          </View>
          <TouchableOpacity style={styles.dropdownRow}>
            <Text style={styles.dropdownText}>TODOS LOS RANGOS</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dropdownRow}>
            <Text style={styles.dropdownText}>TODAS LAS UNIDADES</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Personnel List */}
        {PERSONNEL.map((person) => (
          <View key={person.id} style={styles.personCard}>
            <View style={styles.cardLeftBorder} />
            <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
            
            <View style={styles.personDetails}>
              <View style={styles.rankUnitRow}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{person.rank}</Text>
                </View>
                <Text style={styles.unitText}>{person.unit}</Text>
              </View>
              <Text style={styles.personName}>{person.name}</Text>
              <View style={styles.statusRow}>
                <MaterialCommunityIcons 
                  name={person.isFree ? "close-circle" : "check-circle"} 
                  size={12} 
                  color={person.isFree ? "#fca5a5" : "#38bdf8"} 
                />
                <Text style={[styles.statusText, { color: person.isFree ? "#fca5a5" : "#38bdf8" }]}>
                  {person.status}
                </Text>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#f8fafc" style={{ marginLeft: 12 }} />
                <Text style={styles.timeText}>{person.timeRest}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.moreBtn}>
              <MaterialCommunityIcons name="dots-vertical" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Pagination Info */}
        <View style={styles.paginationRow}>
          <Text style={styles.paginationText}>MOSTRANDO 6 DE 48{'\n'}EFECTIVOS</Text>
          <View style={styles.paginationControls}>
             <Text style={styles.pageBtnText}>ANTERIOR</Text>
             <Text style={styles.pageCurrentText}>01</Text>
             <Text style={styles.pageBtnText}>SIGUIENTE</Text>
          </View>
        </View>

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
  mainTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -1,
    lineHeight: 34,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 10,
    color: '#f8fafc',
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 24,
    lineHeight: 16,
  },
  actionBtn: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    gap: 8,
    marginBottom: 32,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  filtersBox: {
    backgroundColor: '#1b1d24',
    padding: 20,
    borderRadius: 8,
    marginBottom: 32,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 12,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#26282f',
    borderRadius: 4,
    height: 40,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  dropdownText: {
    color: '#cbd5e1',
    fontSize: 11,
    letterSpacing: 1,
  },
  personCard: {
    flexDirection: 'row',
    backgroundColor: '#1b1d24',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
    alignItems: 'center',
    paddingRight: 16,
  },
  cardLeftBorder: {
    width: 4,
    height: '100%',
    backgroundColor: '#fca5a5',
  },
  personAvatar: {
    width: 60,
    height: 60,
    borderRadius: 4,
    margin: 16,
  },
  personDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  rankUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rankBadge: {
    backgroundColor: '#fca5a5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: 8,
  },
  rankText: {
    color: '#451a1a',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unitText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  personName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  timeText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
    marginLeft: 4,
  },
  moreBtn: {
    padding: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  paginationText: {
    color: '#94a3b8',
    fontSize: 10,
    letterSpacing: 1,
    lineHeight: 14,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pageBtnText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  pageCurrentText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '700',
  }
});
