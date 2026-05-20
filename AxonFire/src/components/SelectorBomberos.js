// ─────────────────────────────────────────────────────────────────────────────
// SelectorBomberos.js — COMPONENTE REUTILIZABLE
//
// TAREA AX-13: Crear un selector múltiple (tipo tags) que consuma la lista
//   de bomberos activos para añadir acompañantes en el control.
//
// USER STORY: Como administrador quiero que el sistema registre qué usuario
//   o usuarios realizaron el checklist, para tener trazabilidad de quién
//   controló el equipo.
//
// ENDPOINT CONSUMIDO:
//   GET /usuarios/bomberos → lista de bomberos activos (requiere rol ADMIN o token)
//
// CÓMO USARLO en ChecklistScreen o ChecklistBolsosScreen:
//
//   import SelectorBomberos from '../components/SelectorBomberos';
//
//   // Estado en el componente padre:
//   const [acompanantes, setAcompanantes] = useState([]);
//
//   // En el JSX, antes del botón guardar:
//   <SelectorBomberos
//     token={token}
//     seleccionados={acompanantes}
//     onChange={setAcompanantes}
//   />
//
//   // Al armar el body del POST, incluir:
//   acompanantesIds: acompanantes.map(b => b.usuario_id)
//
// PROPS:
//   token        {string}   — Bearer token JWT
//   seleccionados {Array}   — array de bomberos seleccionados (estado del padre)
//   onChange     {Function} — callback cuando cambia la selección
//   maxSeleccion {number}   — límite de acompañantes (default: sin límite)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api';

export default function SelectorBomberos({ token, seleccionados = [], onChange, maxSeleccion }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [bomberos, setBomberos]         = useState([]);
  const [filtrado, setFiltrado]         = useState([]);
  const [busqueda, setBusqueda]         = useState('');
  const [cargando, setCargando]         = useState(false);
  const [error, setError]               = useState(null);
  const yaCargoRef                      = useRef(false);

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Cargar bomberos del backend ───────────────────────────────────────────

  async function cargarBomberos() {
    if (yaCargoRef.current) return; // no repetir si ya cargó
    yaCargoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/bomberos`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];
      setBomberos(lista);
      setFiltrado(lista);
    } catch (err) {
      console.error('Error cargando bomberos:', err);
      setError('No se pudo cargar la lista de bomberos.');
      yaCargoRef.current = false; // permitir reintentar
    } finally {
      setCargando(false);
    }
  }

  // Filtrar por búsqueda
  useEffect(() => {
    if (!busqueda.trim()) {
      setFiltrado(bomberos);
      return;
    }
    const q = busqueda.toLowerCase();
    setFiltrado(
      bomberos.filter(b => {
        const nombre = `${b.nombre} ${b.apellido}`.toLowerCase();
        const usuario = (b.usuarioId?.nombre_usuario || '').toLowerCase();
        const rango   = (b.rangoBombero?.nombre_rol  || '').toLowerCase();
        return nombre.includes(q) || usuario.includes(q) || rango.includes(q);
      })
    );
  }, [busqueda, bomberos]);

  function abrirModal() {
    cargarBomberos();
    setModalVisible(true);
  }

  // ── Toggle selección ───────────────────────────────────────────────────────

  function toggleBombero(bombero) {
    const yaEsta = seleccionados.some(b => b.id === bombero.id);

    if (yaEsta) {
      // Deseleccionar
      onChange(seleccionados.filter(b => b.id !== bombero.id));
    } else {
      // Verificar límite
      if (maxSeleccion && seleccionados.length >= maxSeleccion) return;
      onChange([...seleccionados, bombero]);
    }
  }

  function estaSeleccionado(bombero) {
    return seleccionados.some(b => b.id === bombero.id);
  }

  function quitarTag(bombero) {
    onChange(seleccionados.filter(b => b.id !== bombero.id));
  }

  // ── Render de cada bombero en la lista ────────────────────────────────────

  function renderBombero({ item }) {
    const seleccionado = estaSeleccionado(item);
    const nombre = `${item.nombre || ''} ${item.apellido || ''}`.trim() || item.usuarioId?.nombre_usuario || 'Bombero';
    const rango  = item.rangoBombero?.nombre_rol || '';
    const iniciales = nombre.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();

    return (
      <TouchableOpacity
        style={[styles.filaBombero, seleccionado && styles.filaBomberoSeleccionada]}
        onPress={() => toggleBombero(item)}
        activeOpacity={0.7}
      >
        {/* Avatar con iniciales */}
        <View style={[styles.avatar, seleccionado && styles.avatarSeleccionado]}>
          {seleccionado
            ? <MaterialCommunityIcons name="check" size={16} color="#fff" />
            : <Text style={styles.avatarTexto}>{iniciales}</Text>
          }
        </View>

        {/* Datos */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.nombreBombero, seleccionado && { color: '#fff' }]}>
            {nombre}
          </Text>
          {rango ? (
            <Text style={[styles.rangoBombero, seleccionado && { color: 'rgba(255,255,255,0.6)' }]}>
              {rango.toUpperCase()}
            </Text>
          ) : null}
        </View>

        {/* Check indicator */}
        {seleccionado && (
          <MaterialCommunityIcons name="check-circle" size={20} color="#22c55e" />
        )}
      </TouchableOpacity>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrapper}>

      {/* Label */}
      <View style={styles.labelRow}>
        <MaterialCommunityIcons name="account-multiple" size={14} color="#64748b" />
        <Text style={styles.label}>ACOMPAÑANTES EN EL CONTROL</Text>
        {seleccionados.length > 0 && (
          <View style={styles.badgeCantidad}>
            <Text style={styles.badgeCantidadTexto}>{seleccionados.length}</Text>
          </View>
        )}
      </View>

      {/* Tags de seleccionados */}
      {seleccionados.length > 0 && (
        <View style={styles.tagsContainer}>
          {seleccionados.map(b => {
            const nombre = `${b.nombre || ''} ${b.apellido || ''}`.trim()
              || b.usuarioId?.nombre_usuario || 'Bombero';
            return (
              <View key={b.id} style={styles.tag}>
                <MaterialCommunityIcons name="account" size={11} color="#93c5fd" />
                <Text style={styles.tagTexto} numberOfLines={1}>
                  {nombre.split(' ')[0].toUpperCase()}
                </Text>
                <TouchableOpacity onPress={() => quitarTag(b)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                  <MaterialCommunityIcons name="close" size={11} color="#64748b" />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {/* Botón para abrir el selector */}
      <TouchableOpacity style={styles.botonAgregar} onPress={abrirModal} activeOpacity={0.75}>
        <MaterialCommunityIcons name="account-plus-outline" size={16} color="#94a3b8" />
        <Text style={styles.botonAgregarTexto}>
          {seleccionados.length === 0 ? 'Agregar acompañantes' : 'Editar acompañantes'}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color="#475569" />
      </TouchableOpacity>

      {/* ── Modal de selección ─────────────────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalFondo}>
          <View style={styles.modalContenedor}>

            {/* Header del modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitulo}>Seleccionar acompañantes</Text>
                <Text style={styles.modalSub}>
                  {seleccionados.length > 0
                    ? `${seleccionados.length} seleccionado(s)`
                    : 'Tocá para seleccionar'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCerrar}
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.buscadorContainer}>
              <MaterialCommunityIcons name="magnify" size={16} color="#475569" />
              <TextInput
                style={styles.buscador}
                placeholder="Buscar por nombre o rango..."
                placeholderTextColor="#475569"
                value={busqueda}
                onChangeText={setBusqueda}
                autoCorrect={false}
              />
              {busqueda.length > 0 && (
                <TouchableOpacity onPress={() => setBusqueda('')}>
                  <MaterialCommunityIcons name="close-circle" size={14} color="#475569" />
                </TouchableOpacity>
              )}
            </View>

            {/* Lista de bomberos */}
            {cargando && (
              <View style={styles.centrado}>
                <ActivityIndicator size="small" color="#dc2626" />
                <Text style={styles.textoEstado}>Cargando bomberos...</Text>
              </View>
            )}

            {error && (
              <View style={styles.centrado}>
                <MaterialCommunityIcons name="wifi-off" size={32} color="#334155" />
                <Text style={styles.textoEstado}>{error}</Text>
                <TouchableOpacity
                  style={styles.botonReintentar}
                  onPress={() => { yaCargoRef.current = false; cargarBomberos(); }}
                >
                  <Text style={styles.textoReintentar}>REINTENTAR</Text>
                </TouchableOpacity>
              </View>
            )}

            {!cargando && !error && filtrado.length === 0 && (
              <View style={styles.centrado}>
                <MaterialCommunityIcons name="account-search-outline" size={36} color="#334155" />
                <Text style={styles.textoEstado}>
                  {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay bomberos registrados'}
                </Text>
              </View>
            )}

            {!cargando && !error && (
              <FlatList
                data={filtrado}
                keyExtractor={item => item.id}
                renderItem={renderBombero}
                style={styles.lista}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separador} />}
              />
            )}

            {/* Botón confirmar */}
            <TouchableOpacity
              style={styles.botonConfirmar}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.textoConfirmar}>
                CONFIRMAR ({seleccionados.length} seleccionado{seleccionados.length !== 1 ? 's' : ''})
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },

  labelRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
  },
  label: {
    color: '#64748b', fontSize: 10, fontWeight: '800',
    letterSpacing: 0.8, textTransform: 'uppercase',
  },
  badgeCantidad: {
    backgroundColor: '#dc2626', width: 18, height: 18,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  badgeCantidadTexto: { color: '#fff', fontSize: 9, fontWeight: '900' },

  // Tags de seleccionados
  tagsContainer: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10,
  },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#1e293b',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#334155',
  },
  tagTexto: {
    color: '#93c5fd', fontSize: 10, fontWeight: '700',
    letterSpacing: 0.4, maxWidth: 70,
  },

  // Botón abrir
  botonAgregar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#1b1d24',
    borderRadius: 6, padding: 12,
    borderWidth: 1, borderColor: '#26282f',
  },
  botonAgregarTexto: {
    flex: 1, color: '#64748b', fontSize: 12, fontWeight: '600',
  },

  // Modal
  modalFondo: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end',
  },
  modalContenedor: {
    backgroundColor: '#1a1c23',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#26282f',
  },
  modalTitulo: { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  modalSub: { color: '#475569', fontSize: 11, fontWeight: '600', marginTop: 2 },
  modalCerrar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#26282f', alignItems: 'center', justifyContent: 'center',
  },

  // Buscador
  buscadorContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#26282f', borderRadius: 8,
    margin: 16, paddingHorizontal: 12, paddingVertical: 10,
  },
  buscador: {
    flex: 1, color: '#e2e8f0', fontSize: 13, fontWeight: '500',
  },

  // Lista
  lista: { paddingHorizontal: 16, flexGrow: 0 },
  filaBombero: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
    borderRadius: 8, backgroundColor: '#1b1d24',
  },
  filaBomberoSeleccionada: {
    backgroundColor: '#1e3a5f',
    borderWidth: 1, borderColor: '#1d4ed8',
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarSeleccionado: { backgroundColor: '#1d4ed8' },
  avatarTexto: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  nombreBombero: {
    color: '#e2e8f0', fontSize: 13, fontWeight: '700',
  },
  rangoBombero: {
    color: '#475569', fontSize: 9, fontWeight: '800',
    letterSpacing: 0.6, textTransform: 'uppercase', marginTop: 1,
  },
  separador: { height: 6 },

  // Confirmar
  botonConfirmar: {
    backgroundColor: '#dc2626',
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 6, paddingVertical: 16,
    alignItems: 'center',
  },
  textoConfirmar: {
    color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 1,
  },

  // Estados
  centrado: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  textoEstado: { color: '#475569', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  botonReintentar: {
    backgroundColor: '#dc2626', paddingHorizontal: 20,
    paddingVertical: 8, borderRadius: 6, marginTop: 4,
  },
  textoReintentar: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
