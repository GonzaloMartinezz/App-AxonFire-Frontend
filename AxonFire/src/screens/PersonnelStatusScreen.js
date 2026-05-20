import React from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  Image,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CONFIRMADOS = [
  {
    id: '1',
    name: 'CAP. RODRÍGUEZ, M.',
    role: 'OFFICER / UNIT: ENGINE-42',
    status: 'EN CAMINO',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    name: 'TEN. SÁNCHEZ, E.',
    role: 'RESCUE / UNIT: LADDER-15',
    status: 'ESTACIÓN',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: '3',
    name: 'SGT. MARTÍNEZ, J.',
    role: 'PARAMEDIC / UNIT: AMB-09',
    status: 'ACTIVO',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    id: '4',
    name: 'CABO VILLA, L.',
    role: 'HAZMAT / UNIT: UNIT-04',
    status: 'EN CAMINO',
    avatar: 'https://randomuser.me/api/portraits/men/67.jpg'
  }
];

const AUSENTES = [
  {
    id: '5',
    name: 'SGT. LÓPEZ, D.',
    role: 'SUPPORT / LICENCIA',
    status: 'FUERA DE SERVICIO',
    avatar: 'https://randomuser.me/api/portraits/men/11.jpg'
  },
  {
    id: '6',
    name: 'CAP. TORRES, B.',
    role: 'OFFICER / VACACIONES',
    status: 'FUERA DE SERVICIO',
    avatar: 'https://randomuser.me/api/portraits/men/90.jpg'
  }
];

export default function PersonnelStatusScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <TouchableOpacity onPress={() => navigation?.navigate('MainApp')}>
          <MaterialCommunityIcons name="home" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>VANGUARD COMMAND</Text>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation?.goBack()}>
           <Image 
             source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }} 
             style={styles.avatarImg} 
           />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Title Section */}
          <View style={styles.headerTitleBox}>
            <View style={styles.titleLeftGroup}>
              <View style={styles.redBorder} />
              <View>
                <Text style={styles.subtitle}>TACTICAL PERSONNEL VIEW</Text>
                <Text style={styles.mainTitle}>ESTADO DE{'\n'}PERSONAL</Text>
              </View>
            </View>
            <View style={styles.availabilityBox}>
              <Text style={styles.availabilityLabel}>GLOBAL AVAILABILITY</Text>
              <Text style={styles.availabilityValue}>82%</Text>
            </View>
          </View>

          {/* Confirmados Section */}
          <View style={styles.sectionHeader}>
            <View style={[styles.statusLine, { backgroundColor: '#10b981' }]} />
            <Text style={styles.sectionTitle}>CONFIRMADOS</Text>
            <View style={[styles.badge, { backgroundColor: '#064e3b' }]}>
              <Text style={[styles.badgeText, { color: '#10b981' }]}>24 OPERATIVOS</Text>
            </View>
          </View>

          {CONFIRMADOS.map((person) => (
            <View key={person.id} style={[styles.personCard, { borderLeftColor: '#047857' }]}>
              <View style={styles.personInfoRow}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: person.avatar }} style={styles.personAvatar} />
                  <View style={styles.onlineDot} />
                </View>
                <View style={styles.personDetails}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRole}>{person.role}</Text>
                </View>
                <View style={styles.personStatusBox}>
                  <Text style={styles.statusLabel}>STATUS</Text>
                  <Text style={[styles.statusText, { color: '#10b981' }]}>{person.status}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Ausentes Section */}
          <View style={[styles.sectionHeader, { marginTop: 32 }]}>
            <View style={[styles.statusLine, { backgroundColor: '#dc2626' }]} />
            <Text style={styles.sectionTitle}>AUSENTES</Text>
            <View style={[styles.badge, { backgroundColor: '#451a1a' }]}>
              <Text style={[styles.badgeText, { color: '#fca5a5' }]}>06 NO DISPONIBLES</Text>
            </View>
          </View>

          {AUSENTES.map((person) => (
            <View key={person.id} style={[styles.personCard, { borderLeftColor: '#7f1d1d', opacity: 0.6 }]}>
              <View style={styles.personInfoRow}>
                <View style={styles.avatarContainer}>
                  <Image source={{ uri: person.avatar }} style={styles.personAvatar} tintColor="gray" />
                  <View style={styles.offlineCross}>
                    <MaterialCommunityIcons name="close" size={10} color="#94a3b8" />
                  </View>
                </View>
                <View style={styles.personDetails}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personRole}>{person.role}</Text>
                </View>
                <View style={styles.personStatusBox}>
                  <Text style={[styles.statusText, { color: '#dc2626', fontSize: 10, marginTop: 12 }]}>{person.status}</Text>
                </View>
              </View>
            </View>
          ))}

          {/* Command Summary Card */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>COMMAND SUMMARY</Text>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>RESPONSE TIME</Text>
                <Text style={styles.summaryValue}>4:20 <Text style={styles.summaryUnit}>min</Text></Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>ACTIVE ALERTS</Text>
                <Text style={styles.summaryValue}>03</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Fake Bottom Nav */}
      <View style={styles.fakeBottomNav}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#64748b" />
          <Text style={styles.navLabel}>INCIDENTS</Text>
        </View>
        <View style={[styles.navItemActiveContainer, { zIndex: 10 }]}>
          <View style={styles.navItemActiveBg}>
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
            <Text style={[styles.navLabel, { color: '#fff' }]}>PERSONNEL</Text>
          </View>
        </View>
        <View style={styles.sosContainer}>
           <MaterialCommunityIcons name="asterisk" size={28} color="#fff" />
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color="#64748b" />
          <Text style={styles.navLabel}>TRACKING</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="map" size={24} color="#64748b" />
          <Text style={styles.navLabel}>MAP</Text>
        </View>
      </View>
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
  topBarTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  avatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e11d48',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 24,
  },
  headerTitleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  titleLeftGroup: {
    flexDirection: 'row',
    flex: 1,
  },
  redBorder: {
    width: 3,
    backgroundColor: '#dc2626',
    marginRight: 12,
    marginTop: 4,
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
    color: '#fff',
    letterSpacing: -1,
    lineHeight: 34,
  },
  availabilityBox: {
    alignItems: 'flex-end',
  },
  availabilityLabel: {
    fontSize: 9,
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  availabilityValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fca5a5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLine: {
    width: 6,
    height: 18,
    borderRadius: 3,
    marginRight: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 2,
  },
  personInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  onlineDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#1b1d24',
  },
  offlineCross: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: '#1b1d24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personDetails: {
    flex: 1,
  },
  personName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  personRole: {
    color: '#94a3b8',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  personStatusBox: {
    alignItems: 'flex-end',
  },
  statusLabel: {
    color: '#fca5a5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryCard: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#26282f',
  },
  summaryTitle: {
    color: '#fca5a5',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    backgroundColor: '#16181d',
    padding: 16,
    borderRadius: 4,
    flex: 1,
    marginRight: 8,
  },
  summaryLabel: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  summaryUnit: {
    fontSize: 12,
    color: '#94a3b8',
  },
  fakeBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#16181d',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: '#26282f',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  navItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginTop: 8,
  },
  navItemActiveContainer: {
    alignItems: 'center',
    flex: 1.5,
  },
  navItemActiveBg: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: -20,
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 8px rgba(220, 38, 38, 0.4)',
      }
    })
  },
  navLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  sosContainer: {
    backgroundColor: '#dc2626',
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 6px rgba(220, 38, 38, 0.3)',
      }
    })
  }
});
