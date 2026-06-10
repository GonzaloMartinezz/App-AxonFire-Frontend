// ─────────────────────────────────────────────────────────────────────────────
// InformePostEmergenciaScreen.js — NUEVO
//
// AX-16: Edición de plantilla de informe post-emergencia
//
// USER STORY: Como jefe de dotación, quiero abrir el borrador del informe
//   generado para agregar observaciones cualitativas, detalles de la vivienda
//   afectada o el local, antes de proceder a la impresión definitiva.
//
// PRECONDICIÓN: El usuario debe tener rol de administrador u oficial.
//
// TAREA: Implementar un editor de texto enriquecido (WYSIWYG) ligero para que
//   el oficial añada observaciones (ej. "local denominado...", detalles del
//   siniestro).
//
// ENDPOINT CONSUMIDO:
//   GET  /alerta/:id_alerta                  → datos de la alerta
//   GET  /registros_comunicacion/alerta/:id  → historial de observaciones previas
//   POST /registros_comunicacion/crear       → guarda el informe/observaciones
//     Body: { alerta_id, mensaje, tipo_comunicacion: "INFORMACION", fecha_hora }
//
// PARÁMETROS DE NAVEGACIÓN (route.params):
//   - alertaId    : UUID de la alerta asociada al informe
//   - token       : Bearer JWT
//   - rol         : rol del usuario ("ADMIN" | "BOMBERO") — para controlar acceso
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDateLocal(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput !== 'string') return new Date(dateInput);
  
  // Strip 'Z' at the end or '+00:00' timezone offset to parse it as local time
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

// ── Toolbar WYSIWYG liviano ───────────────────────────────────────────────────
// React Native no tiene WebView en el core; implementamos un editor con
// TextInput + estado de formato aplicado como marcadores de texto
// (negrita con **texto**, cursiva con _texto_, etc.) — liviano y sin deps extra.
// El texto se guarda como string plano enriquecido con marcadores simples.

const ACCIONES_FORMATO = [
  { id: 'negrita',    icono: 'format-bold',          marcador: '**',  label: 'Negrita'  },
  { icono: 'format-italic',         marcador: '_',   id: 'cursiva',   label: 'Cursiva'  },
  { id: 'subrayado', icono: 'format-underline',      marcador: '__',  label: 'Subrayado'},
  { id: 'lista',     icono: 'format-list-bulleted',  marcador: '• ',  label: 'Lista'    },
  { id: 'separador', icono: 'minus',                 marcador: '\n─────────────────\n', label: 'Separador' },
];

// Secciones predefinidas de la plantilla del informe
const SECCIONES_PLANTILLA = [
  { id: 'local',       titulo: 'Descripción del local / vivienda',   placeholder: 'Local denominado... ubicado en... con características...' },
  { id: 'siniestro',   titulo: 'Detalles del siniestro',             placeholder: 'Se constató... El origen del incendio... Extensión del daño...' },
  { id: 'intervenciones', titulo: 'Intervenciones realizadas',        placeholder: 'Se procedió a... Se utilizaron... El personal actuante...' },
  { id: 'estado_final',titulo: 'Estado final y observaciones',       placeholder: 'Al momento del retiro... Se recomienda... Observaciones adicionales...' },
];

// ── Componente ToolbarWYSIWYG ─────────────────────────────────────────────────

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

// ── Componente: Editor de sección ─────────────────────────────────────────────

function EditorSeccion({ seccion, value, onChange }) {
  const inputRef = useRef(null);
  const [seleccion, setSeleccion] = useState({ start: 0, end: 0 });

  function aplicarFormato(accion) {
    if (accion.id === 'lista') {
      // Agrega bullet al inicio de la línea actual
      const antes  = value.slice(0, seleccion.start);
      const despues = value.slice(seleccion.end);
      const lineaInicio = antes.lastIndexOf('\n') + 1;
      const lineaTexto  = antes.slice(lineaInicio);
      const nuevoTexto  = antes.slice(0, lineaInicio) + '• ' + lineaTexto + despues;
      onChange(nuevoTexto);
      return;
    }
    if (accion.id === 'separador') {
      const nuevoTexto = value.slice(0, seleccion.start) + accion.marcador + value.slice(seleccion.end);
      onChange(nuevoTexto);
      return;
    }

    // Para negrita, cursiva, subrayado: envuelve el texto seleccionado
    const textoSeleccionado = value.slice(seleccion.start, seleccion.end);
    if (textoSeleccionado.length === 0) {
      // Sin selección: inserta marcadores vacíos para que el usuario escriba adentro
      const nuevoTexto =
        value.slice(0, seleccion.start) +
        accion.marcador + accion.marcador +
        value.slice(seleccion.end);
      onChange(nuevoTexto);
    } else {
      // Con selección: envuelve
      const nuevoTexto =
        value.slice(0, seleccion.start) +
        accion.marcador + textoSeleccionado + accion.marcador +
        value.slice(seleccion.end);
      onChange(nuevoTexto);
    }
  }

  return (
    <View style={editorStyles.seccionWrapper}>
      {/* Título de la sección */}
      <View style={editorStyles.seccionHeader}>
        <MaterialCommunityIcons name="file-document-edit-outline" size={13} color="#64748b" />
        <Text style={editorStyles.seccionTitulo}>{seccion.titulo.toUpperCase()}</Text>
      </View>

      {/* Toolbar de formato */}
      <ToolbarWYSIWYG onAccion={aplicarFormato} />

      {/* Area de texto */}
      <TextInput
        ref={inputRef}
        style={editorStyles.inputArea}
        value={value}
        onChangeText={onChange}
        placeholder={seccion.placeholder}
        placeholderTextColor="#334155"
        multiline
        textAlignVertical="top"
        onSelectionChange={e => setSeleccion(e.nativeEvent.selection)}
        scrollEnabled={false}
      />

      {/* Contador de caracteres */}
      <Text style={editorStyles.contador}>{value.length} caracteres</Text>
    </View>
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
    minHeight: 90,
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

// ── Componente principal ──────────────────────────────────────────────────────

export default function InformePostEmergenciaScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const alertaId = route?.params?.alertaId || null;
  const token    = route?.params?.token    || '';
  const rol      = route?.params?.rol      || 'BOMBERO';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Estado ──────────────────────────────────────────────────────────────────
  const [alertaData, setAlertaData]       = useState(null);
  const [cargandoAlerta, setCargandoAlerta] = useState(true);
  const [guardando, setGuardando]         = useState(false);
  const [guardadoOk, setGuardadoOk]       = useState(false);

  // Contenido de cada sección del informe
  const [contenidos, setContenidos] = useState(
    Object.fromEntries(SECCIONES_PLANTILLA.map(s => [s.id, '']))
  );

  // Observaciones generales (campo adicional libre)
  const [observacionesGenerales, setObservacionesGenerales] = useState('');

  // ── Cargar datos de la alerta ────────────────────────────────────────────────
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

    async function cargarRegistrosPrevios() {
      try {
        const res = await fetch(
          `${API_BASE_URL}/registros_comunicacion/alerta/${alertaId}`,
          { headers }
        );
        if (!res.ok) return;
        const data = await res.json();
        // Si ya hay un informe guardado, pre-llenamos el campo de observaciones generales
        const informePrevio = Array.isArray(data)
          ? data.find(r => r.tipo_comunicacion === 'INFORMACION')
          : null;
        if (informePrevio?.mensaje) {
          setObservacionesGenerales(informePrevio.mensaje);
        }
      } catch (err) {
        console.warn('Sin registros previos:', err);
      }
    }

    cargarAlerta();
    cargarRegistrosPrevios();
  }, [alertaId]);

  // ── Actualizar una sección ───────────────────────────────────────────────────
  function actualizarSeccion(id, texto) {
    setContenidos(prev => ({ ...prev, [id]: texto }));
  }

  // ── Compilar el informe completo ─────────────────────────────────────────────
  function compilarInforme() {
    const lineas = [];
    lineas.push('═══════════════════════════════════════');
    lineas.push('INFORME POST-EMERGENCIA — AXON FIRE');
    lineas.push('═══════════════════════════════════════');
    if (alertaData) {
      lineas.push(`Alerta ID: ${alertaId}`);
      lineas.push(`Fecha: ${formatFecha(alertaData.fecha_hora)}`);
      lineas.push(`Ubicación: ${alertaData.ubicacion || '—'}`);
      lineas.push('───────────────────────────────────────');
    }

    SECCIONES_PLANTILLA.forEach(sec => {
      if (contenidos[sec.id]?.trim()) {
        lineas.push(`\n[${sec.titulo.toUpperCase()}]`);
        lineas.push(contenidos[sec.id].trim());
      }
    });

    if (observacionesGenerales.trim()) {
      lineas.push('\n[OBSERVACIONES GENERALES]');
      lineas.push(observacionesGenerales.trim());
    }

    lineas.push('\n═══════════════════════════════════════');
    lineas.push(`Generado: ${new Date().toLocaleString('es-AR')}`);

    return lineas.join('\n');
  }

  // ── Guardar informe ──────────────────────────────────────────────────────────
  async function guardarInforme() {
    const textoCompilado = compilarInforme();
    const tieneContenido = SECCIONES_PLANTILLA.some(s => contenidos[s.id]?.trim())
      || observacionesGenerales.trim();

    if (!tieneContenido) {
      Alert.alert('Informe vacío', 'Completá al menos una sección antes de guardar.');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/registros_comunicacion/crear`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          alerta_id: alertaId,
          mensaje: textoCompilado,
          tipo_comunicacion: 'INFORMACION',
          fecha_hora: new Date().toISOString(),
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

  // ── Verificar acceso ─────────────────────────────────────────────────────────
  const tieneAcceso = rol === 'ADMIN' || rol === 'OFICIAL' || rol === 'BOMBERO';

  // ── Render ───────────────────────────────────────────────────────────────────

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
        {guardadoOk && (
          <MaterialCommunityIcons name="check-circle" size={22} color="#22c55e" />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Sin acceso */}
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
                Completá las secciones necesarias. Usá la barra de herramientas para
                dar formato al texto antes de guardar el informe definitivo.
              </Text>
            </View>

            {/* Secciones WYSIWYG */}
            {SECCIONES_PLANTILLA.map(sec => (
              <EditorSeccion
                key={sec.id}
                seccion={sec}
                value={contenidos[sec.id]}
                onChange={texto => actualizarSeccion(sec.id, texto)}
              />
            ))}

            {/* Observaciones generales (campo libre extra) */}
            <View style={editorStyles.seccionWrapper}>
              <View style={editorStyles.seccionHeader}>
                <MaterialCommunityIcons name="note-text-outline" size={13} color="#64748b" />
                <Text style={editorStyles.seccionTitulo}>OBSERVACIONES GENERALES</Text>
              </View>
              <ToolbarWYSIWYG onAccion={accion => {
                setObservacionesGenerales(prev => prev + accion.marcador);
              }} />
              <TextInput
                style={editorStyles.inputArea}
                value={observacionesGenerales}
                onChangeText={setObservacionesGenerales}
                placeholder="Cualquier observación adicional que no encaje en las secciones anteriores..."
                placeholderTextColor="#334155"
                multiline
                textAlignVertical="top"
                scrollEnabled={false}
              />
              <Text style={editorStyles.contador}>{observacionesGenerales.length} caracteres</Text>
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

// ── Estilos ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: '#0d1117',
    borderBottomWidth: 1, borderBottomColor: '#1f2937',
  },
  botonVolver: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#1f2937',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitulo: {
    color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.8,
  },
  headerSub: {
    color: '#475569', fontSize: 9, fontWeight: '600', marginTop: 1,
  },

  contenido: { padding: 20 },

  // Card datos alerta
  cardAlerta: {
    backgroundColor: '#111827', borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#1f2937',
  },
  cardAlertaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  cardAlertaTitulo: {
    color: '#dc2626', fontSize: 10, fontWeight: '900', letterSpacing: 0.8,
  },
  datosRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6,
  },
  datoTexto: { color: '#94a3b8', fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 18 },
  sinDatos:  { color: '#334155', fontSize: 12, fontStyle: 'italic' },

  // Instrucción
  instruccion: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderRadius: 8, padding: 12, marginBottom: 20,
    borderLeftWidth: 2, borderLeftColor: '#3b82f6',
  },
  instruccionTexto: {
    color: '#64748b', fontSize: 11, fontWeight: '500', flex: 1, lineHeight: 16,
  },

  // Sin acceso
  sinAcceso: {
    alignItems: 'center', paddingVertical: 60, gap: 12,
  },
  sinAccesoTexto: {
    color: '#334155', fontSize: 13, fontWeight: '600',
    textAlign: 'center', lineHeight: 20,
  },

  // Botón guardar
  botonGuardar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#dc2626', borderRadius: 10, paddingVertical: 16, marginTop: 8,
  },
  botonGuardarTexto: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  badgeGuardado: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    justifyContent: 'center', marginTop: 10,
  },
  badgeGuardadoTexto: { color: '#22c55e', fontSize: 11, fontWeight: '700' },

  footer: {
    color: '#1f2937', fontSize: 9, fontWeight: '600',
    textAlign: 'center', marginTop: 24, letterSpacing: 0.8,
  },
});
