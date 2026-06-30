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
import { styles } from '../styles/ControlFluidosScreenStyles';

const FLUID_OPTIONS = ['OK', 'BAJO', 'CRITICO'];

export default function ControlFluidosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [camiones, setCamiones] = useState([]);
  const [cargandoCamiones, setCargandoCamiones] = useState(true);
  const [camionSeleccionado, setCamionSeleccionado] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  // Estados del formulario
  const [aceiteMotor, setAceiteMotor] = useState(null);
  const [refrigerante, setRefrigerante] = useState(null);
  const [frenos, setFrenos] = useState(null);
  const [direccion, setDireccion] = useState(null);
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarCamiones();
  }, []);

  const cargarCamiones = async () => {
    setCargandoCamiones(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/camiones/activos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCamiones(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error cargando camiones:', err);
      Alert.alert('Error', 'No se pudieron cargar los camiones de la flota.');
    } finally {
      setCargandoCamiones(false);
    }
  };

  const guardarControl = async () => {
    if (!camionSeleccionado) {
      Alert.alert('Atención', 'Debe seleccionar un móvil.');
      return;
    }
    if (!aceiteMotor || !refrigerante || !frenos || !direccion) {
      Alert.alert('Atención', 'Por favor complete todos los niveles de fluidos.');
      return;
    }

    setGuardando(true);
    try {
      const body = {
        camionId: camionSeleccionado.id,
        aceite_motor: aceiteMotor,
        liquido_refrigerante: refrigerante,
        liquido_frenos: frenos,
        liquido_direccion: direccion,
        observaciones: observaciones.trim() || undefined
      };

      await axios.post(`${API_BASE_URL}/control_fluidos/guardar`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('✅ Éxito', 'El control de fluidos se guardó correctamente.', [
        {
          text: 'Aceptar',
          onPress: () => {
            // Resetear el formulario
            setCamionSeleccionado(null);
            setAceiteMotor(null);
            setRefrigerante(null);
            setFrenos(null);
            setDireccion(null);
            setObservaciones('');
            navigation.goBack();
          }
        }
      ]);
    } catch (err) {
      console.error('Error al guardar control de fluidos:', err);
      Alert.alert('Error', 'No se pudo guardar el registro de fluidos en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  const renderStatusButton = (currentValue, valueToMatch, setter, activeStyle, activeTextStyle) => {
    const isActive = currentValue === valueToMatch;
    return (
      <TouchableOpacity
        style={[styles.statusButton, isActive && activeStyle]}
        onPress={() => setter(valueToMatch)}
      >
        <Text style={[styles.statusButtonText, isActive && activeTextStyle]}>
          {valueToMatch}
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
          <Text style={styles.topBarTitle}>CONTROL DE FLUIDOS</Text>
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
          {cargandoCamiones ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#dc2626" />
              <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '700' }}>
                Cargando móviles...
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.formContainer}>
                {/* Selector de Móvil */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Vehículo / Móvil</Text>
                  <TouchableOpacity
                    style={styles.dropdownWrapper}
                    onPress={() => setShowPicker(!showPicker)}
                  >
                    <Text style={styles.dropdownValue}>
                      {camionSeleccionado
                        ? camionSeleccionado.nombre_camion?.toUpperCase()
                        : 'SELECCIONAR MÓVIL...'}
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
                    {camiones.map((camion) => (
                      <TouchableOpacity
                        key={camion.id}
                        style={styles.pickerOption}
                        onPress={() => {
                          setCamionSeleccionado(camion);
                          setShowPicker(false);
                        }}
                      >
                        <MaterialCommunityIcons name="fire-truck" size={16} color="#e11d48" />
                        <Text style={styles.pickerOptionText}>
                          {camion.nombre_camion?.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Formulario de fluidos */}
                {camionSeleccionado && (
                  <View style={{ marginTop: 10 }}>
                    {/* Aceite de Motor */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>ACEITE DE MOTOR</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(aceiteMotor, 'OK', setAceiteMotor, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(aceiteMotor, 'BAJO', setAceiteMotor, styles.statusBajoActive, styles.statusBajoActiveText)}
                        {renderStatusButton(aceiteMotor, 'CRITICO', setAceiteMotor, styles.statusCriticoActive, styles.statusCriticoActiveText)}
                      </View>
                    </View>

                    {/* Líquido Refrigerante */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>LÍQUIDO REFRIGERANTE</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(refrigerante, 'OK', setRefrigerante, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(refrigerante, 'BAJO', setRefrigerante, styles.statusBajoActive, styles.statusBajoActiveText)}
                        {renderStatusButton(refrigerante, 'CRITICO', setRefrigerante, styles.statusCriticoActive, styles.statusCriticoActiveText)}
                      </View>
                    </View>

                    {/* Líquido de Frenos */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>LÍQUIDO DE FRENOS</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(frenos, 'OK', setFrenos, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(frenos, 'BAJO', setFrenos, styles.statusBajoActive, styles.statusBajoActiveText)}
                        {renderStatusButton(frenos, 'CRITICO', setFrenos, styles.statusCriticoActive, styles.statusCriticoActiveText)}
                      </View>
                    </View>

                    {/* Líquido de Dirección */}
                    <View style={styles.fluidSection}>
                      <Text style={styles.fluidLabel}>LÍQUIDO DE DIRECCIÓN</Text>
                      <View style={styles.statusRow}>
                        {renderStatusButton(direccion, 'OK', setDireccion, styles.statusOkActive, styles.statusOkActiveText)}
                        {renderStatusButton(direccion, 'BAJO', setDireccion, styles.statusBajoActive, styles.statusBajoActiveText)}
                        {renderStatusButton(direccion, 'CRITICO', setDireccion, styles.statusCriticoActive, styles.statusCriticoActiveText)}
                      </View>
                    </View>

                    {/* Observaciones */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Observaciones adicionales</Text>
                      <View style={styles.inputWrapperMultiline}>
                        <TextInput
                          style={styles.inputMultiline}
                          placeholder="Ingrese detalles adicionales del estado de los fluidos..."
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
                      onPress={guardarControl}
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
                            <Text style={styles.submitButtonText}>GUARDAR CONTROL DE FLUIDOS</Text>
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
