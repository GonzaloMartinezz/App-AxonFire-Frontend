// ─────────────────────────────────────────────────────────────────────────────
// InformePostEmergenciaScreen.js — NUEVO
//
// AX-16: Edición de informe post-emergencia (observaciones_admin)
//
// ENDPOINT CONSUMIDO:
//   GET   /alerta/:id_alerta           → datos de la alerta
//   GET   /informes/:alertaId/datos    → datos del informe existente
//   PATCH /informes/:alertaId/guardar  → guarda o actualiza el informe
//     Body: { observaciones_admin }
//
// PARÁMETROS DE NAVEGACIÓN (route.params):
//   - alertaId    : UUID de la alerta asociada al informe
//   - token       : Bearer JWT
//   - rol         : rol del usuario ("ADMIN" | "BOMBERO")
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/InformePostEmergenciaScreenStyles';

function parseDateLocal(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput !== 'string') return new Date(dateInput);
  const cleaned = dateInput.replace(/Z$/, '').replace(/\+00:?00$/, '');
  return new Date(cleaned);
}

function formatFecha(iso) {
  if (!iso) return '—';
  return parseDateLocal(iso).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const ACCIONES_FORMATO = [
  { id: 'negrita', icono: 'format-bold', marcador: '**', label: 'Negrita' },
  { id: 'cursiva', icono: 'format-italic', marcador: '_', label: 'Cursiva' },
  { id: 'subrayado', icono: 'format-underline', marcador: '__', label: 'Subrayado' },
  { id: 'lista', icono: 'format-list-bulleted', marcador: '• ', label: 'Lista' },
  { id: 'separador', icono: 'minus', marcador: '\n─────────────────\n', label: 'Separador' },
];

function ToolbarWYSIWYG({ onAccion }) {
  return (
    <View style={toolbarStyles.toolbar}>
      {ACCIONES_FORMATO.map(accion => (
        <TouchableOpacity
          key={accion.id}
          style={toolbarStyles.boton}
          onPress={() => onAccion(accion)}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name={accion.icono} size={18} color="#cbd5e1" />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const toolbarStyles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#1e2530',
    borderRadius: 8,
    padding: 4,
    gap: 2,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  boton: {
    width: 36, height: 36, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#263040',
  },
});

export default function InformePostEmergenciaScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const alertaId = route?.params?.alertaId || null;
  const token = route?.params?.token || '';
  const rol = route?.params?.rol || 'BOMBERO';
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Confirmar", onPress: () => logout(), style: "destructive" },
      ]
    );
  };

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const [alertaData, setAlertaData] = useState(null);
  const [cargandoAlerta, setCargandoAlerta] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [guardadoOk, setGuardadoOk] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const inputRef = useRef(null);
  const [seleccion, setSeleccion] = useState({ start: 0, end: 0 });

  useEffect(() => {
    if (!alertaId) { setCargandoAlerta(false); return; }

    async function cargarAlerta() {
      try {
        const res = await fetch(`${API_BASE_URL}/alerta/${alertaId}`, { headers });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setAlertaData(data);
      } catch (err) {
        console.error('Error cargando alerta:', err);
      } finally {
        setCargandoAlerta(false);
      }
    }

    async function cargarDatosInforme() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/informes/${alertaId}/datos`,
          { headers }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.observaciones_admin) {
          setObservaciones(data.observaciones_admin);
        }
      } catch (err) {
        console.warn('Sin informe previo:', err);
      }
    }

    cargarAlerta();
    cargarDatosInforme();
  }, [alertaId]);

  function aplicarFormato(accion) {
    const value = observaciones;
    if (accion.id === 'lista') {
      const antes = value.slice(0, seleccion.start);
      const despues = value.slice(seleccion.end);
      const lineaInicio = antes.lastIndexOf('\n') + 1;
      const lineaTexto = antes.slice(lineaInicio);
      const nuevoTexto = antes.slice(0, lineaInicio) + '• ' + lineaTexto + despues;
      setObservaciones(nuevoTexto);
      return;
    }
    if (accion.id === 'separador') {
      const nuevoTexto = value.slice(0, seleccion.start) + accion.marcador + value.slice(seleccion.end);
      setObservaciones(nuevoTexto);
      return;
    }

    const textoSeleccionado = value.slice(seleccion.start, seleccion.end);
    if (textoSeleccionado.length === 0) {
      const nuevoTexto =
        value.slice(0, seleccion.start) +
        accion.marcador + accion.marcador +
        value.slice(seleccion.end);
      setObservaciones(nuevoTexto);
    } else {
      const nuevoTexto =
        value.slice(0, seleccion.start) +
        accion.marcador + textoSeleccionado + accion.marcador +
        value.slice(seleccion.end);
      setObservaciones(nuevoTexto);
    }
  }

  // ── Guardar informe ──────────────────────────────────────────────────────────
  async function guardarInforme() {
    if (!observaciones.trim()) {
      Alert.alert('Informe vacío', 'Escribí las observaciones antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/informes/${alertaId}/guardar`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          observaciones_admin: observaciones,
        }),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      setGuardadoOk(true);
      Alert.alert(
        '✅ Informe guardado',
        'El informe post-emergencia fue registrado correctamente.',
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error guardando informe:', err);
      Alert.alert('Error', 'No se pudo guardar el informe. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  const tieneAcceso = rol === 'ADMIN' || rol === 'OFICIAL' || rol === 'BOMBERO';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0a0f12' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0f12" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation?.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitulo}>INFORME POST-EMERGENCIA</Text>
          <Text style={styles.headerSub}>AX-16 · Solo oficiales y administradores</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {guardadoOk && (
            <MaterialCommunityIcons name="check-circle" size={22} color="#22c55e" />
          )}
          <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {!tieneAcceso && (
          <View style={styles.sinAcceso}>
            <MaterialCommunityIcons name="shield-lock-outline" size={44} color="#334155" />
            <Text style={styles.sinAccesoTexto}>
              Solo oficiales o administradores pueden editar el informe.
            </Text>
          </View>
        )}

        {tieneAcceso && (
          <>
            {/* Datos de la alerta (encabezado del informe) */}
            <View style={styles.cardAlerta}>
              <View style={styles.cardAlertaHeader}>
                <MaterialCommunityIcons name="file-alert-outline" size={16} color="#dc2626" />
                <Text style={styles.cardAlertaTitulo}>DATOS DE LA EMERGENCIA</Text>
              </View>

              {cargandoAlerta ? (
                <ActivityIndicator size="small" color="#dc2626" style={{ marginTop: 8 }} />
              ) : alertaData ? (
                <>
                  <View style={styles.datosRow}>
                    <MaterialCommunityIcons name="calendar-clock" size={13} color="#475569" />
                    <Text style={styles.datoTexto}>{formatFecha(alertaData.fecha_hora)}</Text>
                  </View>
                  <View style={styles.datosRow}>
                    <MaterialCommunityIcons name="map-marker-outline" size={13} color="#475569" />
                    <Text style={styles.datoTexto}>{alertaData.ubicacion || 'Sin ubicación'}</Text>
                  </View>
                  {alertaData.observaciones ? (
                    <View style={styles.datosRow}>
                      <MaterialCommunityIcons name="text-box-outline" size={13} color="#475569" />
                      <Text style={styles.datoTexto}>{alertaData.observaciones}</Text>
                    </View>
                  ) : null}
                </>
              ) : (
                <Text style={styles.sinDatos}>
                  {alertaId ? 'No se pudieron cargar los datos.' : 'Sin alerta asociada (modo borrador).'}
                </Text>
              )}
            </View>

            {/* Instrucción */}
            <View style={styles.instruccion}>
              <MaterialCommunityIcons name="information-outline" size={14} color="#3b82f6" />
              <Text style={styles.instruccionTexto}>
                Redactá las observaciones del informe post-emergencia. Usá la barra de herramientas
                para dar formato al texto antes de guardar.
              </Text>
            </View>

            {/* Campo único de observaciones */}
            <View style={editorStyles.seccionWrapper}>
              <View style={editorStyles.seccionHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={13} color="#64748b" />
                <Text style={editorStyles.seccionTitulo}>OBSERVACIONES DEL INFORME</Text>
              </View>
              <ToolbarWYSIWYG onAccion={aplicarFormato} />
              <TextInput
                ref={inputRef}
                style={editorStyles.inputArea}
                value={observaciones}
                onChangeText={setObservaciones}
                placeholder="Escribí acá las observaciones del informe post-emergencia..."
                placeholderTextColor="#334155"
                multiline
                textAlignVertical="top"
                onSelectionChange={e => setSeleccion(e.nativeEvent.selection)}
                scrollEnabled={false}
              />
              <Text style={editorStyles.contador}>{observaciones.length} caracteres</Text>
            </View>

            {/* Botón guardar */}
            <TouchableOpacity
              style={[styles.botonGuardar, guardando && { opacity: 0.6 }]}
              onPress={guardarInforme}
              disabled={guardando}
              activeOpacity={0.8}
            >
              {guardando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="content-save-check-outline" size={18} color="#fff" />
                  <Text style={styles.botonGuardarTexto}>GUARDAR INFORME</Text>
                </>
              )}
            </TouchableOpacity>

            {guardadoOk && (
              <View style={styles.badgeGuardado}>
                <MaterialCommunityIcons name="check-circle" size={14} color="#22c55e" />
                <Text style={styles.badgeGuardadoTexto}>Informe guardado correctamente</Text>
              </View>
            )}

            <Text style={styles.footer}>AXON FIRE · Informe confidencial</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const editorStyles = StyleSheet.create({
  seccionWrapper: {
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  seccionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  seccionTitulo: {
    color: '#475569', fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
  },
  inputArea: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
    minHeight: 200,
    backgroundColor: '#0d1117',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  contador: {
    color: '#334155', fontSize: 9, fontWeight: '600',
    textAlign: 'right', marginTop: 4,
  },
});
