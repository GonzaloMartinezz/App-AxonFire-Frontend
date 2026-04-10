import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';

const EMERGENCY_TYPES = [
  { id: 'incendio', icon: 'fire', label: 'Incendio' },
  { id: 'rescate', icon: 'car-wrench', label: 'Rescate' },
  { id: 'peligroso', icon: 'hazard-lights', label: 'Peligroso' },
  { id: 'medica', icon: 'medical-bag', label: 'Médica' },
  { id: 'estructural', icon: 'office-building', label: 'Estructural' },
  { id: 'otro', icon: 'alert-outline', label: 'Otro' },
];

const SEVERITY_LEVELS = ['Crítica', 'Alta', 'Media', 'Baja'];

export default function NewAlertScreen() {
  const [selectedType, setSelectedType] = useState('incendio');
  const [selectedSeverity, setSelectedSeverity] = useState('Alta');
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuBtn}>
            <MaterialCommunityIcons name="menu" size={20} color={Colors.onSurface} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Nueva Alerta</Text>
            <Text style={styles.headerSubtitle}>Reportar emergencia</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Emergency Type ── */}
        <Text style={styles.fieldLabel}>Tipo de Emergencia</Text>
        <View style={styles.typeGrid}>
          {EMERGENCY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeCard, selectedType === type.id && styles.typeCardActive]}
              onPress={() => setSelectedType(type.id)}
            >
              <MaterialCommunityIcons
                name={type.icon}
                size={22}
                color={selectedType === type.id ? Colors.primary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.typeLabel, selectedType === type.id && styles.typeLabelActive]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Severity ── */}
        <Text style={styles.fieldLabel}>Severidad</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.severityRow}>
            {SEVERITY_LEVELS.map((lvl) => (
              <TouchableOpacity
                key={lvl}
                style={[styles.severityPill, selectedSeverity === lvl && styles.severityPillActive]}
                onPress={() => setSelectedSeverity(lvl)}
              >
                <Text style={[styles.severityText, selectedSeverity === lvl && styles.severityTextActive]}>
                  {lvl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* ── Title Input ── */}
        <Text style={styles.fieldLabel}>
          Título <Text style={{ color: Colors.primary }}>*</Text>
        </Text>
        <View style={styles.inputField}>
          <Text style={styles.placeholder}>Describe la emergencia...</Text>
        </View>

        {/* ── Description ── */}
        <Text style={styles.fieldLabel}>Descripción</Text>
        <View style={[styles.inputField, styles.textArea]}>
          <Text style={styles.placeholder}>Detalles adicionales...</Text>
        </View>

        {/* ── Location ── */}
        <Text style={styles.fieldLabel}>Ubicación</Text>
        <TacticalCard elevated>
          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <MaterialIcons name="my-location" size={18} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationTitle}>Usar ubicación actual</Text>
              <Text style={styles.locationSub}>GPS activado · Precisión alta</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color={Colors.onSurfaceVariant} />
          </View>
        </TacticalCard>

        <View style={styles.coordRow}>
          <View style={[styles.coordField, { marginRight: 6 }]}>
            <Text style={styles.coordLabel}>Latitud</Text>
            <Text style={styles.coordValue}>-26.8241</Text>
          </View>
          <View style={styles.coordField}>
            <Text style={styles.coordLabel}>Longitud</Text>
            <Text style={styles.coordValue}>-65.2226</Text>
          </View>
        </View>

        {/* ── Submit Button ── */}
        <TouchableOpacity style={{ marginTop: Spacing.xl }}>
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitBtn}
          >
            <MaterialCommunityIcons name="alert-plus" size={20} color="#fff" />
            <Text style={styles.submitText}>ENVIAR ALERTA</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.15,
    color: Colors.onSurface,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.onSurfaceVariant,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '31%',
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  typeCardActive: {
    backgroundColor: Colors.primaryFixed,
  },
  typeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.onSurfaceVariant,
  },
  typeLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  severityPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: Colors.surfaceContainerLow,
  },
  severityPillActive: {
    backgroundColor: Colors.primary,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.onSurfaceVariant,
  },
  severityTextActive: {
    color: '#fff',
  },
  inputField: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 46,
    justifyContent: 'center',
  },
  textArea: {
    minHeight: 80,
    justifyContent: 'flex-start',
    paddingTop: Spacing.md,
  },
  placeholder: {
    fontSize: 13,
    color: Colors.onSurfaceVariant,
    opacity: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.onSurface,
  },
  locationSub: {
    fontSize: 11,
    color: Colors.onSurfaceVariant,
    marginTop: 1,
  },
  coordRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
  },
  coordField: {
    flex: 1,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  coordLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.onSurfaceVariant,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  coordValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.onSurface,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: Radius.xl,
    boxShadow: '0px 6px 16px rgba(175,16,26,0.3)',
    elevation: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
