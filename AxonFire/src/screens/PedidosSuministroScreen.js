import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius } from '../theme';
import TacticalCard from '../components/TacticalCard';
import StatusBadge from '../components/StatusBadge';
import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;

// Los tipos de refuerzo que el bombero puede solicitar
const TIPOS_REFUERZO = [
  { icono: 'water',         nombre: 'CISTERNA',    color: Colors.alertBlue,     tipo: 'cisterna'    },
  { icono: 'gas-station',   nombre: 'COMBUSTIBLE', color: Colors.warningOrange, tipo: 'combustible' },
  { icono: 'ambulance',     nombre: 'AMBULANCIA',  color: Colors.primary,       tipo: 'ambulancia'  },
  { icono: 'hammer-wrench', nombre: 'RESCATE',     color: Colors.secondary,     tipo: 'rescate'     },
];

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return '';
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  return `Hace ${Math.floor(min / 60)} hs`;
}

export default function PedidosSuministroScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  const token = route?.params?.token || '';
  const usuarioId = route?.params?.usuarioId || '';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // ── Estado ────────────────────────────────────────────────────────────────
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  // Cuál botón de refuerzo está enviando (para mostrar spinner solo en ese)
  const [enviandoTipo, setEnviandoTipo] = useState(null);

  // Modal de solicitar personal
  const [modalVisible, setModalVisible] = useState(false);
  const [cantidadPersonal, setCantidadPersonal] = useState(1);
  const [motivoPersonal, setMotivoPersonal] = useState('');
  const [enviandoPersonal, setEnviandoPersonal] = useState(false);

  // ── Cargar historial de solicitudes ──────────────────────────────────────
  async function cargarSolicitudes() {
    setCargando(true);
    try {
      // Usamos el endpoint de respuestas como proxy temporal de solicitudes.
      // En un futuro el backend debería tener un módulo propio de "solicitudes de recursos".
      const res = await fetch(`${BASE_URL}/respuestas_alertas/`, { headers });
      let data = [];
      if (res.ok) {
        data = await res.json();
      } else {
        console.log(`Solicitudes API returned status ${res.status}, using empty fallback.`);
      }

      // Filtramos las que creó este usuario
      const mias = (Array.isArray(data) ? data : []).filter(
        (r) => r.usuario_id === usuarioId || r.usuarioId === usuarioId || !usuarioId
      );
      setSolicitudes(mias);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  // ── Enviar solicitud de refuerzo ────────────────────────────────────────
  function pedirRefuerzo(refuerzo) {
    Alert.alert(
      `Solicitar ${refuerzo.nombre}`,
      `¿Confirmás que necesitás ${refuerzo.nombre} en tu posición?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solicitar',
          onPress: async () => {
            setEnviandoTipo(refuerzo.tipo);
            try {
              const body = {
                ubicacion: `Solicitud de ${refuerzo.nombre}`,
                observaciones: `Pedido de refuerzo: ${refuerzo.nombre}. Enviado desde la app.`,
                usuario_alta_alerta: usuarioId,
                destinatariosIds: [],
              };

              const res = await fetch(`${BASE_URL}/alerta/crear-con-notificacion`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
              });

              if (!res.ok) throw new Error(`Error ${res.status}`);

              Alert.alert('✅ Enviado', `Pedido de ${refuerzo.nombre} enviado al comando.`);
              cargarSolicitudes();
            } catch (err) {
              console.error('Error enviando solicitud:', err);
              Alert.alert('Error', 'No se pudo enviar. Intentá de nuevo.');
            } finally {
              setEnviandoTipo(null);
            }
          },
        },
      ]
    );
  }

  // ── Enviar solicitud de personal ──────────────────────────────────────────
  async function pedirPersonal() {
    if (!motivoPersonal.trim()) {
      Alert.alert('Falta el motivo', 'Escribí por qué necesitás refuerzo de personal.');
      return;
    }

    setEnviandoPersonal(true);
    try {
      const body = {
        ubicacion: 'Solicitud de personal adicional',
        observaciones: `Se solicitan ${cantidadPersonal} bombero(s). Motivo: ${motivoPersonal}`,
        usuario_alta_alerta: usuarioId,
        destinatariosIds: [],
      };

      const res = await fetch(`${BASE_URL}/alerta/crear-con-notificacion`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      setModalVisible(false);
      setCantidadPersonal(1);
      setMotivoPersonal('');
      Alert.alert('✅ Enviado', 'Pedido de personal enviado al comando.');
      cargarSolicitudes();
    } catch (err) {
      console.error('Error enviando pedido de personal:', err);
      Alert.alert('Error', 'No se pudo enviar. Intentá de nuevo.');
    } finally {
      setEnviandoPersonal(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.botonVolver} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color="#263238" />
        </TouchableOpacity>
        <Text style={styles.tituloHeader}>Pedidos de Suministro</Text>
        <TouchableOpacity style={styles.botonRefresh} onPress={cargarSolicitudes}>
          <MaterialCommunityIcons name="refresh" size={20} color="#263238" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.contenido, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Grilla de refuerzos */}
        <Text style={styles.labelSeccion}>SOLICITAR REFUERZO</Text>
        <View style={styles.grilla}>
          {TIPOS_REFUERZO.map((item) => (
            <TouchableOpacity
              key={item.tipo}
              style={[
                styles.cardRefuerzo,
                enviandoTipo === item.tipo && { opacity: 0.6 },
              ]}
              onPress={() => pedirRefuerzo(item)}
              disabled={enviandoTipo !== null}
              activeOpacity={0.7}
            >
              {enviandoTipo === item.tipo ? (
                <ActivityIndicator size="small" color={item.color} />
              ) : (
                <View style={[styles.iconoRefuerzo, { backgroundColor: `${item.color}18` }]}>
                  <MaterialCommunityIcons name={item.icono} size={24} color={item.color} />
                </View>
              )}
              <Text style={styles.nombreRefuerzo}>{item.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botón de solicitar personal */}
        <TouchableOpacity
          style={{ marginTop: Spacing.lg }}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.primaryGradientStart, Colors.primaryGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.botonPersonal}
          >
            <MaterialCommunityIcons name="account-plus" size={22} color="#fff" />
            <Text style={styles.textoBotonPersonal}>SOLICITAR PERSONAL</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Historial de solicitudes */}
        <Text style={[styles.labelSeccion, { marginTop: Spacing.xl }]}>
          SOLICITUDES ENVIADAS
        </Text>

        {cargando ? (
          <ActivityIndicator size="small" color="#af101a" style={{ marginVertical: 16 }} />
        ) : solicitudes.length === 0 ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="inbox-outline" size={40} color="#cfd8dc" />
            <Text style={styles.textoVacio}>Todavía no enviaste ninguna solicitud</Text>
          </View>
        ) : (
          solicitudes.map((sol, idx) => (
            <TacticalCard key={sol.id || idx}>
              <View style={styles.filaSolicitud}>
                <View style={[styles.iconoSolicitud, { backgroundColor: `${Colors.alertBlue}18` }]}>
                  <MaterialCommunityIcons name="send-check" size={20} color={Colors.alertBlue} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tituloSolicitud} numberOfLines={1}>Solicitud enviada</Text>
                  <Text style={styles.subtituloSolicitud}>
                    {sol.estado_respuesta || 'PENDIENTE'} · {tiempoTranscurrido(sol.fecha_hora)}
                  </Text>
                </View>
                {sol.estado_respuesta === 'ACEPTADO' ? (
                  <MaterialIcons name="check-circle" size={22} color={Colors.success} />
                ) : (
                  <MaterialCommunityIcons name="sync" size={18} color={Colors.onSurfaceVariant} />
                )}
              </View>
            </TacticalCard>
          ))
        )}
      </ScrollView>

      {/* Modal de solicitar personal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.contenedorModal}>
            <View style={styles.headerModal}>
              <Text style={styles.tituloModal}>Solicitar Personal</Text>
              <TouchableOpacity style={styles.cerrarModal} onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={22} color="#263238" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelModal}>Cantidad de bomberos</Text>
            <View style={styles.filaCantidad}>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => setCantidadPersonal(c => Math.max(1, c - 1))}
              >
                <MaterialCommunityIcons name="minus" size={20} color="#263238" />
              </TouchableOpacity>
              <Text style={styles.valorCantidad}>{cantidadPersonal}</Text>
              <TouchableOpacity
                style={styles.botonCantidad}
                onPress={() => setCantidadPersonal(c => c + 1)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#263238" />
              </TouchableOpacity>
            </View>

            <Text style={styles.labelModal}>Motivo</Text>
            <TextInput
              style={styles.inputMotivo}
              placeholder="Ej: Necesito refuerzo en el flanco norte..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={motivoPersonal}
              onChangeText={setMotivoPersonal}
            />

            <TouchableOpacity
              style={[styles.botonEnviarModal, enviandoPersonal && { opacity: 0.7 }]}
              onPress={pedirPersonal}
              disabled={enviandoPersonal}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#af101a', '#d32f2f']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientModal}
              >
                {enviandoPersonal ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={18} color="#fff" />
                    <Text style={styles.textoEnviarModal}>ENVIAR SOLICITUD</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm,
  },
  botonVolver: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  tituloHeader: { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  botonRefresh: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },

  contenido: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  labelSeccion: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginBottom: Spacing.md,
  },

  grilla: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cardRefuerzo: {
    width: '48%', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Radius.xxl, paddingVertical: Spacing.lg,
    alignItems: 'center', gap: 8,
  },
  iconoRefuerzo: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  nombreRefuerzo: {
    fontSize: 10, fontWeight: '700', letterSpacing: 0.6,
    color: Colors.onSurface, textTransform: 'uppercase',
  },

  botonPersonal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 18, borderRadius: Radius.xxl,
    ...Platform.select({
      ios: { shadowColor: '#af101a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0px 6px 16px rgba(175,16,26,0.3)' },
    }),
  },
  textoBotonPersonal: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 0.6 },

  filaSolicitud: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconoSolicitud: {
    width: 38, height: 38, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  tituloSolicitud: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
  subtituloSolicitud: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8,
    color: Colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 1,
  },

  centrado: { alignItems: 'center', paddingVertical: 28, gap: 8 },
  textoVacio: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },

  // Modal
  fondoModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  contenedorModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  headerModal: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 20,
  },
  tituloModal: { fontSize: 20, fontWeight: '900', color: '#263238' },
  cerrarModal: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  labelModal: {
    fontSize: 12, fontWeight: '700', color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, marginTop: 12,
  },
  filaCantidad: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 4 },
  botonCantidad: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  valorCantidad: { fontSize: 28, fontWeight: '900', color: '#263238', minWidth: 40, textAlign: 'center' },
  inputMotivo: {
    backgroundColor: '#f8fafc', borderRadius: 14, padding: 14,
    fontSize: 14, color: '#263238', minHeight: 80,
    textAlignVertical: 'top', marginBottom: 16,
  },
  botonEnviarModal: { borderRadius: Radius.xxl, overflow: 'hidden' },
  gradientModal: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 18,
  },
  textoEnviarModal: { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 0.6 },
});
