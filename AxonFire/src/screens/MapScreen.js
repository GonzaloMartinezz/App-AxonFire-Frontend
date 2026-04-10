import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';

export default function MapScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Full-screen Map Background ── */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#c8d6c5', '#a8b8a5', '#788c75', '#5a7055']}
          style={StyleSheet.absoluteFill}
        >
          {/* Grid lines — use % so they scale to any screen */}
          {[...Array(8)].map((_, i) => (
            <View
              key={`h-${i}`}
              style={[styles.gridLine, { top: `${(i + 1) * 12}%`, left: 0, right: 0, height: 1 }]}
            />
          ))}
          {[...Array(5)].map((_, i) => (
            <View
              key={`v-${i}`}
              style={[styles.gridLine, { left: `${(i + 1) * 18}%`, top: 0, bottom: 0, width: 1 }]}
            />
          ))}

          {/* Fire perimeter (dashed) */}
          <View style={styles.perimeterLine} />

          {/* Fire front label */}
          <View style={styles.fireMarker}>
            <MaterialCommunityIcons name="fire" size={16} color="#fff" />
            <Text style={styles.fireMarkerText}>FRENTE DE FUEGO</Text>
          </View>

          {/* Water point markers */}
          <View style={[styles.mapPin, { top: '58%', left: '30%' }]}>
            <MaterialCommunityIcons name="water" size={14} color={Colors.alertBlue} />
          </View>
          <View style={[styles.mapPin, { top: '48%', right: '22%' }]}>
            <MaterialCommunityIcons name="water" size={14} color={Colors.alertBlue} />
          </View>

          {/* Responder marker */}
          <View style={[styles.mapPinOrange, { top: '40%', left: '60%' }]}>
            <MaterialCommunityIcons name="account-hard-hat" size={14} color={Colors.tertiary} />
          </View>
        </LinearGradient>
      </View>

      {/* ── Top Overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="fire-extinguisher" size={16} color={Colors.primary} />
            </View>
            <Text style={styles.headerTitle}>AXON FIRE</Text>
          </View>
          <TouchableOpacity style={styles.emergencyIcon}>
            <MaterialCommunityIcons name="asterisk" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Mission Status Card */}
        <View style={styles.missionCard}>
          <View style={styles.missionLeft}>
            <Text style={styles.missionLabel}>ESTADO DE MISIÓN</Text>
            <View style={styles.missionStatusRow}>
              <View style={styles.statusDotRed} />
              <Text style={styles.missionStatus}>INCIDENTE EN{'\n'}PROGRESO</Text>
            </View>
          </View>
          <View style={styles.missionDivider} />
          <View style={styles.missionRight}>
            <Text style={styles.missionLabel}>RESPONDIENDO</Text>
            <Text style={styles.respondersCount}>12 UNIDADES</Text>
            <Text style={styles.respondersStatus}>ACTIVAS</Text>
          </View>
          <View style={styles.avatarStack}>
            <View style={[styles.miniAvatar, { backgroundColor: Colors.warningOrange }]}>
              <MaterialCommunityIcons name="account" size={12} color="#fff" />
            </View>
            <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.secondary }]}>
              <MaterialCommunityIcons name="account" size={12} color="#fff" />
            </View>
            <View style={[styles.miniAvatar, { marginLeft: -8, backgroundColor: Colors.primary }]}>
              <Text style={styles.avatarCount}>+10</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── Map Controls (right side) ── */}
      <View style={[styles.mapControls, { bottom: 120 }]}>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialCommunityIcons name="layers-outline" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialIcons name="my-location" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialCommunityIcons name="plus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn}>
          <MaterialCommunityIcons name="minus" size={20} color={Colors.onSurface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5a7055',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  perimeterLine: {
    position: 'absolute',
    top: '28%',
    left: '12%',
    width: '76%',
    height: '30%',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 40,
    opacity: 0.45,
  },
  fireMarker: {
    position: 'absolute',
    top: '38%',
    left: '18%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    gap: 5,
    boxShadow: '0px 4px 12px rgba(175,16,26,0.4)',
    elevation: 6,
  },
  fireMarkerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mapPin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
    elevation: 4,
  },
  mapPinOrange: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.tertiaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
    elevation: 4,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#fff',
    textTransform: 'uppercase',
    textShadow: '0px 1px 4px rgba(0,0,0,0.3)',
  },
  emergencyIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38,50,56,0.9)',
    borderRadius: Radius.xxl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  missionLeft: {
    flex: 1,
  },
  missionLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  missionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDotRed: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  missionStatus: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  missionDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: Spacing.sm,
  },
  missionRight: {
    alignItems: 'flex-start',
  },
  respondersCount: {
    fontSize: 12,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.2,
  },
  respondersStatus: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.5,
  },
  avatarStack: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(38,50,56,0.9)',
  },
  avatarCount: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
  },
  mapControls: {
    position: 'absolute',
    right: Spacing.lg,
    gap: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  controlBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
