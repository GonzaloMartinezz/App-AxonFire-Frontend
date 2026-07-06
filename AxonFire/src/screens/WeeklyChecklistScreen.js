import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DamageReportField, { isDamageReportComplete } from '../components/DamageReportField';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import SelectorBomberos from '../components/SelectorBomberos';
import { useNotifications } from '../context/NotificationContext';
import { styles } from '../styles/WeeklyChecklistScreenStyles';
import ControlFluidosScreen from './ControlFluidosScreen';
import MantenimientoHidraulicoScreen from './MantenimientoHidraulicoScreen';

// ── Helpers ────────────────────────────────────────────────────────────────

function daysSinceDate(dateStr) {
  if (!dateStr) return Infinity;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function fechaHoy() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).toUpperCase();
}

function esDeHoy(fechaISO) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  const hoy = new Date();
  return (
    fecha.getDate() === hoy.getDate() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

function esDeAyer(fechaISO) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  return (
    fecha.getDate() === ayer.getDate() &&
    fecha.getMonth() === ayer.getMonth() &&
    fecha.getFullYear() === ayer.getFullYear()
  );
}

// Map tool names to icons for a nicer UI
function getToolIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('extintor')) return 'fire-extinguisher';
  if (n.includes('manguera')) return 'pipe';
  if (n.includes('hacha')) return 'axe';
  if (n.includes('radio') || n.includes('comunicaci')) return 'radio-handheld';
  if (n.includes('casco')) return 'hard-hat';
  if (n.includes('motosierra')) return 'chainsaw';
  if (n.includes('era') || n.includes('respirat') || n.includes('scba')) return 'diving-scuba-tank';
  if (n.includes('escalera')) return 'stairs';
  if (n.includes('soga') || n.includes('cuerda')) return 'jump-rope';
  if (n.includes('linterna') || n.includes('luz')) return 'flashlight';
  if (n.includes('pala')) return 'shovel';
  if (n.includes('piton') || n.includes('pitón')) return 'water-pump';
  return 'tools'; // default fallback
}

// Icon resolver for daily checklist sectors
function getIconoDiario(nombre = '') {
  const n = nombre.toLowerCase();
  if (n.includes('manguera')) return 'pipe';
  if (n.includes('extintor')) return 'fire-extinguisher';
  if (n.includes('motosierra')) return 'saw-blade';
  if (n.includes('hacha')) return 'axe';
  if (n.includes('hidrau')) return 'car-wrench';
  if (n.includes('casco')) return 'hard-hat';
  if (n.includes('era') || n.includes('autónomo')) return 'diving-scuba-tank';
  if (n.includes('piton')) return 'water';
  if (n.includes('cuerda') || n.includes('soga')) return 'rope';
  if (n.includes('escalera')) return 'stairs';
  return 'toolbox-outline';
}

function getMockTools() {
  return [
    { id: 't1', nombre_herramienta: 'EXTINTOR ABC 10KG', cantidad_disponible: 1 },
    { id: 't2', nombre_herramienta: 'MANGUERA DE COMUNICACIÓN 2.5"', cantidad_disponible: 1 },
    { id: 't3', nombre_herramienta: 'HACHA TÁCTICA', cantidad_disponible: 1 },
    { id: 't4', nombre_herramienta: 'RADIO HANDHELD VHF', cantidad_disponible: 1 },
    { id: 't5', nombre_herramienta: 'CASCO DE PROTECCIÓN F1', cantidad_disponible: 1 },
    { id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5 },
    { id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2 }
  ];
}

function groupDetailsBySector(detalles) {
  const groups = {};
  if (!Array.isArray(detalles)) return [];
  detalles.forEach(d => {
    const sectorName = d.inventarioId?.sectorId?.nombre_sector || d.inventarioId?.sector?.nombre_sector || 'SIN SECTOR';
    if (!groups[sectorName]) {
      groups[sectorName] = [];
    }
    groups[sectorName].push(d);
  });
  return Object.entries(groups).map(([nombre_sector, items]) => ({
    nombre_sector,
    items
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WeeklyChecklistScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user, token } = useAuth();
  const userId = user?.id || '';
  const { addNotification } = useNotifications();

  // Parámetros de navegación para el tab diario (opcionales)
  const camionId = route?.params?.camionId || null;
  const camionNombre = route?.params?.camionNombre || 'MÓVIL';

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Tabs: 'inventario' | 'mantenimiento' | 'diario'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || (camionId ? 'diario' : 'inventario'));

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
    if (route?.params?.camionId) {
      setCamionSeleccionado({
        id: route.params.camionId,
        nombre_camion: route.params.camionNombre || 'MÓVIL'
      });
    }
  }, [route?.params?.initialTab, route?.params?.camionId, route?.params?.camionNombre]);

  // ── State for Inventory Tab ─────────────────────────────────────────────
  const [herramientas, setHerramientas] = useState([]);
  const [inventoryItems, setInventoryItems] = useState({}); // { [id]: { status, justification } }
  const [forceShowBaseInventoryList, setForceShowBaseInventoryList] = useState(false);
  const [submittingInventory, setSubmittingInventory] = useState(false);
  const [historialCuartel, setHistorialCuartel] = useState([]);
  const [ultimoCheckCuartel, setUltimoCheckCuartel] = useState(null);
  const [cargandoHistorialCuartel, setCargandoHistorialCuartel] = useState(false);
  const [auditCuartelModalVisible, setAuditCuartelModalVisible] = useState(false);
  const [checklistCuartelSeleccionado, setChecklistCuartelSeleccionado] = useState(null);
  const [historialModalVisible, setHistorialModalVisible] = useState(false);

  // ── State for Maintenance Tab ───────────────────────────────────────────
  const [maintenance, setMaintenance] = useState({
    encendido: null, // 'ok' | 'fail'
    combustible: null, // 'ok' | 'fail'
    aceite: null, // 'ok' | 'fail'
    encendidoJustification: '',
    combustibleJustification: '',
    aceiteJustification: '',
  });
  const [blocked, setBlocked] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [lastCheckDate, setLastCheckDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submittingMaint, setSubmittingMaint] = useState(false);
  const [maintBypassed, setMaintBypassed] = useState(false);

  const isMaintBlocked = blocked && !maintBypassed;

  // ── State for Daily Checklist Tab ───────────────────────────────────────
  const [sectores, setSectores] = useState([]);
  const [faltantesAyer, setFaltantesAyer] = useState(new Set());
  const [estadoItemsDiario, setEstadoItemsDiario] = useState({});
  const [observacionesDiario, setObservacionesDiario] = useState({});
  const [acompanantes, setAcompanantes] = useState([]);
  const [cargandoDiario, setCargandoDiario] = useState(false);
  const [guardandoDiario, setGuardandoDiario] = useState(false);
  const [errorDiario, setErrorDiario] = useState(null);

  // Listado de camiones disponibles para seleccionar en el tab diario
  const [camionesDisponibles, setCamionesDisponibles] = useState([]);
  const [camionSeleccionado, setCamionSeleccionado] = useState(
    camionId ? { id: camionId, nombre_camion: camionNombre } : null
  );
  const [cargandoCamiones, setCargandoCamiones] = useState(false);

  // Modal de auditoría del último chequeo
  const [ultimoCheckModalVisible, setUltimoCheckModalVisible] = useState(false);
  const [ultimoCheckSeleccionado, setUltimoCheckSeleccionado] = useState(null);

  // Estado para colapsar/desplegar inventario base
  const [baseInventoryExpanded, setBaseInventoryExpanded] = useState(false);

  // ── Load data on mount ──────────────────────────────────────────────────

  useEffect(() => {
    loadData();
  }, []);

  const fetchHistorialCuartel = async () => {
    setCargandoHistorialCuartel(true);
    try {
      const res = await fetch(`${API_BASE_URL}/checklist_cuartel/?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          data.sort((a, b) => new Date(b.fecha_control) - new Date(a.fecha_control));
          setHistorialCuartel(data);
          if (data.length > 0) {
            setUltimoCheckCuartel(data[0]);
          } else {
            setUltimoCheckCuartel(null);
          }
        }
      }
    } catch (err) {
      console.log('Error al cargar historial de cuartel:', err);
    } finally {
      setCargandoHistorialCuartel(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch tools (ensuring base items like radios and chainsaw are loaded)
      let tools = [];
      try {
        const toolsRes = await fetch(`${API_BASE_URL}/herramientas/?t=${Date.now()}`, { headers });
        if (toolsRes.ok) {
          const data = await toolsRes.json();
          tools = Array.isArray(data) ? data : [];
        }
      } catch (err) {
        console.log('Error loading tools from server, using local fallback:', err);
      }

      if (tools.length === 0) {
        tools = getMockTools();
      } else {
        const hasRadio = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('RADIO DE REPUESTO'));
        const hasMotosierra = tools.some(t => t.nombre_herramienta?.toUpperCase().includes('MOTOSIERRA DE CUARTEL'));

        if (!hasRadio) {
          tools.push({ id: 'fixed_radio', nombre_herramienta: 'RADIO DE REPUESTO', cantidad_disponible: 5 });
        }
        if (!hasMotosierra) {
          tools.push({ id: 'fixed_motosierra', nombre_herramienta: 'MOTOSIERRA DE CUARTEL', cantidad_disponible: 2 });
        }
      }
      setHerramientas(tools);

      // Initialize inventory status mapping
      const initialInv = {};
      tools.forEach(tool => {
        initialInv[tool.id] = { status: null, justification: '' };
      });
      setInventoryItems(initialInv);
      setForceShowBaseInventoryList(false);

      // 2. Check 7-day lockout for Maintenance Tab
      let mHist = [];
      try {
        const localMHist = await AsyncStorage.getItem('weekly_maintenance_history');
        if (localMHist) {
          mHist = JSON.parse(localMHist);
        }
      } catch (e) {
        console.log('Error reading maintenance history:', e);
      }

      mHist.sort((a, b) => new Date(b.fecha_control) - new Date(a.fecha_control));

      if (mHist.length > 0) {
        const lastDate = mHist[0].fecha_control;
        const days = daysSinceDate(lastDate);
        setLastCheckDate(lastDate);
        if (days < 7) {
          setBlocked(true);
          setDaysRemaining(7 - days);
        } else {
          setBlocked(false);
          setDaysRemaining(0);
        }
      } else {
        setBlocked(false);
        setDaysRemaining(0);
      }

      // 3. Load available trucks for Daily tab selector
      await cargarCamionesDisponibles();

      // 4. Load base inventory history
      await fetchHistorialCuartel();

    } catch (err) {
      console.warn('Error loading checklist data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ── Daily Checklist: Load available trucks ──────────────────────────────

  async function cargarCamionesDisponibles() {
    setCargandoCamiones(true);
    try {
      const res = await fetch(`${API_BASE_URL}/camiones/activos?t=${Date.now()}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const camiones = Array.isArray(data) ? data : [];

        // Cargar en paralelo el historial más reciente para cada camión
        const camionesConHistorial = await Promise.all(
          camiones.map(async (camion) => {
            try {
              const histRes = await fetch(`${API_BASE_URL}/checklist/historial/${camion.id}?t=${Date.now()}`, { headers });
              if (histRes.ok) {
                const histData = await histRes.json();
                if (Array.isArray(histData) && histData.length > 0) {
                  // Guardar el chequeo más reciente
                  return { ...camion, ultimoCheck: histData[0] };
                }
              }
            } catch (histErr) {
              console.log('Error cargando historial de camión:', camion.id, histErr);
            }
            return { ...camion, ultimoCheck: null };
          })
        );

        setCamionesDisponibles(camionesConHistorial);
      }
    } catch (err) {
      console.log('Error cargando camiones para tab diario:', err);
    } finally {
      setCargandoCamiones(false);
    }
  }

  // ── Daily Checklist: Select truck and load its inventory ────────────────

  async function seleccionarCamion(camion) {
    const tieneControlHoy = camion.ultimoCheck && esDeHoy(camion.ultimoCheck.fecha_control);
    if (tieneControlHoy) {
      const bomberoNombre = camion.ultimoCheck.usuarioId?.bombero
        ? `${camion.ultimoCheck.usuarioId.bombero.nombre} ${camion.ultimoCheck.usuarioId.bombero.apellido}`
        : camion.ultimoCheck.usuarioId?.nombre_usuario || 'un bombero';

      const horaText = new Date(camion.ultimoCheck.fecha_control).toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      Alert.alert(
        '⚠️ Móvil ya Controlado',
        `El ${camion.nombre_camion?.toUpperCase()} ya fue controlado hoy a las ${horaText} por ${bomberoNombre}.\n\n¿Deseas iniciar un nuevo control de inventario de todas formas?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Iniciar Nuevo Control', style: 'destructive', onPress: () => setCamionSeleccionado(camion) }
        ]
      );
    }

    setCamionSeleccionado(camion);
  }

  useEffect(() => {
    if (camionSeleccionado && camionSeleccionado.id) {
      setCargandoDiario(true);
      setErrorDiario(null);
      setSectores([]);
      setEstadoItemsDiario({});
      setObservacionesDiario({});
      setFaltantesAyer(new Set());

      Promise.all([
        cargarInventarioDiario(camionSeleccionado.id),
        cargarFaltantesAyer(camionSeleccionado.id),
      ])
        .catch(err => {
          setErrorDiario('No se pudo conectar al servidor.');
        })
        .finally(() => {
          setCargandoDiario(false);
        });
    }
  }, [camionSeleccionado?.id]);

  async function cargarInventarioDiario(idCamion) {
    const res = await fetch(
      `${API_BASE_URL}/camiones_inventario/camion/${idCamion}/agrupado?t=${Date.now()}`,
      { headers }
    );
    if (!res.ok) throw new Error(`Error ${res.status}`);
    const data = await res.json();

    // Transform Record<string, InventarioItem[]> to Array of sectors
    let lista = [];
    if (Array.isArray(data)) {
      lista = data;
    } else if (data && typeof data === 'object') {
      lista = Object.entries(data).map(([nombre_sector, herramientas]) => ({
        nombre_sector,
        herramientas: (herramientas || []).map(item => ({
          id: item.inventarioId,
          herramienta: item.herramienta,
          cantidad_herramienta: item.cantidad
        }))
      }));
    }

    setSectores(lista);

    const estadoInicial = {};
    lista.forEach((sector) => {
      (sector.herramientas || []).forEach((h) => { estadoInicial[h.id] = null; });
    });
    setEstadoItemsDiario(estadoInicial);
  }

  async function cargarFaltantesAyer(idCamion) {
    try {
      const res = await fetch(`${API_BASE_URL}/checklist/historial/${idCamion}?t=${Date.now()}`, { headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const historial = await res.json();
      if (!Array.isArray(historial) || historial.length === 0) return;

      const checklistAyer = historial.find(
        (c) => esDeAyer(c.fecha_control) || (!esDeHoy(c.fecha_control))
      );
      if (!checklistAyer || !Array.isArray(checklistAyer.detalles)) return;

      const idsConFaltante = new Set();
      checklistAyer.detalles.forEach((detalle) => {
        if (detalle.controlado === 'FALTANTE') {
          const invId = typeof detalle.inventarioId === 'object'
            ? detalle.inventarioId?.id
            : detalle.inventarioId;
          if (invId) idsConFaltante.add(invId);
        }
      });
      setFaltantesAyer(idsConFaltante);
    } catch (err) {
      console.warn('No se pudo cargar historial de faltantes:', err);
    }
  }

  // ── Daily Checklist: Mark items ─────────────────────────────────────────

  function marcarItemDiario(inventarioId, nuevoEstado) {
    setEstadoItemsDiario((prev) => ({ ...prev, [inventarioId]: nuevoEstado }));
    if (nuevoEstado !== 'FALTANTE') {
      setObservacionesDiario((prev) => { const n = { ...prev }; delete n[inventarioId]; return n; });
    }
  }

  function setObservacionDiario(inventarioId, texto) {
    setObservacionesDiario((prev) => ({ ...prev, [inventarioId]: texto }));
  }

  // ── Daily Checklist: Save ───────────────────────────────────────────────

  async function guardarChecklistDiario() {
    const sinMarcar = Object.entries(estadoItemsDiario).filter(([, v]) => v === null);
    if (sinMarcar.length > 0) {
      Alert.alert('Items sin marcar', `Hay ${sinMarcar.length} herramienta(s) sin chequear.`);
      return;
    }
    const faltantesSinObs = Object.entries(estadoItemsDiario)
      .filter(([id, v]) => v === 'FALTANTE' && !observacionesDiario[id]?.trim());
    if (faltantesSinObs.length > 0) {
      Alert.alert('Observación requerida', 'Los ítems FALTANTE necesitan una observación.');
      return;
    }

    setGuardandoDiario(true);
    try {
      const detalles = Object.entries(estadoItemsDiario).map(([inventarioId, controlado]) => ({
        inventarioId,
        controlado,
        ...(controlado === 'FALTANTE' ? { observaciones: observacionesDiario[inventarioId] } : {}),
      }));

      const body = {
        camionId: camionSeleccionado.id,
        detalles,
        // AX-13: Mapeo de bomberos acompañantes asignados al móvil
        acompanantesIds: acompanantes.map(b => b.usuario_id),
      };

      const res = await fetch(`${API_BASE_URL}/checklist/guardar`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);

      // Respaldo local offline
      try {
        const localHist = await AsyncStorage.getItem('daily_checklist_history');
        const history = localHist ? JSON.parse(localHist) : [];
        history.push({ ...body, fecha_control: new Date().toISOString() });
        await AsyncStorage.setItem('daily_checklist_history', JSON.stringify(history));
      } catch (e) {
        console.log('Error guardando copia de respaldo local:', e);
      }

      // ── OPTIMISTIC UPDATE: Actualizar la interfaz de manera inmediata ──
      const nuevoCheck = {
        fecha_control: new Date().toISOString(),
        usuarioId: {
          id: userId,
          nombre_usuario: user?.nombre_usuario || 'Bombero',
          bombero: user?.bombero ? {
            nombre: user.bombero.nombre,
            apellido: user.bombero.apellido
          } : null
        },
        detalles: Object.entries(estadoItemsDiario).map(([inventarioId, controlado]) => {
          let toolObj = null;
          let sectorObj = null;
          for (const sector of sectores) {
            const found = sector.herramientas?.find(h => h.id === inventarioId);
            if (found) {
              toolObj = found;
              sectorObj = sector;
              break;
            }
          }
          return {
            id: Math.random().toString(),
            controlado,
            observaciones: controlado === 'FALTANTE' ? observacionesDiario[inventarioId] : null,
            inventarioId: {
              id: inventarioId,
              herramientaId: toolObj ? {
                id: toolObj.id,
                nombre_herramienta: toolObj.herramienta?.nombre_herramienta || 'Herramienta'
              } : null,
              herramienta: toolObj ? {
                nombre_herramienta: toolObj.herramienta?.nombre_herramienta || 'Herramienta'
              } : { nombre_herramienta: 'Herramienta' },
              sectorId: sectorObj ? {
                id: sectorObj.nombre_sector,
                nombre_sector: sectorObj.nombre_sector
              } : null,
              sector: sectorObj ? {
                nombre_sector: sectorObj.nombre_sector
              } : { nombre_sector: 'Sector' }
            }
          };
        })
      };

      setCamionesDisponibles(prev => prev.map(c => {
        if (c.id === camionSeleccionado.id) {
          return { ...c, ultimoCheck: nuevoCheck };
        }
        return c;
      }));

      // Refrescar camiones desde la API en segundo plano con cache-buster
      cargarCamionesDisponibles().catch(err => console.log('Error refreshing backend checklist state:', err));

      // RF-03: Emitir notificación para el panel del administrador
      const numFaltantesDiario = detalles.filter(d => d.controlado === 'FALTANTE').length;
      addNotification({
        tipo: 'CONTROL_DIARIO',
        bomberoNombre: user?.bombero ? `${user.bombero.nombre} ${user.bombero.apellido}` : user?.nombre_usuario || 'Bombero',
        recursoNombre: camionSeleccionado?.nombre_camion || 'Móvil',
        tieneFaltantes: numFaltantesDiario > 0,
        cantidadFaltantes: numFaltantesDiario,
      });

      if (Platform.OS === 'web') {
        alert('El checklist diario fue guardado correctamente.');
        // Reset para volver al grid con los datos actualizados
        setCamionSeleccionado(null);
        setSectores([]);
        setEstadoItemsDiario({});
        setObservacionesDiario({});
        setAcompanantes([]);
      } else {
        Alert.alert('✅ Guardado', 'El checklist diario fue guardado correctamente.', [
          {
            text: 'OK', onPress: () => {
              // Reset para volver al grid con los datos actualizados
              setCamionSeleccionado(null);
              setSectores([]);
              setEstadoItemsDiario({});
              setObservacionesDiario({});
              setAcompanantes([]);
            }
          },
        ]);
      }
    } catch (err) {
      console.error('Error guardando checklist:', err);
      if (Platform.OS === 'web') {
        alert('No se pudo guardar el checklist. Intentá de nuevo.');
      } else {
        Alert.alert('Error', 'No se pudo guardar el checklist. Intentá de nuevo.');
      }
    } finally {
      setGuardandoDiario(false);
    }
  }

  // ── Inventory Tab State Update ───────────────────────────────────────────

  const setInventoryStatus = useCallback((id, status) => {
    setInventoryItems(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        status,
        ...(status === 'ok' ? { justification: '' } : {}),
      },
    }));
  }, []);

  const updateInventoryJustification = useCallback((id, text) => {
    setInventoryItems(prev => ({
      ...prev,
      [id]: { ...prev[id], justification: text },
    }));
  }, []);

  const prefillBaseInventoryFromLastCheck = useCallback(() => {
    if (!ultimoCheckCuartel || !Array.isArray(ultimoCheckCuartel.detalles)) return;

    const prefilledInv = {};
    // First, populate all tools with null state
    herramientas.forEach(tool => {
      prefilledInv[tool.id] = { status: null, justification: '' };
    });

    // Then overwrite with values from the last check details
    ultimoCheckCuartel.detalles.forEach(d => {
      const toolId = d.herramienta_id || d.herramientaId || (d.herramienta && d.herramienta.id);
      if (toolId && prefilledInv[toolId] !== undefined) {
        prefilledInv[toolId] = {
          status: d.controlado === 'CHEQUEADO' ? 'ok' : 'fail',
          justification: d.observaciones || ''
        };
      }
    });

    setInventoryItems(prefilledInv);
    setForceShowBaseInventoryList(true);
  }, [ultimoCheckCuartel, herramientas]);

  // ── Inventory Submit Validation ──────────────────────────────────────────

  const allInvChecked = Object.keys(inventoryItems).length > 0 && Object.values(inventoryItems).every(i => i.status !== null);
  const allInvJustified = Object.values(inventoryItems).every(i => {
    if (i.status !== 'fail') return true;
    return isDamageReportComplete(i.justification);
  });
  const canSubmitInventory = allInvChecked && allInvJustified && !submittingInventory;

  const handleSubmitInventory = async () => {
    if (!canSubmitInventory) return;
    setSubmittingInventory(true);
    try {
      const detalles = Object.entries(inventoryItems).map(([herramientaId, data]) => ({
        herramientaId,
        controlado: data.status === 'ok' ? 'CHEQUEADO' : 'FALTANTE',
        ...(data.status === 'fail' && data.justification ? { observaciones: data.justification } : {}),
      }));

      // API Post attempt
      try {
        const res = await fetch(`${API_BASE_URL}/checklist_cuartel/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            usuarioId: userId,
            detalles,
          }),
        });
        if (!res.ok) {
          console.warn('Backend returned error for checklist_cuartel POST:', res.status);
        }
      } catch (err) {
        console.log('Error posting to backend, using local persistence:', err);
      }

      // Save locally to history
      const localHist = await AsyncStorage.getItem('weekly_checklist_history');
      const history = localHist ? JSON.parse(localHist) : [];
      history.push({
        fecha_control: new Date().toISOString(),
        usuarioId: userId,
        detalles,
      });
      await AsyncStorage.setItem('weekly_checklist_history', JSON.stringify(history));

      // ── OPTIMISTIC UPDATE: actualizar "último control" inmediatamente ──
      const nuevoCheckCuartel = {
        id: `temp-${Date.now()}`,
        fecha_control: new Date().toISOString(),
        usuario: {
          id: userId,
          nombre_usuario: user?.nombre_usuario || 'Bombero',
          bombero: user?.bombero || null,
        },
        detalles,
      };
      setUltimoCheckCuartel(nuevoCheckCuartel);
      setHistorialCuartel(prev => [nuevoCheckCuartel, ...prev]);

      // Reset inventory form
      const resetInv = {};
      herramientas.forEach(tool => {
        resetInv[tool.id] = { status: null, justification: '' };
      });
      setInventoryItems(resetInv);
      setForceShowBaseInventoryList(false);

      // Refrescar desde backend en segundo plano
      fetchHistorialCuartel().catch(err => console.log('Error refreshing cuartel history:', err));

      // RF-03: Emitir notificación para el panel del administrador
      const numFaltantesCuartel = detalles.filter(d => d.controlado === 'FALTANTE').length;
      addNotification({
        tipo: 'CONTROL_CUARTEL',
        bomberoNombre: user?.bombero ? `${user.bombero.nombre} ${user.bombero.apellido}` : user?.nombre_usuario || 'Bombero',
        recursoNombre: 'Inventario Base',
        tieneFaltantes: numFaltantesCuartel > 0,
        cantidadFaltantes: numFaltantesCuartel,
      });

      if (Platform.OS === 'web') {
        alert('Inventario de base guardado correctamente.');
      } else {
        Alert.alert('Éxito', 'Inventario de base guardado correctamente.');
      }
    } catch (err) {
      console.error('Error saving inventory:', err);
    } finally {
      setSubmittingInventory(false);
    }
  };

  // ── Maintenance Tab Actions & Submit ─────────────────────────────────────

  const setMaintField = (field, val) => {
    setMaintenance(prev => ({
      ...prev,
      [field]: val,
      ...(val === 'ok' ? { [`${field}Justification`]: '' } : {}),
    }));
  };

  const setMaintJustification = (field, text) => {
    setMaintenance(prev => ({
      ...prev,
      [`${field}Justification`]: text,
    }));
  };

  const allMaintChecked = maintenance.encendido !== null && maintenance.combustible !== null && maintenance.aceite !== null;
  const allMaintJustified =
    (maintenance.encendido !== 'fail' || isDamageReportComplete(maintenance.encendidoJustification)) &&
    (maintenance.combustible !== 'fail' || isDamageReportComplete(maintenance.combustibleJustification)) &&
    (maintenance.aceite !== 'fail' || isDamageReportComplete(maintenance.aceiteJustification));

  const canSubmitMaint = allMaintChecked && allMaintJustified && !isMaintBlocked && !submittingMaint;

  const handleSubmitMaintenance = async () => {
    if (!canSubmitMaint) return;
    setSubmittingMaint(true);
    try {
      const payload = {
        fecha_control: new Date().toISOString(),
        usuarioId: userId,
        encendido: maintenance.encendido,
        encendidoJustification: maintenance.encendidoJustification,
        combustible: maintenance.combustible,
        combustibleJustification: maintenance.combustibleJustification,
        aceite: maintenance.aceite,
        aceiteJustification: maintenance.aceiteJustification,
      };

      // Mock API call simulation or post to server
      try {
        await fetch(`${API_BASE_URL}/checklist_mantenimiento/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.log('Mantenimiento endpoint not implemented on backend, using local fallback:', err);
      }

      // Persist to local maintenance checklist history
      const localHist = await AsyncStorage.getItem('weekly_maintenance_history');
      const history = localHist ? JSON.parse(localHist) : [];
      history.push(payload);
      await AsyncStorage.setItem('weekly_maintenance_history', JSON.stringify(history));

      // Lockout state update
      setBlocked(true);
      setMaintBypassed(false); // Reset extraordinary bypass
      setDaysRemaining(7);
      setLastCheckDate(payload.fecha_control);

      if (Platform.OS === 'web') {
        alert('Checklist semanal de mantenimiento registrado correctamente.');
        navigation?.goBack();
      } else {
        Alert.alert('Éxito', 'Checklist semanal de mantenimiento registrado correctamente.', [{ text: 'Aceptar', onPress: () => navigation?.goBack() }]);
      }
    } catch (err) {
      console.error('Error saving maintenance checklist:', err);
    } finally {
      setSubmittingMaint(false);
    }
  };

  // ── Computed values ─────────────────────────────────────────────────────

  // Inventory tab
  const totalInvItems = Object.keys(inventoryItems).length;
  const checkedInvItems = Object.values(inventoryItems).filter(i => i.status !== null).length;
  const progressPercent = totalInvItems > 0 ? Math.round((checkedInvItems / totalInvItems) * 100) : 0;
  const baseControladoHoy = ultimoCheckCuartel && esDeHoy(ultimoCheckCuartel.fecha_control);
  const showBaseInventoryList = !baseControladoHoy || forceShowBaseInventoryList;

  // Daily tab
  const totalItemsDiario = Object.keys(estadoItemsDiario).length;
  const marcadosDiario = Object.values(estadoItemsDiario).filter((v) => v !== null).length;
  const progresoDiario = totalItemsDiario > 0 ? marcadosDiario / totalItemsDiario : 0;

  // ── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar style="light" backgroundColor="#1a1c23" />
        <ActivityIndicator size="large" color="#dc2626" />
        <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '600' }}>Cargando datos del cuartel...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>CHECKLIST GENERAL</Text>
        </View>
        <View style={styles.avatarPlaceholder}>
          <MaterialCommunityIcons name="clipboard-check" size={20} color="#fff" />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: (insets.bottom || 0) + 120 }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerTitleBox}>
          <Text style={styles.mainTitle}>
            <Text style={{ color: '#fff' }}>CUARTEL — </Text>
            <Text style={{ color: '#dc2626' }}>GESTIÓN GENERAL</Text>
          </Text>
          <View style={styles.dateRow}>
            <MaterialCommunityIcons name="calendar-month" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>
              {fechaHoy()}
            </Text>
            <Text style={styles.dateDot}>•</Text>
            <MaterialCommunityIcons name="shield-check" size={12} color="#94a3b8" />
            <Text style={styles.dateText}>CONTROL GENERAL DE ACTIVOS</Text>
          </View>
        </View>

        {/* Tab Switcher — 5 tabs en ScrollView */}
        <View style={styles.tabRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 4 }}>
            <TouchableOpacity style={[styles.tab, { paddingHorizontal: 12, flex: 0 }, activeTab === 'inventario' && styles.tabActive]} onPress={() => setActiveTab('inventario')}>
              <MaterialCommunityIcons name="clipboard-list-outline" size={14} color={activeTab === 'inventario' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'inventario' && styles.tabTextActive]}>INVENTARIO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, { paddingHorizontal: 12, flex: 0 }, activeTab === 'mantenimiento' && styles.tabActive]} onPress={() => setActiveTab('mantenimiento')}>
              <MaterialCommunityIcons name="wrench-clock" size={14} color={activeTab === 'mantenimiento' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'mantenimiento' && styles.tabTextActive]}>MANTEN.</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, { paddingHorizontal: 12, flex: 0 }, activeTab === 'diario' && styles.tabActive]} onPress={() => setActiveTab('diario')}>
              <MaterialCommunityIcons name="fire-truck" size={14} color={activeTab === 'diario' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'diario' && styles.tabTextActive]}>DIARIO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, { paddingHorizontal: 12, flex: 0 }, activeTab === 'fluidos_camion' && styles.tabActive]} onPress={() => setActiveTab('fluidos_camion')}>
              <MaterialCommunityIcons name="water-pump" size={14} color={activeTab === 'fluidos_camion' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'fluidos_camion' && styles.tabTextActive]}>FL. CAMIONES</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, { paddingHorizontal: 12, flex: 0 }, activeTab === 'fluidos_herr' && styles.tabActive]} onPress={() => setActiveTab('fluidos_herr')}>
              <MaterialCommunityIcons name="water-boiler" size={14} color={activeTab === 'fluidos_herr' ? '#fff' : '#64748b'} />
              <Text style={[styles.tabText, activeTab === 'fluidos_herr' && styles.tabTextActive]}>FL. HERRAM.</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: INVENTARIO BASE                                           */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'inventario' && (
          <>
            {/* Último control semanal de base */}
            {ultimoCheckCuartel ? (
              <View style={styles.lastCheckBaseCard}>
                <View style={styles.lastCheckBaseHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="clipboard-check-multiple-outline" size={18} color="#22c55e" />
                    <Text style={styles.lastCheckBaseTitle}>ÚLTIMO CONTROL DE INVENTARIO BASE</Text>
                  </View>
                  {esDeHoy(ultimoCheckCuartel.fecha_control) ? (
                    <View style={styles.controlledTodayBadge}>
                      <Text style={styles.controlledTodayText}>CONTROLADO HOY</Text>
                    </View>
                  ) : (
                    <View style={styles.daysSinceBadge}>
                      <Text style={styles.daysSinceText}>
                        {daysSinceDate(ultimoCheckCuartel.fecha_control) === 0
                          ? 'HACE HORAS'
                          : daysSinceDate(ultimoCheckCuartel.fecha_control) === 1
                            ? 'AYER'
                            : `HACE ${daysSinceDate(ultimoCheckCuartel.fecha_control)} DÍAS`}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.lastCheckBaseBody}>
                  <View style={styles.lastCheckBaseInfoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lastCheckBaseLabel}>AUDITOR RESPONSABLE</Text>
                      <Text style={styles.lastCheckBaseVal} numberOfLines={1}>
                        {ultimoCheckCuartel.usuario?.bombero
                          ? `${ultimoCheckCuartel.usuario.bombero.nombre} ${ultimoCheckCuartel.usuario.bombero.apellido}`
                          : ultimoCheckCuartel.usuario?.nombre_usuario || 'Bombero de Guardia'}
                      </Text>
                    </View>
                    <View style={{ width: 1, backgroundColor: '#26282f', marginHorizontal: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lastCheckBaseLabel}>FECHA Y HORA</Text>
                      <Text style={styles.lastCheckBaseVal}>
                        {new Date(ultimoCheckCuartel.fecha_control).toLocaleDateString('es-AR')} - {new Date(ultimoCheckCuartel.fecha_control).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lastCheckBaseActions}>
                    <TouchableOpacity
                      style={styles.lastCheckBaseBtn}
                      onPress={() => {
                        setChecklistCuartelSeleccionado(ultimoCheckCuartel);
                        setAuditCuartelModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="eye-outline" size={14} color="#fff" />
                      <Text style={styles.lastCheckBaseBtnText}>VER DETALLES</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.lastCheckBaseBtn, { backgroundColor: '#26282f' }]}
                      onPress={() => {
                        setHistorialModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="history" size={14} color="#94a3b8" />
                      <Text style={[styles.lastCheckBaseBtnText, { color: '#94a3b8' }]}>HISTORIAL COMPLETO</Text>
                    </TouchableOpacity>
                  </View>

                  {baseControladoHoy && !forceShowBaseInventoryList && (
                    <TouchableOpacity
                      style={styles.modifyControlBtn}
                      onPress={prefillBaseInventoryFromLastCheck}
                      activeOpacity={0.75}
                    >
                      <MaterialCommunityIcons name="pencil-box-multiple-outline" size={14} color="#22c55e" />
                      <Text style={styles.modifyControlBtnText}>MODIFICAR O REALIZAR NUEVO CONTROL</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : (
              <View style={[styles.lastCheckBaseCard, { borderLeftWidth: 3, borderLeftColor: '#dc2626' }]}>
                <View style={styles.lastCheckBaseHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#dc2626" />
                    <Text style={[styles.lastCheckBaseTitle, { color: '#dc2626' }]}>SIN CONTROL REGISTRADO</Text>
                  </View>
                </View>
                <View style={styles.lastCheckBaseBody}>
                  <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '500' }}>
                    Aún no se ha registrado ningún control de inventario de la base. Realiza el primer control para iniciar el historial operativo.
                  </Text>
                </View>
              </View>
            )}

            {/* Warning banner when modifying today's control */}
            {baseControladoHoy && forceShowBaseInventoryList && (
              <View style={styles.editModeWarningCard}>
                <View style={styles.editModeWarningHeader}>
                  <MaterialCommunityIcons name="alert-decagram-outline" size={20} color="#fbbf24" />
                  <Text style={styles.editModeWarningTitle}>MODIFICANDO CONTROL DE HOY</Text>
                </View>
                <Text style={styles.editModeWarningText}>
                  Estás modificando el control de inventario base registrado hoy. Puedes cambiar los estados de las herramientas y volver a guardar para actualizar el control.
                </Text>
                <TouchableOpacity
                  style={styles.cancelEditBtn}
                  onPress={() => {
                    setForceShowBaseInventoryList(false);
                    // Discard changes and restore state
                    const initialInv = {};
                    herramientas.forEach(tool => {
                      initialInv[tool.id] = { status: null, justification: '' };
                    });
                    setInventoryItems(initialInv);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={14} color="#fca5a5" />
                  <Text style={styles.cancelEditBtnText}>CANCELAR MODIFICACIÓN</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Inventory Progress Bar & Tools List & Save Button (Hidden if controlled today and not forcing edit) */}
            {showBaseInventoryList && (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setBaseInventoryExpanded(!baseInventoryExpanded)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1b1d24',
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: '#26282f',
                    marginTop: 16,
                    marginBottom: baseInventoryExpanded ? 16 : 0,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#dc2626" />
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>
                      REALIZAR CHECKEO DE INVENTARIO BASE
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={baseInventoryExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#94a3b8"
                  />
                </TouchableOpacity>

                {baseInventoryExpanded && (
                  <>
                          />
                        </View>
                      );
                    })}
                  </>
                )}

                {/* Validation warning */}
                {!canSubmitInventory && checkedInvItems > 0 && !allInvJustified && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                    <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
                    <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>
                      Completar justificación de los ítems marcados como Falta/Roto para poder guardar.
                    </Text>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.saveButton, !canSubmitInventory && styles.saveButtonDisabled]}
                  onPress={handleSubmitInventory}
                  disabled={!canSubmitInventory}
                  activeOpacity={0.7}
                >
                  {submittingInventory ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>GUARDAR INVENTARIO BASE</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: MANTENIMIENTO                                             */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mantenimiento' && (
          <>
            {/* Maintenance lockout state */}
            {blocked ? (
              maintBypassed ? (
                <View style={[styles.blockedBanner, { borderColor: '#f59e0b', backgroundColor: '#f59e0b10' }]}>
                  <View style={styles.blockedIconRow}>
                    <MaterialCommunityIcons name="alert-decagram-outline" size={22} color="#f59e0b" />
                    <Text style={[styles.blockedTitle, { color: '#f59e0b' }]}>CONTROL EXTRAORDINARIO</Text>
                  </View>
                  <Text style={[styles.blockedText, { color: '#f59e0b' }]}>
                    Aún no han transcurrido 7 días desde el último control semanal ({lastCheckDate ? new Date(lastCheckDate).toLocaleDateString('es-AR') : '—'}). Estás realizando una inspección excepcional fuera de término.
                  </Text>
                </View>
              ) : (
                <View style={styles.blockedBanner}>
                  <View style={styles.blockedIconRow}>
                    <MaterialCommunityIcons name="lock-clock" size={22} color="#fbbf24" />
                    <Text style={styles.blockedTitle}>CONTROL NO DISPONIBLE</Text>
                  </View>
                  <Text style={styles.blockedText}>
                    El último control semanal de mantenimiento fue registrado el {lastCheckDate ? new Date(lastCheckDate).toLocaleDateString('es-AR') : '—'}.
                    {'\n'}Faltan <Text style={{ color: '#fbbf24', fontWeight: '900' }}>{daysRemaining} días</Text> para habilitar el próximo checklist.
                  </Text>
                  <TouchableOpacity
                    style={styles.bypassButton}
                    onPress={() => setMaintBypassed(true)}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#0f172a" />
                    <Text style={styles.bypassButtonText}>FORZAR CONTROL EXTRAORDINARIO</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={[styles.blockedBanner, { borderColor: '#15803d', backgroundColor: '#14532d20' }]}>
                <View style={styles.blockedIconRow}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="#22c55e" />
                  <Text style={[styles.blockedTitle, { color: '#22c55e' }]}>CONTROL DISPONIBLE</Text>
                </View>
                <Text style={[styles.blockedText, { color: '#a7f3d0' }]}>
                  Por favor, complete las comprobaciones semanales del equipamiento crítico.
                </Text>
              </View>
            )}

            {/* Maintenance Form Parameters */}
            <View style={{ marginTop: 8 }}>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="hydraulic-blade" size={18} color="#dc2626" />
                <Text style={styles.sectionTitle}>PARÁMETROS DE MANTENIMIENTO</Text>
                <View style={styles.sectionLine} />
              </View>

              {/* 1. Encendido exitoso */}
              <View style={[
                styles.cardItem,
                maintenance.encendido === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.encendido === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#3b0764' }]}>
                      <MaterialCommunityIcons name="power" size={16} color="#d8b4fe" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>ENCENDIDO EXITOSO</Text>
                      <Text style={styles.itemSubtitle}>Prueba de arranque de motosierras y motobombas</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.encendido === 'ok' && styles.iconButtonActive]}
                    onPress={() => !isMaintBlocked && setMaintField('encendido', 'ok')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.encendido === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.encendido === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !isMaintBlocked && setMaintField('encendido', 'fail')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.encendido === 'fail' && styles.btnTextActive]}>Fallo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.encendido === 'fail'}
                justification={maintenance.encendidoJustification}
                onJustificationChange={(text) => setMaintJustification('encendido', text)}
                theme="dark"
              />

              {/* 2. Nivel de combustible */}
              <View style={[
                styles.cardItem,
                maintenance.combustible === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.combustible === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#1c1917' }]}>
                      <MaterialCommunityIcons name="gas-station" size={16} color="#fca5a5" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>NIVEL DE COMBUSTIBLE</Text>
                      <Text style={styles.itemSubtitle}>Tanques de reserva y equipos auxiliares llenos</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.combustible === 'ok' && styles.iconButtonActive]}
                    onPress={() => !isMaintBlocked && setMaintField('combustible', 'ok')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.combustible === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.combustible === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !isMaintBlocked && setMaintField('combustible', 'fail')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.combustible === 'fail' && styles.btnTextActive]}>Bajo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.combustible === 'fail'}
                justification={maintenance.combustibleJustification}
                onJustificationChange={(text) => setMaintJustification('combustible', text)}
                theme="dark"
              />

              {/* 3. Nivel de aceite */}
              <View style={[
                styles.cardItem,
                maintenance.aceite === 'ok' && { borderLeftColor: '#22c55e' },
                maintenance.aceite === 'fail' && { borderLeftColor: '#dc2626' },
              ]}>
                <View style={styles.cardItemLeft}>
                  <View style={styles.toolRow}>
                    <View style={[styles.toolIconCircle, { backgroundColor: '#064e3b' }]}>
                      <MaterialCommunityIcons name="oil" size={16} color="#6ee7b7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>NIVEL DE ACEITE</Text>
                      <Text style={styles.itemSubtitle}>Lubricación en límites operativos óptimos</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.aceite === 'ok' && styles.iconButtonActive]}
                    onPress={() => !isMaintBlocked && setMaintField('aceite', 'ok')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.aceite === 'ok' && styles.btnTextActive]}>OK</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.iconButton, maintenance.aceite === 'fail' && styles.iconButtonFail, { width: 70 }]}
                    onPress={() => !isMaintBlocked && setMaintField('aceite', 'fail')}
                    disabled={isMaintBlocked}
                  >
                    <Text style={[styles.btnText, maintenance.aceite === 'fail' && styles.btnTextActive]}>Bajo</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <DamageReportField
                visible={maintenance.aceite === 'fail'}
                justification={maintenance.aceiteJustification}
                onJustificationChange={(text) => setMaintJustification('aceite', text)}
                theme="dark"
              />
            </View>

            {/* Validation warning */}
            {!canSubmitMaint && allMaintChecked && !allMaintJustified && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 }}>
                <MaterialCommunityIcons name="alert-circle" size={14} color="#fca5a5" />
                <Text style={{ color: '#fca5a5', fontSize: 11, fontWeight: '700' }}>
                  Completar justificación de los parámetros con fallos/bajos para poder guardar.
                </Text>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.saveButton, !canSubmitMaint && styles.saveButtonDisabled]}
              onPress={handleSubmitMaintenance}
              disabled={!canSubmitMaint}
              activeOpacity={0.7}
            >
              {submittingMaint ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isMaintBlocked ? 'BLOQUEADO — ESPERAR 7 DÍAS' : 'GUARDAR CHECKLIST MANTENIMIENTO'}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: CHECKLIST DIARIO                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'diario' && (
          <>
            {/* ── PASO 1: Selector de camión ── */}
            {!camionSeleccionado && (
              <>
                <View style={styles.introBox}>
                  <MaterialCommunityIcons name="fire-truck" size={32} color="#dc2626" />
                  <Text style={styles.introTitulo}>¿Qué móvil vas a chequear?</Text>
                  <Text style={styles.introSub}>
                    Seleccioná el camión para registrar el control diario de inventario
                  </Text>
                </View>

                {cargandoCamiones && (
                  <View style={styles.centrado}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.textoEstado}>Cargando móviles...</Text>
                  </View>
                )}

                {!cargandoCamiones && camionesDisponibles.length === 0 && (
                  <View style={styles.centrado}>
                    <MaterialCommunityIcons name="truck-remove-outline" size={44} color="#334155" />
                    <Text style={styles.textoEstado}>No hay móviles activos disponibles.</Text>
                    <TouchableOpacity style={styles.botonReintentar} onPress={cargarCamionesDisponibles}>
                      <Text style={styles.textoReintentar}>REINTENTAR</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Grid de camiones */}
                <View style={styles.gridCamiones}>
                  {camionesDisponibles.map(camion => {
                    const ultimoCheck = camion.ultimoCheck;
                    const controladoHoy = ultimoCheck && esDeHoy(ultimoCheck.fecha_control);

                    let checkInfoText = 'Sin chequeos';
                    let autorText = '';
                    if (ultimoCheck) {
                      const fecha = new Date(ultimoCheck.fecha_control);
                      const dia = String(fecha.getDate()).padStart(2, '0');
                      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
                      const hora = String(fecha.getHours()).padStart(2, '0');
                      const mins = String(fecha.getMinutes()).padStart(2, '0');

                      checkInfoText = controladoHoy
                        ? `Hoy - ${hora}:${mins} hs`
                        : `${dia}/${mes} - ${hora}:${mins} hs`;

                      const userBombero = ultimoCheck.usuarioId?.bombero;
                      autorText = userBombero
                        ? `${userBombero.nombre} ${userBombero.apellido.substring(0, 1)}.`
                        : ultimoCheck.usuarioId?.nombre_usuario || '';
                    }

                    return (
                      <TouchableOpacity
                        key={camion.id}
                        style={[
                          styles.cardCamion,
                          controladoHoy && { borderColor: '#22c55e', borderWidth: 1.5 }
                        ]}
                        onPress={() => seleccionarCamion(camion)}
                        activeOpacity={0.75}
                      >
                        {ultimoCheck && (
                          <TouchableOpacity
                            style={styles.eyeIconBadge}
                            onPress={() => {
                              setUltimoCheckSeleccionado({
                                ...ultimoCheck,
                                nombre_camion: camion.nombre_camion
                              });
                              setUltimoCheckModalVisible(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <MaterialCommunityIcons name="eye-outline" size={16} color="#94a3b8" />
                          </TouchableOpacity>
                        )}
                        <View style={[styles.iconoCamionBox, controladoHoy && { backgroundColor: '#052e16' }]}>
                          <MaterialCommunityIcons name="fire-truck" size={28} color={controladoHoy ? '#22c55e' : '#dc2626'} />
                        </View>
                        <Text style={styles.nombreCamion} numberOfLines={2}>
                          {camion.nombre_camion?.toUpperCase()}
                        </Text>

                        <View style={styles.checkStatusInfo}>
                          {controladoHoy ? (
                            <View style={styles.badgeControladoHoy}>
                              <Text style={styles.badgeControladoHoyText}>CONTROLADO HOY</Text>
                            </View>
                          ) : (
                            <Text style={styles.ultimoCheckLabel}>ÚLTIMO CONTROL</Text>
                          )}
                          <Text style={[styles.ultimoCheckVal, controladoHoy && { color: '#22c55e', fontWeight: '800' }]}>
                            {checkInfoText}
                          </Text>
                          {autorText ? (
                            <Text style={styles.ultimoCheckAutor} numberOfLines={1}>
                              Por: {autorText}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* ── PASO 2: Checklist del camión seleccionado ── */}
            {camionSeleccionado && (
              <>
                {/* Banner de camión seleccionado */}
                <View style={styles.camionBanner}>
                  <View style={styles.camionBannerLeft}>
                    <MaterialCommunityIcons name="fire-truck" size={20} color="#dc2626" />
                    <View>
                      <Text style={styles.camionBannerTitle}>{camionSeleccionado.nombre_camion?.toUpperCase()}</Text>
                      <Text style={styles.camionBannerSub}>CHECKLIST DIARIO · {fechaHoy()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.camionBannerBtn}
                    onPress={() => {
                      setCamionSeleccionado(null);
                      setSectores([]);
                      setEstadoItemsDiario({});
                      setObservacionesDiario({});
                      setAcompanantes([]);
                    }}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Barra de progreso del chequeo diario */}
                {totalItemsDiario > 0 && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>PROGRESO DE CHEQUEO</Text>
                      <Text style={styles.progressValue}>{marcadosDiario}/{totalItemsDiario} ({Math.round(progresoDiario * 100)}%)</Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progresoDiario * 100}%` }]} />
                    </View>
                  </View>
                )}

                {/* Banner de advertencia: faltantes del día anterior */}
                {faltantesAyer.size > 0 && (
                  <View style={styles.alertaAyer}>
                    <MaterialCommunityIcons name="alert" size={16} color="#f59e0b" />
                    <Text style={styles.alertaAyerText}>
                      {faltantesAyer.size} ítem(s) marcado(s) como FALTANTE en el último control. Aparecen resaltados abajo.
                    </Text>
                  </View>
                )}

                {/* Estados de carga */}
                {cargandoDiario && (
                  <View style={styles.centrado}>
                    <ActivityIndicator size="large" color="#dc2626" />
                    <Text style={styles.textoEstado}>Cargando inventario...</Text>
                  </View>
                )}

                {!cargandoDiario && errorDiario && (
                  <View style={styles.centrado}>
                    <MaterialCommunityIcons name="wifi-off" size={44} color="#334155" />
                    <Text style={styles.textoEstado}>{errorDiario}</Text>
                    <TouchableOpacity style={styles.botonReintentar} onPress={() => seleccionarCamion(camionSeleccionado)}>
                      <Text style={styles.textoReintentar}>REINTENTAR</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sectores y herramientas dinámicas */}
                {!cargandoDiario && !errorDiario && sectores.map((sector) => (
                  <View key={sector.nombre_sector}>
                    <View style={styles.sectionHeader}>
                      <MaterialCommunityIcons name="archive-outline" size={14} color="#64748b" style={{ marginRight: 2 }} />
                      <Text style={styles.sectionTitle}>
                        {sector.nombre_sector?.toUpperCase() || 'SIN SECTOR'}
                      </Text>
                      <View style={styles.sectionLine} />
                      <Text style={styles.sectionCount}>{(sector.herramientas || []).length}</Text>
                    </View>

                    {(sector.herramientas || []).map((item) => {
                      const estado = estadoItemsDiario[item.id] || null;
                      const esFaltanteAyer = faltantesAyer.has(item.id);
                      const esChequeado = estado === 'CHEQUEADO';
                      const esFaltante = estado === 'FALTANTE';

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.cardItem,
                            esChequeado && { borderLeftColor: '#22c55e' },
                            esFaltante && { borderLeftColor: '#dc2626', backgroundColor: '#1f1315' },
                            esFaltanteAyer && !esChequeado && !esFaltante && { borderLeftColor: '#f59e0b', backgroundColor: '#1c1a12' },
                          ]}
                        >
                          <View style={styles.cardItemLeft}>
                            <View style={styles.toolRow}>
                              <View style={[styles.toolIconCircle, {
                                backgroundColor: esFaltante ? '#2d1515' : esChequeado ? '#052e16' : esFaltanteAyer ? '#1c1a12' : '#2d1515',
                              }]}>
                                <MaterialCommunityIcons
                                  name={getIconoDiario(item.herramienta)}
                                  size={16}
                                  color={
                                    esFaltante ? '#fca5a5'
                                      : esChequeado ? '#86efac'
                                        : esFaltanteAyer ? '#fcd34d'
                                          : '#64748b'
                                  }
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text style={styles.itemTitle} numberOfLines={1}>
                                    {item.herramienta?.toUpperCase() || 'HERRAMIENTA'}
                                  </Text>
                                  {esFaltanteAyer && !esChequeado && !esFaltante && (
                                    <View style={styles.badgeFaltanteAyer}>
                                      <MaterialCommunityIcons name="alert-outline" size={9} color="#92400e" />
                                      <Text style={styles.badgeFaltanteAyerText}>FALTANTE AYER</Text>
                                    </View>
                                  )}
                                </View>
                                <Text style={styles.itemSubtitle}>Cantidad: {item.cantidad_herramienta}</Text>
                              </View>
                            </View>

                            {esFaltante && (
                              <View style={styles.observacionContainer}>
                                <MaterialCommunityIcons name="pencil-outline" size={12} color="#f87171" />
                                <Text style={styles.observacionInput}>
                                  {observacionesDiario[item.id] || 'Tocá para agregar observación...'}
                                </Text>
                              </View>
                            )}
                          </View>

                          <View style={styles.actionButtons}>
                            <TouchableOpacity
                              style={[styles.iconButton, esChequeado && styles.iconButtonActive]}
                              onPress={() => marcarItemDiario(item.id, esChequeado ? null : 'CHEQUEADO')}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="check" size={18} color={esChequeado ? '#fff' : '#e2e8f0'} />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.iconButton, esFaltante && styles.iconButtonFail]}
                              onPress={() => {
                                marcarItemDiario(item.id, esFaltante ? null : 'FALTANTE');
                                if (!esFaltante) {
                                  Alert.prompt(
                                    'Observación requerida',
                                    `¿Por qué falta "${item.herramienta}"?`,
                                    (texto) => setObservacionDiario(item.id, texto),
                                    'plain-text'
                                  );
                                }
                              }}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="close" size={18} color={esFaltante ? '#fff' : '#e2e8f0'} />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ))}

                {!cargandoDiario && !errorDiario && sectores.length === 0 && (
                  <View style={styles.centrado}>
                    <MaterialCommunityIcons name="archive-off-outline" size={44} color="#334155" />
                    <Text style={styles.textoEstado}>Este camión no tiene inventario cargado.</Text>
                  </View>
                )}

                {/* Selector de Dotación Acompañante de la Guardia */}
                {!cargandoDiario && !errorDiario && totalItemsDiario > 0 && (
                  <SelectorBomberos
                    token={token}
                    seleccionados={acompanantes}
                    onChange={setAcompanantes}
                  />
                )}

                {/* Botón de Guardado */}
                {!cargandoDiario && !errorDiario && totalItemsDiario > 0 && (
                  <TouchableOpacity
                    style={[styles.saveButton, guardandoDiario && { opacity: 0.6 }]}
                    onPress={guardarChecklistDiario}
                    disabled={guardandoDiario}
                    activeOpacity={0.8}
                  >
                    {guardandoDiario ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="content-save-check" size={18} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.saveButtonText}>GUARDAR CHECKLIST DIARIO</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: FLUIDOS CAMIONES                                          */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'fluidos_camion' && (
          <View style={{ flex: 1, minHeight: 600 }}>
            <ControlFluidosScreen navigation={navigation} isEmbedded={true} />
          </View>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* TAB: FLUIDOS HERRAMIENTAS                                      */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'fluidos_herr' && (
          <View style={{ flex: 1, minHeight: 600 }}>
            <MantenimientoHidraulicoScreen navigation={navigation} isEmbedded={true} />
          </View>
        )}
      </ScrollView>

      {/* Modal de Auditoría */}
      <Modal
        visible={ultimoCheckModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUltimoCheckModalVisible(false)}
      >
        <View style={styles.auditCenteredView}>
          <View style={styles.auditModalView}>
            {/* Cabecera */}
            <View style={styles.auditHeader}>
              <View>
                <Text style={styles.auditTitle}>
                  {ultimoCheckSeleccionado?.nombre_camion
                    ? `DETALLE DE CONTROL — ${ultimoCheckSeleccionado.nombre_camion.toUpperCase()}`
                    : 'DETALLE DE CONTROL DE MÓVIL'}
                </Text>
                <Text style={styles.auditDesc}>
                  Último chequeo: {ultimoCheckSeleccionado ? new Date(ultimoCheckSeleccionado.fecha_control).toLocaleDateString('es-AR') : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setUltimoCheckModalVisible(false)}
                style={styles.auditCloseIcon}
              >
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Subheader con Auditor */}
            {ultimoCheckSeleccionado && (
              <View style={styles.auditAuditorBox}>
                <MaterialCommunityIcons name="account-circle-outline" size={16} color="#94a3b8" />
                <Text style={styles.auditAuditorText}>
                  Auditor responsable:{' '}
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {ultimoCheckSeleccionado.usuarioId?.bombero
                      ? `${ultimoCheckSeleccionado.usuarioId.bombero.nombre} ${ultimoCheckSeleccionado.usuarioId.bombero.apellido}`
                      : ultimoCheckSeleccionado.usuarioId?.nombre_usuario || 'Bombero de Guardia'}
                  </Text>
                </Text>
              </View>
            )}

            {/* Lista Scrollable */}
            <ScrollView style={styles.auditScroll} showsVerticalScrollIndicator={false}>
              {ultimoCheckSeleccionado && groupDetailsBySector(ultimoCheckSeleccionado.detalles).map((group) => (
                <View key={group.nombre_sector} style={styles.auditSectorBlock}>
                  <View style={styles.auditSectorHeader}>
                    <MaterialCommunityIcons name="archive-outline" size={14} color="#dc2626" />
                    <Text style={styles.auditSectorTitle}>{group.nombre_sector.toUpperCase()}</Text>
                  </View>

                  {group.items.map((detalle) => {
                    const herramientaNombre =
                      detalle.inventarioId?.herramientaId?.nombre_herramienta ||
                      detalle.inventarioId?.herramienta?.nombre_herramienta ||
                      'Herramienta';
                    const esChequeado = detalle.controlado === 'CHEQUEADO';

                    return (
                      <View key={detalle.id} style={styles.auditToolRow}>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={styles.auditToolName}>{herramientaNombre.toUpperCase()}</Text>
                          {detalle.observaciones ? (
                            <Text style={styles.auditToolObs}>
                              Obs: {detalle.observaciones}
                            </Text>
                          ) : null}
                        </View>
                        <View style={styles.auditToolStatus}>
                          <MaterialCommunityIcons
                            name={esChequeado ? 'check-circle' : 'close-circle'}
                            size={18}
                            color={esChequeado ? '#22c55e' : '#dc2626'}
                          />
                          <Text style={[styles.auditToolStatusText, { color: esChequeado ? '#22c55e' : '#dc2626' }]}>
                            {esChequeado ? 'OK' : 'FALTANTE'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Botón Cerrar */}
            <TouchableOpacity
              style={styles.auditBtnClose}
              onPress={() => setUltimoCheckModalVisible(false)}
            >
              <Text style={styles.auditBtnCloseText}>CERRAR AUDITORÍA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Auditoría de Inventario Base */}
      <Modal
        visible={auditCuartelModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAuditCuartelModalVisible(false)}
      >
        <View style={styles.auditCenteredView}>
          <View style={styles.auditModalView}>
            {/* Cabecera */}
            <View style={styles.auditHeader}>
              <View>
                <Text style={styles.auditTitle}>AUDITORÍA DE BASE</Text>
                <Text style={styles.auditDesc}>
                  CONTROL: {checklistCuartelSeleccionado ? new Date(checklistCuartelSeleccionado.fecha_control).toLocaleDateString('es-AR') : ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAuditCuartelModalVisible(false)}
                style={styles.auditCloseIcon}
              >
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Subheader con Auditor */}
            {checklistCuartelSeleccionado && (
              <View style={styles.auditAuditorBox}>
                <MaterialCommunityIcons name="account-circle-outline" size={16} color="#94a3b8" />
                <Text style={styles.auditAuditorText}>
                  Auditor responsable:{' '}
                  <Text style={{ color: '#fff', fontWeight: '800' }}>
                    {checklistCuartelSeleccionado.usuario?.bombero
                      ? `${checklistCuartelSeleccionado.usuario.bombero.nombre} ${checklistCuartelSeleccionado.usuario.bombero.apellido}`
                      : checklistCuartelSeleccionado.usuario?.nombre_usuario || 'Bombero de Guardia'}
                  </Text>
                </Text>
              </View>
            )}

            {/* Resumen de Hallazgos */}
            {checklistCuartelSeleccionado && (() => {
              const totalItems = checklistCuartelSeleccionado.detalles?.length || 0;
              const okItems = checklistCuartelSeleccionado.detalles?.filter(d => d.controlado === 'CHEQUEADO').length || 0;
              const failItems = totalItems - okItems;
              return (
                <View style={styles.auditSummaryContainer}>
                  <View style={[styles.auditSummaryBlock, { borderColor: '#22c55e' }]}>
                    <Text style={[styles.auditSummaryNum, { color: '#22c55e' }]}>{okItems}</Text>
                    <Text style={styles.auditSummaryLabel}>OPERATIVOS</Text>
                  </View>
                  <View style={[styles.auditSummaryBlock, { borderColor: failItems > 0 ? '#dc2626' : '#26282f' }]}>
                    <Text style={[styles.auditSummaryNum, { color: failItems > 0 ? '#dc2626' : '#64748b' }]}>{failItems}</Text>
                    <Text style={styles.auditSummaryLabel}>FALTANTES</Text>
                  </View>
                </View>
              );
            })()}

            {/* Lista Scrollable */}
            <ScrollView style={styles.auditScroll} showsVerticalScrollIndicator={false}>
              {checklistCuartelSeleccionado && (() => {
                const sortedDetalles = [...(checklistCuartelSeleccionado.detalles || [])].sort((a, b) => {
                  if (a.controlado === 'FALTANTE' && b.controlado === 'CHEQUEADO') return -1;
                  if (a.controlado === 'CHEQUEADO' && b.controlado === 'FALTANTE') return 1;
                  const nameA = a.herramienta?.nombre_herramienta || '';
                  const nameB = b.herramienta?.nombre_herramienta || '';
                  return nameA.localeCompare(nameB);
                });

                return sortedDetalles.map((detalle) => {
                  const herramientaNombre = detalle.herramienta?.nombre_herramienta || 'Herramienta';
                  const esChequeado = detalle.controlado === 'CHEQUEADO';
                  const iconName = getToolIcon(herramientaNombre);

                  return (
                    <View key={detalle.id} style={[styles.auditToolRow, !esChequeado && { borderLeftWidth: 3, borderLeftColor: '#dc2626' }]}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name={iconName} size={14} color="#fca5a5" />
                          <Text style={styles.auditToolName}>{herramientaNombre.toUpperCase()}</Text>
                        </View>
                        {detalle.observaciones ? (
                          <Text style={styles.auditToolObs}>
                            Novedad: {detalle.observaciones}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.auditToolStatus}>
                        <MaterialCommunityIcons
                          name={esChequeado ? 'check-circle' : 'close-circle'}
                          size={18}
                          color={esChequeado ? '#22c55e' : '#dc2626'}
                        />
                        <Text style={[styles.auditToolStatusText, { color: esChequeado ? '#22c55e' : '#dc2626' }]}>
                          {esChequeado ? 'OK' : 'FALTANTE'}
                        </Text>
                      </View>
                    </View>
                  );
                });
              })()}
            </ScrollView>

            {/* Botón Cerrar */}
            <TouchableOpacity
              style={styles.auditBtnClose}
              onPress={() => setAuditCuartelModalVisible(false)}
            >
              <Text style={styles.auditBtnCloseText}>CERRAR AUDITORÍA</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Historial Completo de Base */}
      <Modal
        visible={historialModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHistorialModalVisible(false)}
      >
        <View style={styles.auditCenteredView}>
          <View style={styles.auditModalView}>
            {/* Cabecera */}
            <View style={styles.auditHeader}>
              <View>
                <Text style={styles.auditTitle}>HISTORIAL DE CONTROLES</Text>
                <Text style={[styles.auditDesc, { color: '#94a3b8' }]}>
                  AUDITORÍA HISTÓRICA DE INVENTARIO BASE
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setHistorialModalVisible(false)}
                style={styles.auditCloseIcon}
              >
                <MaterialCommunityIcons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Lista de Controles */}
            {historialCuartel.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <MaterialCommunityIcons name="history" size={48} color="#334155" />
                <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 13, fontWeight: '600', textAlign: 'center' }}>
                  No se encontraron controles anteriores en el historial.
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.auditScroll} showsVerticalScrollIndicator={false}>
                {historialCuartel.map((item) => {
                  const totalItems = item.detalles?.length || 0;
                  const okItems = item.detalles?.filter(d => d.controlado === 'CHEQUEADO').length || 0;
                  const failItems = totalItems - okItems;
                  const formattedDate = new Date(item.fecha_control).toLocaleDateString('es-AR');
                  const formattedTime = new Date(item.fecha_control).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.historyRow, failItems > 0 && { borderLeftColor: '#dc2626' }]}
                      onPress={() => {
                        setChecklistCuartelSeleccionado(item);
                        setHistorialModalVisible(false);
                        setAuditCuartelModalVisible(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1, gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <MaterialCommunityIcons name="calendar-clock" size={14} color="#94a3b8" />
                          <Text style={styles.historyRowDate}>{formattedDate} - {formattedTime} hs</Text>
                        </View>
                        <Text style={styles.historyRowAuditor}>
                          Por: {item.usuario?.bombero
                            ? `${item.usuario.bombero.nombre} ${item.usuario.bombero.apellido}`
                            : item.usuario?.nombre_usuario || 'Bombero de Guardia'}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        {failItems > 0 ? (
                          <View style={[styles.controlledTodayBadge, { backgroundColor: 'rgba(220, 38, 38, 0.15)', borderColor: 'rgba(220, 38, 38, 0.3)' }]}>
                            <Text style={[styles.controlledTodayText, { color: '#dc2626' }]}>{failItems} NOVEDAD{failItems > 1 ? 'ES' : ''}</Text>
                          </View>
                        ) : (
                          <View style={styles.controlledTodayBadge}>
                            <Text style={styles.controlledTodayText}>S/N (OK)</Text>
                          </View>
                        )}
                        <MaterialCommunityIcons name="chevron-right" size={18} color="#64748b" style={{ alignSelf: 'flex-end' }} />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Botón Cerrar */}
            <TouchableOpacity
              style={styles.auditBtnClose}
              onPress={() => setHistorialModalVisible(false)}
            >
              <Text style={styles.auditBtnCloseText}>CERRAR HISTORIAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};