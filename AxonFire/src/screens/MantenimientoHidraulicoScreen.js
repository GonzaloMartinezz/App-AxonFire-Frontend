import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles } from '../styles/MantenimientoHidraulicoScreenStyles';

export default function MantenimientoHidraulicoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [herramientas, setHerramientas] = useState([]);
  const [cargandoHerramientas, setCargandoHerramientas] = useState(true);
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // Estados del formulario
  const [nivelAceite, setNivelAceite] = useState(null);
  const [estadoMangueras, setEstadoMangueras] = useState(null);
  const [presionTrabajo, setPresionTrabajo] = useState(null);
  const [estadoLimpieza, setEstadoLimpieza] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarHerramientas();
  }, []);

  const cargarHerramientas = async () => {
    setCargandoHerramientas(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/herramientas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = Array.isArray(res.data) ? res.data : [];
      // Filtrar por herramientas hidráulicas/Holmatro/de rescate pesado
      const filtradas = data.filter(h => {
        const nombre = (h.nombre_herramienta || '').toLowerCase();
        return (
          nombre.includes('hidraul') ||
          nombre.includes('hidrául') ||
          nombre.includes('holmatro') ||
          nombre.includes('cizalla') ||
          nombre.includes('separador') ||
          nombre.includes('expansor') ||
          nombre.includes('ram') ||
          nombre.includes('bomba motriz')
        );
      });
      setHerramientas(filtradas);
    } catch (err) {
      console.error('Error cargando herramientas:', err);
      Alert.alert('Error', 'No se pudieron cargar las herramientas del cuartel.');
    } finally {
      setCargandoHerramientas(false);
    }
  };

  const guardarMantenimiento = async () => {
    if (!herramientaSeleccionada) {
      Alert.alert('Atención', 'Debe seleccionar una herramienta hidráulica.');
      return;
    }
    if (!nivelAceite || !estadoMangueras || !presionTrabajo || !estadoLimpieza) {
      Alert.alert('Atención', 'Por favor complete todos los campos de control.');
      return;
    }

    setGuardando(true);
    try {
      const body = {
        herramientaId: herramientaSeleccionada.id,
        nivel_aceite: nivelAceite,
        estado_mangueras: estadoMangueras,
        presion_trabajo: presionTrabajo,
        estado_limpieza: estadoLimpieza,
        observaciones: observaciones.trim() || undefined
      };

      await axios.post(`${API_BASE_URL}/mantenimiento_herramientas/guardar`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('✅ Éxito', 'El registro de mantenimiento se guardó correctamente.', [
        {
          text: 'Aceptar',
          onPress: () => {
            setHerramientaSeleccionada(null);
            setNivelAceite(null);
            setEstadoMangueras(null);
            setPresionTrabajo(null);
            setEstadoLimpieza(null);
            setObservaciones('');
            navigation.goBack();
          }
        }
      ]);
    } catch (err) {
      console.error('Error al guardar mantenimiento:', err);
      Alert.alert('Error', 'No se pudo guardar el registro de mantenimiento.');
    } finally {
      setGuardando(false);
    }
  };

  const renderStatusButton = (currentValue, valueToMatch, setter, activeStyle, activeTextStyle, displayLabel) => {
    const isActive = currentValue === valueToMatch;
    return (
      <TouchableOpacity
        style={[styles.statusButton, isActive && activeStyle]}
        onPress={() => setter(valueToMatch)}
      >
        <Text style={[styles.statusButtonText, isActive && activeTextStyle]}>
          {displayLabel || valueToMatch}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>MANTENIMIENTO HERRAMIENTAS</Text>
        </View>
        <TouchableOpacity onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {cargandoHerramientas ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '700' }}>
                Cargando herramientas hidráulicas...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContainer}>
                {/* Selector de Herramienta */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Herramienta Hidráulica</Text>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    onPress={() => setShowPicker(!showPicker)}
                  >
                    <Text style={styles.dropdownValue}>
                      {herramientaSeleccionada
                        ? herramientaSeleccionada.nombre_herramienta?.toUpperCase()
                        : 'SELECCIONAR HERRAMIENTA...'}
                    </Text>
                    <MaterialCommunityIcons
                      name={showPicker ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#a1a1aa"
                    />
                  </TouchableOpacity>
                </View>

                {showPicker && (
                  <View style={styles.pickerContainer}>
                    {herramientas.length === 0 ? (
                      <View style={{ padding: 16, alignItems: 'center' }}>
                        <Text style={{ color: '#64748b', fontSize: 13 }}>No hay herramientas hidráulicas cargadas</Text>
                      </View>
                    ) : (
                      herramientas.map((herramienta) => (
                        <TouchableOpacity
                          key={herramienta.id}
                          style={styles.pickerOption}
                          onPress={() => {
                            setHerramientaSeleccionada(herramienta);
                            setShowPicker(false);
                          }}
                        >
                          <MaterialCommunityIcons name="wrench" size={16} color="#e11d48" />
                          <Text style={styles.pickerOptionText}>
                            {herramienta.nombre_herramienta?.toUpperCase()}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </View>
                )}

                {/* Formulario de Mantenimiento */}
                {herramientaSeleccionada && (
                  <View style={{ marginTop: 10 }}>
                    {/* Nivel de Aceite */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>NIVEL DE ACEITE HIDRÁULICO</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(nivelAceite, 'OK', setNivelAceite, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(nivelAceite, 'BAJO', setNivelAceite, styles.statusBajoActive, styles.statusBajoActiveText)}
                        {renderStatusButton(nivelAceite, 'CRITICO', setNivelAceite, styles.statusCriticoActive, styles.statusCriticoActiveText)}
                      </View>
                    </View>

                    {/* Estado de Mangueras */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>MANGUERAS Y ACOPLES</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(estadoMangueras, 'OK', setEstadoMangueras, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(estadoMangueras, 'DANADO', setEstadoMangueras, styles.statusCriticoActive, styles.statusCriticoActiveText, 'DAÑADO')}
                      </View>
                    </View>

                    {/* Presión de Trabajo */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>PRESIÓN DE TRABAJO (OPERATIVA)</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(presionTrabajo, 'OK', setPresionTrabajo, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(presionTrabajo, 'DESVIACION', setPresionTrabajo, styles.statusBajoActive, styles.statusBajoActiveText, 'DESVIACIÓN')}
                      </View>
                    </View>

                    {/* Estado de Limpieza */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>LIMPIEZA Y FILTRACIÓN</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(estadoLimpieza, 'OK', setEstadoLimpieza, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(estadoLimpieza, 'REQUIERE_LIMPIEZA', setEstadoLimpieza, styles.statusBajoActive, styles.statusBajoActiveText, 'REQUERIDA')}
                      </View>
                    </View>

                    {/* Observaciones */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Observaciones / Novedades</Text>
                      <View style={styles.inputWrapperMultiline}>
                        <TextInput
                          style={styles.inputMultiline}
                          placeholder="Describa fallas mecánicas, fugas o estado general..."
                          placeholderTextColor="#52525b"
                          value={observaciones}
                          onChangeText={setObservaciones}
                          multiline
                          numberOfLines={3}
                        />
                      </View>
                    </View>

                    {/* Botón Guardar */}
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={guardarMantenimiento}
                      disabled={guardando}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#dc2626', '#b91c1c']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientButton}
                      >
                        {guardando ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="content-save-check" size={20} color="#fff" />
                            <Text style={styles.submitButtonText}>REGISTRAR MANTENIMIENTO</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
