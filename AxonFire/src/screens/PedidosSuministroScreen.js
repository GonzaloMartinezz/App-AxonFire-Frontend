import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing } from '../theme';
import TacticalCard from '../components/TacticalCard';
import { API_BASE_URL } from '../config/api';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/PedidosSuministroScreenStyles';

const TIPOS_REFUERZO = [
  { icono: 'water', nombre: 'CISTERNA', color: '#38bdf8', tipo: 'cisterna', subcat: '4' },
  { icono: 'gas-station', nombre: 'COMBUSTIBLE', color: '#fbbf24', tipo: 'combustible', subcat: '4' },
  { icono: 'ambulance', nombre: 'AMBULANCIA', color: '#fca5a5', tipo: 'ambulancia', subcat: '4' },
  { icono: 'hammer-wrench', nombre: 'RESCATE', color: '#34d399', tipo: 'rescate', subcat: '2' },
];

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '';
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `Hace ${hs} hs`;
  return `Hace ${Math.floor(hs / 24)} días`;
}

export default function PedidosSuministroScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const usuarioId = user?.id || '';

  // ── Estado ────────────────────────────────────────────────────────────────
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Modal Único / Unificado
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRefuerzo, setSelectedRefuerzo] = useState(null); // null = Personal, object = Cisterna, etc.
  const [cantidad, setCantidad] = useState(1);
  const [observaciones, setObservaciones] = useState('');
  const [pedidoManual, setPedidoManual] = useState('');
  const [enviandoManual, setEnviandoManual] = useState(false);

  // Alerta activa a la cual ligar el pedido
  const [alertaActiva, setAlertaActiva] = useState(null);

  // ── Cargar historial y alertas activas ──────────────────────────────────────
  async function cargarDatos() {
    setCargando(true);
    try {
      // 1. Buscar alerta activa (la más reciente que no sea FINALIZADO)
      const resAlertas = await axios.get(`${API_BASE_URL}/alerta/rango`, {
        params: {
          fecha_desde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días para ver historial
          fecha_hasta: new Date().toISOString()
        }, headers: { Authorization: `Bearer ${token}` }
      });

      const lista = resAlertas.data?.alertas || [];
      const activas = lista.filter(a => a.estadoAlerta?.nombre_estado !== 'FINALIZADO');
      
      if (activas.length > 0) {
        setAlertaActiva(activas[0]); // Tomamos la más reciente activa

        // 2. Cargar registros de comunicación de esa alerta
        const resLogs = await axios.get(`${API_BASE_URL}/registros_comunicacion/alerta/${activas[0].id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSolicitudes(Array.isArray(resLogs.data) ? resLogs.data : []);
      } else {
        setAlertaActiva(null);
        setSolicitudes([]);
      }
    } catch (err) {
      console.error('Error cargando datos de suministro:', err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    if (usuarioId) cargarDatos();
  }, [usuarioId]);

  // ── Abrir Modal de Solicitud ─────────────────────────────────────────────
  function openRequestModal(refuerzo) {
    if (!alertaActiva) {
      Alert.alert("Atención", "No hay ninguna emergencia activa en este momento para enviar solicitudes.");
      return;
    }
    setSelectedRefuerzo(refuerzo); // null representa a "PERSONAL"
    setCantidad(1);
    setObservaciones('');
    setModalVisible(true);
  }

  // ── Enviar Solicitud Unificada ───────────────────────────────────────────
  async function enviarSolicitud() {
    if (!alertaActiva) return;

    setEnviando(true);
    try {
      const esPersonal = selectedRefuerzo === null;
      const keyLabel = esPersonal ? 'REFUERZO PERSONAL' : selectedRefuerzo.nombre;
      const detailMsg = observaciones.trim() ? `: ${observaciones.trim()}` : '';
      
      const body = {
        alerta_id: alertaActiva.id,
        usuario_id: usuarioId,
        mensaje: `[${keyLabel}] Cantidad: ${cantidad}${detailMsg}`,
        tipo_comunicacion: esPersonal ? 'APOYO' : 'SUMINISTROS',
        fecha_hora: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/registros_comunicacion/crear`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setModalVisible(false);
      Alert.alert('✅ Enviado', `Pedido de ${keyLabel.toLowerCase()} registrado con éxito.`);
      cargarDatos();
    } catch (err) {
      console.error('Error enviando solicitud:', err);
      Alert.alert('Error', 'No se pudo registrar la solicitud en la bitácora táctica.');
    } finally {
      setEnviando(false);
    }
  }

  // ── Enviar Pedido Manual ─────────────────────────────────────────────────
  async function enviarPedidoManual() {
    if (!alertaActiva) {
      Alert.alert("Atención", "No hay ninguna emergencia activa en este momento para enviar solicitudes.");
      return;
    }
    if (!pedidoManual.trim()) {
      Alert.alert("Atención", "Por favor, ingrese el texto de su pedido.");
      return;
    }

    setEnviandoManual(true);
    try {
      const body = {
        alerta_id: alertaActiva.id,
        usuario_id: usuarioId,
        mensaje: `[PEDIDO MANUAL] ${pedidoManual.trim()}`,
        tipo_comunicacion: 'SUMINISTROS',
        fecha_hora: new Date().toISOString()
      };

      await axios.post(`${API_BASE_URL}/registros_comunicacion/crear`, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPedidoManual('');
      Alert.alert('✅ Enviado', 'Pedido manual registrado con éxito.');
      cargarDatos();
    } catch (err) {
      console.error('Error enviando pedido manual:', err);
      Alert.alert('Error', 'No se pudo registrar la solicitud en la bitácora táctica.');
    } finally {
      setEnviandoManual(false);
    }
  }

  // ── Obtener Icono de Solicitud para Historial ────────────────────────────
  function getSolicitudIcon(msg = '') {
    const text = msg.toUpperCase();
    if (text.includes('PERSONAL')) return { name: 'account-multiple', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
    if (text.includes('CISTERNA')) return { name: 'water', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    if (text.includes('COMBUSTIBLE')) return { name: 'gas-station', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.12)' };
    if (text.includes('AMBULANCIA')) return { name: 'ambulance', color: '#fca5a5', bg: 'rgba(252, 165, 165, 0.12)' };
    if (text.includes('RESCATE')) return { name: 'hammer-wrench', color: '#34d399', bg: 'rgba(52, 211, 153, 0.12)' };
    return { name: 'package-variant', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)' };
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>PEDIDOS DE SUMINISTRO</Text>
        <TouchableOpacity style={styles.botonRefresh} onPress={cargarDatos}>
          <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Emergencia Activa Card */}
        <Text style={styles.labelSeccion}>Contexto de Emergencia</Text>
        {alertaActiva ? (
          <View style={styles.activeEmergencyCard}>
            <View style={styles.emergencyCardHeader}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#dc2626" />
              <Text style={styles.emergencyLabel}>INCIDENTE ACTIVO EN VIVO</Text>
            </View>
            <Text style={styles.emergencyTitle}>
              {(alertaActiva.subCategoriaAlerta?.nombre_sub_categoria || alertaActiva.subCategoriaAlerta?.nombre || alertaActiva.observaciones || 'INCIDENTE').toUpperCase()}
            </Text>
            <Text style={styles.emergencySub}>Ubicación: {alertaActiva.ubicacion || '—'}</Text>
          </View>
        ) : (
          <View style={[styles.activeEmergencyCard, { borderLeftColor: '#475569' }]}>
            <View style={styles.emergencyCardHeader}>
              <MaterialCommunityIcons name="shield-check" size={16} color="#475569" />
              <Text style={[styles.emergencyLabel, { color: '#64748b' }]}>SITUACIÓN CONTROLADA</Text>
            </View>
            <Text style={[styles.emergencyTitle, { color: '#64748b' }]}>SIN EMERGENCIAS ACTIVAS</Text>
            <Text style={styles.emergencySub}>Para solicitar suministros, debe existir un despacho en curso.</Text>
          </View>
        )}

        {/* Grilla de refuerzos */}
        <Text style={styles.labelSeccion}>Solicitar Refuerzo</Text>
        <View style={styles.grilla}>
          {TIPOS_REFUERZO.map((item) => (
            <TouchableOpacity
              key={item.tipo}
              style={styles.cardRefuerzo}
              onPress={() => openRequestModal(item)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconoRefuerzo, { backgroundColor: `${item.color}15` }]}>
                <MaterialCommunityIcons name={item.icono} size={24} color={item.color} />
              </View>
              <Text style={styles.nombreRefuerzo}>{item.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de solicitar personal */}
        <TouchableOpacity
          onPress={() => openRequestModal(null)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#dc2626', '#b91c1c']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.botonPersonal}
          >
            <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
            <Text style={styles.textoBotonPersonal}>SOLICITAR REFUERZO DE PERSONAL</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Campo de Entrada Manual */}
        <Text style={[styles.labelSeccion, { marginTop: Spacing.xl }]}>
          Pedido Manual / Aclaraciones
        </Text>
        <View style={styles.manualRequestCard}>
          <TextInput
            style={styles.inputManual}
            placeholder="Ingrese elementos no predefinidos o aclaraciones adicionales..."
            placeholderTextColor="#475569"
            multiline
            numberOfLines={4}
            value={pedidoManual}
            onChangeText={setPedidoManual}
          />
          <TouchableOpacity
            style={[styles.botonManualEnviar, (!pedidoManual.trim() || enviandoManual) && { opacity: 0.6 }]}
            onPress={enviarPedidoManual}
            disabled={enviandoManual}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#dc2626', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientBotonManual}
            >
              {enviandoManual ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="send" size={16} color="#fff" />
                  <Text style={styles.textoBotonManual}>ENVIAR PEDIDO MANUAL</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Historial de solicitudes */}
        <Text style={[styles.labelSeccion, { marginTop: Spacing.xl }]}>
          Bitácora de Pedidos Enviados
        </Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#dc2626" style={{ marginVertical: 20 }} />
        ) : solicitudes.length === 0 ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="inbox-outline" size={36} color="#334155" />
            <Text style={styles.textoVacio}>Sin pedidos cargados para esta emergencia</Text>
          </View>
        ) : (
          solicitudes.map((sol, idx) => {
            const iconInfo = getSolicitudIcon(sol.mensaje);
            return (
              <TacticalCard key={sol.id || idx}>
                <View style={styles.filaSolicitud}>
                  <View style={[styles.iconoSolicitud, { backgroundColor: iconInfo.bg }]}>
                    <MaterialCommunityIcons
                      name={iconInfo.name}
                      size={20}
                      color={iconInfo.color}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tituloSolicitud} numberOfLines={2}>
                      {sol.mensaje.replace(/[\[\]]/g, '') || sol.tipo_comunicacion}
                    </Text>
                    <Text style={styles.subtituloSolicitud}>
                      {sol.usuarioId?.bombero ? `${sol.usuarioId.bombero.nombre} ${sol.usuarioId.bombero.apellido}` : 'SISTEMA'} · {tiempoTranscurrido(sol.fecha_hora)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="check-all" size={18} color="#10b981" />
                </View>
              </TacticalCard>
            );
          })
        )}
      </ScrollView>

      {/* Modal de Carga de Pedido Unificado */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModal}>
            <View style={styles.headerModal}>
              <Text style={styles.tituloModal}>
                {selectedRefuerzo ? `Solicitar ${selectedRefuerzo.nombre}` : 'Solicitar Personal'}
              </Text>
              <TouchableOpacity style={styles.cerrarModal} onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelModal}>Cantidad solicitada</Text>
            <View style={styles.filaCantidad}>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => setCantidad(c => Math.max(1, c - 1))}
              >
                <MaterialCommunityIcons name="minus" size={18} color="#94a3b8" />
              </TouchableOpacity>
              <Text style={styles.valorCantidad}>{cantidad}</Text>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => setCantidad(c => c + 1)}
              >
                <MaterialCommunityIcons name="plus" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelModal}>Detalles / Motivo táctico</Text>
            <TextInput
              style={styles.inputMotivo}
              placeholder="Ej: Se requieren litros extra de agua, apoyo flanco norte..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              value={observaciones}
              onChangeText={setObservaciones}
            />

            <TouchableOpacity
              style={[styles.botonEnviarModal, enviando && { opacity: 0.7 }]}
              onPress={enviarSolicitud}
              disabled={enviando}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#dc2626', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientModal}
              >
                {enviando ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="#fff" />
                    <Text style={styles.textoEnviarModal}>ENVIAR PEDIDO A CENTRAL</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
