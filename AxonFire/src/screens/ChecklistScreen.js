import React, { useState } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  Platform,
  Switch
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChecklistScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // State for items
  const [hidrico, setHidrico] = useState({
    manguera: null, // null, 'ok', 'fail'
    piton: 'ok'
  });

  const [corte, setCorte] = useState({
    hidraulica: 'ok', // 'ok', 'repare', 'fail', null
    motosierra: 'repare',
    hacha: null
  });

  const [epp, setEpp] = useState({
    era: true,
    cascos: false
  });

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />
      
      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <MaterialCommunityIcons name="shield-half-full" size={20} color="#dc2626" />
          <Text style={styles.topBarTitle}>TACTICAL VANGUARD</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
             <MaterialCommunityIcons name="account-tie" size={20} color="#fff" />
        </View>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Title Section */}
          <View style={styles.headerTitleBox}>
            <Text style={styles.mainTitle}>
              <Text style={{ color: '#fff' }}>MÓVIL 12 - </Text>
              <Text style={{ color: '#dc2626' }}>CHECKLIST DIARIO</Text>
            </Text>
            
            <View style={styles.dateRow}>
              <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>24 OCT 2023</Text>
              <Text style={styles.dateDot}>•</Text>
              <MaterialCommunityIcons name="clock-outline" size={12} color="#94a3b8" />
              <Text style={styles.dateText}>08:00 HRS</Text>
            </View>
          </View>

          {/* Section: HÍDRICO */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>HÍDRICO</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.cardItem}>
             <View style={styles.cardItemLeft}>
               <Text style={styles.itemTitle}>MANGUERA 45MM X 20M</Text>
               <Text style={styles.itemSubtitle}>Cantidad requerida: 6 unidades</Text>
             </View>
             <View style={styles.actionButtons}>
               <TouchableOpacity 
                 style={[styles.iconButton, hidrico.manguera === 'ok' && styles.iconButtonActive]}
                 onPress={() => setHidrico({...hidrico, manguera: 'ok'})}
               >
                 <MaterialCommunityIcons name="check" size={18} color={hidrico.manguera === 'ok' ? '#fff' : '#e2e8f0'} />
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.iconButton, hidrico.manguera === 'fail' && styles.iconButtonFail]}
                 onPress={() => setHidrico({...hidrico, manguera: 'fail'})}
               >
                 <MaterialCommunityIcons name="close" size={18} color={hidrico.manguera === 'fail' ? '#fff' : '#e2e8f0'} />
               </TouchableOpacity>
             </View>
          </View>

          <View style={[styles.cardItem, { borderLeftColor: '#22c55e' }]}>
             <View style={styles.cardItemLeft}>
               <Text style={styles.itemTitle}>PITÓN DE CORTINA</Text>
               <Text style={styles.itemSubtitle}>Revisión de sellos y acople</Text>
             </View>
             <View style={styles.actionButtons}>
               <TouchableOpacity 
                 style={[styles.iconButton, hidrico.piton === 'ok' && styles.iconButtonActive]}
                 onPress={() => setHidrico({...hidrico, piton: 'ok'})}
               >
                 <MaterialCommunityIcons name="check" size={18} color={hidrico.piton === 'ok' ? '#fff' : '#e2e8f0'} />
               </TouchableOpacity>
               <TouchableOpacity 
                 style={[styles.iconButton, hidrico.piton === 'fail' && styles.iconButtonFail]}
                 onPress={() => setHidrico({...hidrico, piton: 'fail'})}
               >
                 <MaterialCommunityIcons name="close" size={18} color={hidrico.piton === 'fail' ? '#fff' : '#e2e8f0'} />
               </TouchableOpacity>
             </View>
          </View>

          {/* Section: CORTE */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CORTE</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.largeCardItem}>
            <View style={styles.largeCardTop}>
              <MaterialCommunityIcons name="car-wrench" size={24} color="#94a3b8" />
              <View style={[styles.badge, { backgroundColor: '#1e3a8a' }]}>
                <Text style={styles.badgeText}>READY</Text>
              </View>
            </View>
            <Text style={styles.largeCardTitle}>HERRAMIENTA HIDRÁULICA</Text>
            <View style={styles.largeCardActions}>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.hidraulica === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, hidraulica: 'ok'})}
              >
                <Text style={styles.fullBtnText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.hidraulica === 'fail' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, hidraulica: 'fail'})}
              >
                <Text style={styles.fullBtnText}>FAIL</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.largeCardItem}>
            <View style={styles.largeCardTop}>
              <MaterialCommunityIcons name="axe" size={24} color="#fca5a5" />
              <View style={[styles.badge, { backgroundColor: '#451a1a' }]}>
                <Text style={[styles.badgeText, { color: '#fca5a5' }]}>DAMAGED</Text>
              </View>
            </View>
            <Text style={styles.largeCardTitle}>MOTOSIERRA STIHL</Text>
            <View style={styles.largeCardActions}>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.motosierra === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, motosierra: 'ok'})}
              >
                <Text style={styles.fullBtnText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.motosierra === 'repare' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, motosierra: 'repare'})}
              >
                <Text style={styles.fullBtnText}>REPARE</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.largeCardItem}>
            <View style={styles.largeCardTop}>
              <MaterialCommunityIcons name="hammer" size={24} color="#fca5a5" />
              <View style={[styles.badge, { backgroundColor: '#334155' }]}>
                <Text style={styles.badgeText}>PENDING</Text>
              </View>
            </View>
            <Text style={styles.largeCardTitle}>HACHA DE BOMBERO</Text>
            <View style={styles.largeCardActions}>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.hacha === 'ok' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, hacha: 'ok'})}
              >
                <Text style={styles.fullBtnText}>OK</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.fullBtn, corte.hacha === 'fail' ? styles.fullBtnRed : styles.fullBtnGray]}
                onPress={() => setCorte({...corte, hacha: 'fail'})}
              >
                <Text style={styles.fullBtnText}>FAIL</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section: EPP */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>EPP</Text>
            <View style={styles.sectionLine} />
          </View>

          <View style={styles.eppCard}>
            <View style={styles.eppIconBox}>
               <MaterialCommunityIcons name="diving-scuba-tank" size={20} color="#93c5fd" />
            </View>
            <View style={styles.eppContent}>
              <Text style={styles.eppTitle}>EQUIPO ERA{'\n'}(AUTÓNOMO)</Text>
            </View>
            <View style={styles.eppExtra}>
              <Text style={styles.eppExtraLabel}>PSI:</Text>
              <Text style={styles.eppExtraValue}>4500</Text>
            </View>
            <Switch
              trackColor={{ false: "#3f3f46", true: "#166534" }}
              thumbColor={epp.era ? "#22c55e" : "#a1a1aa"}
              ios_backgroundColor="#3f3f46"
              onValueChange={(val) => setEpp({...epp, era: val})}
              value={epp.era}
            />
          </View>

          <View style={styles.eppCard}>
            <View style={styles.eppIconBox}>
               <MaterialCommunityIcons name="hard-hat" size={20} color="#fca5a5" />
            </View>
            <View style={styles.eppContent}>
              <Text style={styles.eppTitle}>CASCOS DE{'\n'}RESCATE</Text>
            </View>
            <View style={styles.eppExtra}>
              <Text style={styles.eppExtraLabel}>Qty:</Text>
              <Text style={styles.eppExtraValue}>4/4</Text>
            </View>
            <Switch
              trackColor={{ false: "#3f3f46", true: "#166534" }}
              thumbColor={epp.cascos ? "#22c55e" : "#a1a1aa"}
              ios_backgroundColor="#3f3f46"
              onValueChange={(val) => setEpp({...epp, cascos: val})}
              value={epp.cascos}
            />
          </View>

          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>GUARDAR CHECKLIST</Text>
          </TouchableOpacity>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Fake Bottom Nav */}
      <View style={styles.fakeBottomNav}>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="fire" size={24} color="#64748b" />
          <Text style={styles.navLabel}>INCIDENTS</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="account-group" size={24} color="#64748b" />
          <Text style={styles.navLabel}>UNITS</Text>
        </View>
        <View style={styles.sosContainer}>
           <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
           <Text style={styles.sosLabel}>SOS</Text>
        </View>
        <View style={styles.navItem}>
          <MaterialCommunityIcons name="compass" size={24} color="#64748b" />
          <Text style={styles.navLabel}>MAP</Text>
        </View>
        <View style={styles.navItemActive}>
          <MaterialCommunityIcons name="clipboard-text" size={24} color="#dc2626" />
          <Text style={[styles.navLabel, { color: '#dc2626' }]}>LOGS</Text>
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
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 24,
  },
  headerTitleBox: {
    marginBottom: 32,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dateDot: {
    color: '#94a3b8',
    fontSize: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#26282f',
    marginLeft: 16,
  },
  cardItem: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626',
  },
  cardItemLeft: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#94a3b8',
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 4,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: '#22c55e',
  },
  iconButtonFail: {
    backgroundColor: '#dc2626',
  },
  largeCardItem: {
    backgroundColor: '#1b1d24',
    borderRadius: 4,
    padding: 16,
    marginBottom: 16,
  },
  largeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#93c5fd',
    fontSize: 9,
    fontWeight: '800',
  },
  largeCardTitle: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  largeCardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  fullBtn: {
    flex: 1,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullBtnGray: {
    backgroundColor: '#334155',
  },
  fullBtnRed: {
    backgroundColor: '#dc2626',
  },
  fullBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  eppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#26282f',
  },
  eppIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  eppContent: {
    flex: 1,
  },
  eppTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  eppExtra: {
    marginRight: 16,
    alignItems: 'flex-start',
  },
  eppExtraLabel: {
    color: '#64748b',
    fontSize: 10,
  },
  eppExtraValue: {
    color: '#93c5fd',
    fontSize: 10,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#dc2626',
    borderRadius: 4,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  fakeBottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
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
    paddingBottom: 6,
  },
  navItemActive: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
    paddingBottom: 6,
  },
  navLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sosContainer: {
    backgroundColor: '#ef4444',
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sosLabel: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  }
});
