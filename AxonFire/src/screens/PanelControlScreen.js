import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Alert,
  useWindowDimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors, Spacing, Radius } from "../theme";
import TacticalCard from "../components/TacticalCard";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import axios from "axios";
import { useNotifications } from "../context/NotificationContext";
import { styles } from "../styles/PanelControlScreenStyles";
import { getPrioridadConfig, getAlertIcon, getTipoAlerta, getPriorityColor } from "../utils/alertHelpers";

// ── Helpers ──────────────────────────────────────────────────────────────────

function clasificarEstado(nombreEstado = "") {
  const e = nombreEstado.toUpperCase();
  if (e === "PENDIENTE") return "activa";
  if (e === "EN CURSO") return "progreso";
  if (e === "FINALIZADO") return "resuelta";

  if (e.includes("ACTIV")) return "activa";
  if (e.includes("DESPACH")) return "despachada";
  if (e.includes("PROGRESO") || e.includes("CURSO")) return "progreso";
  if (e.includes("RESUEL") || e.includes("CERRAD")) return "resuelta";
  return "activa";
}

function getStatusBadgeStyles(estado = "") {
  const est = estado.toLowerCase();
  switch (est) {
    case "activa":
      return {
        bg: "rgba(239, 68, 68, 0.15)",
        color: "#ef4444",
        label: "ACTIVA",
      };
    case "despachada":
      return {
        bg: "rgba(59, 130, 246, 0.15)",
        color: "#3b82f6",
        label: "DESPACHADA",
      };
    case "progreso":
      return {
        bg: "rgba(56, 189, 248, 0.15)",
        color: "#38bdf8",
        label: "EN PROGRESO",
      };
    case "resuelta":
      return {
        bg: "rgba(16, 185, 129, 0.15)",
        color: "#10b981",
        label: "RESUELTA",
      };
    default:
      return { bg: "#26282f", color: "#94a3b8", label: estado.toUpperCase() };
  }
}

function tiempoTranscurrido(fechaISO) {
  if (!fechaISO) return "";
  const min = Math.floor((Date.now() - new Date(fechaISO).getTime()) / 60000);
  if (min < 1) return "Ahora";
  if (min < 60) return `Hace ${min} min`;
  const hs = Math.floor(min / 60);
  if (hs < 24) return `Hace ${hs} hs`;
  return `Hace ${Math.floor(hs / 24)} días`;
}

function formatAlertTitle(tipo = "") {
  const clean = String(tipo)
    .replace(/^\[[^\]]+\]\s*-\s*/i, "")
    .trim();
  if (
    !clean ||
    clean.toLowerCase() === "sin descripcion" ||
    clean.toLowerCase() === "sin descripción"
  ) {
    return "Alerta registrada";
  }
  return clean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function PanelControlScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user, token, logout } = useAuth();
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
  const { notifications, getUnreadCount, markAsRead, markAllAsRead, clearAll } =
    useNotifications();
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const unreadCount = getUnreadCount();

  const [alertas, setAlertas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState(null);

  // Short polling para alertas del panel
  useEffect(() => {
    const interval = setInterval(() => {
      cargarDatos(true);
    }, 10000); // Polling corto cada 10 segundos
    return () => clearInterval(interval);
  }, [token]);

  async function cargarDatos(esRefresh = false) {
    if (esRefresh) setRefrescando(true);
    else setCargando(true);
    setError(null);

    try {
      const hasta = new Date().toISOString();
      const desde = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000,
      ).toISOString();

      const res = await axios.get(`${API_BASE_URL}/alerta/rango`, {
        params: { fecha_desde: desde, fecha_hasta: hasta },
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 45000,
      });

      const data = res.data;
      const lista = Array.isArray(data?.alertas)
        ? data.alertas
        : Array.isArray(data)
          ? data
          : [];

      // Resolve local finalized overrides
      const resolvedLista = await Promise.all(
        lista.map(async (a) => {
          const isLocallyFinalized = await AsyncStorage.getItem(
            `finalized_alert_${a.id}`,
          );
          if (isLocallyFinalized === "true") {
            return {
              ...a,
              estadoAlerta: {
                ...a.estadoAlerta,
                nombre_estado: "FINALIZADO",
              },
            };
          }
          return a;
        }),
      );

      setAlertas(resolvedLista);
    } catch (err) {
      console.error("Error cargando datos del panel:", err);
      if (err?.response?.status === 401 || err?.status === 401) {
        logout();
        return;
      }
      setAlertas([]);
      setError(
        "Servidor no disponible. Desliza hacia abajo para reintentar.",
      );
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }

  async function limpiarBaseDeDatos() {
    Alert.alert(
      "BORRÓN PARA TEST",
      "¿Deseas eliminar todo el historial de pruebas para iniciar un test limpio? Esta acción borrará todas las alertas y registros de comunicación.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "BORRAR TODO",
          style: "destructive",
          onPress: async () => {
            setCargando(true);
            try {
              await axios.delete(`${API_BASE_URL}/alerta/limpiar`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert("Éxito", "La base de datos ha sido limpiada.");
              cargarDatos();
            } catch (err) {
              console.error("Error limpiando base de datos:", err);
              Alert.alert("Error", "No se pudo limpiar la base de datos.");
            } finally {
              setCargando(false);
            }
          },
        },
      ],
    );
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const clasificadas = alertas.map((a) => ({
    id: a.id,
    estado: clasificarEstado(
      a.estadoAlerta?.nombre_estado || a.estadoAlerta?.nombre || a.estado || "",
    ),
    prioridad: String(a.prioridad || '').toLowerCase(),
    tipo:
      a.subCategoriaAlerta?.nombre_sub_categoria ||
      a.subCategoriaAlerta?.nombre ||
      a.observaciones ||
      "Sin tipo",
    fecha: a.fecha_hora,
    ubicacion: a.ubicacion || "Sin ubicación",
    observaciones: a.observaciones || "",
  }));

  const totalAlertas = clasificadas.length;
  const cantActivas = clasificadas.filter(
    (a) => a.estado === "activa" || a.estado === "progreso",
  ).length;
  const cantResueltas = clasificadas.filter(
    (a) => a.estado === "resuelta",
  ).length;

  const resolucionRate =
    totalAlertas > 0 ? (cantResueltas / totalAlertas) * 100 : 0;

  const ultimasAlertas = [...clasificadas]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 5);

  const isDesktopWeb = Platform.OS === "web" && width >= 900;
  const isWideWeb = Platform.OS === "web" && width >= 1200;
  const statCardStyle = isDesktopWeb
    ? styles.cardStatDesktop
    : styles.cardStatMobile;
  const actionCardStyle = isWideWeb
    ? styles.gridItemWide
    : styles.gridItemDefault;
  const desktopContentStyle = isDesktopWeb ? styles.contenidoDesktop : null;
  const desktopHeaderStyle = isDesktopWeb ? styles.headerRowDesktop : null;
  const desktopActivityStyle = isDesktopWeb
    ? styles.activityPanelDesktop
    : null;
  const desktopTotalStyle = isDesktopWeb ? styles.totalCardDesktop : null;
  const desktopTotalLeftStyle = isDesktopWeb ? styles.totalLeftDesktop : null;
  const desktopTotalProgressStyle = isDesktopWeb
    ? styles.totalProgressDesktop
    : null;
  const desktopGridStyle = isDesktopWeb ? styles.grillaDesktop : null;

  const renderRecentActivity = () => (
    <View style={[styles.activityPanel, desktopActivityStyle]}>
      <View style={styles.activityHeader}>
        <View>
          <Text style={styles.activityKicker}>HISTORIAL</Text>
          <Text style={styles.activityTitle}>ÚLTIMAS ALERTAS</Text>
        </View>
        {user?.rol === "ADMIN" && (
          <TouchableOpacity onPress={limpiarBaseDeDatos} style={styles.botonTest}>
            <MaterialCommunityIcons
              name="delete-sweep"
              size={14}
              color="#e11d48"
            />
            <Text style={styles.botonTestText}>LIMPIAR</Text>
          </TouchableOpacity>
        )}
      </View>

      {ultimasAlertas.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="shield-check"
            size={40}
            color="#334155"
          />
          <Text style={styles.textoVacio}>Sin actividad registrada</Text>
        </View>
      ) : (
        ultimasAlertas.map((a, idx) => {
          const iconInfo = getAlertIcon(a.tipo);
          const priorityColor = getPriorityColor(a.prioridad);
          const statusStyle = getStatusBadgeStyles(a.estado);
          const alertTitle = formatAlertTitle(a.tipo);
          return (
            <TouchableOpacity
              key={a.id || idx}
              onPress={() =>
                navigation.navigate("AlertDetail", { alerta_id: a.id })
              }
              activeOpacity={0.8}
              style={[styles.alertCard, { borderLeftColor: priorityColor }]}
            >
              <View style={styles.alertCardLeft}>
                <View
                  style={[styles.alertIconBg, { backgroundColor: iconInfo.bg }]}
                >
                  <MaterialCommunityIcons
                    name={iconInfo.icon}
                    size={22}
                    color={iconInfo.color}
                  />
                </View>
                <View style={styles.alertDetails}>
                  <Text style={styles.alertTitle} numberOfLines={1}>
                    {alertTitle.toUpperCase()}
                  </Text>
                  <Text style={styles.alertSubtitle} numberOfLines={1}>
                    {a.ubicacion}
                  </Text>
                  <View style={styles.alertBadgesRow}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: priorityColor + "20" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.priorityBadgeText,
                          { color: priorityColor },
                        ]}
                      >
                        {a.prioridad.toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.alertCardRight}>
                <Text style={styles.alertTime}>
                  {tiempoTranscurrido(a.fecha)}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color="#64748b"
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1c23" />

      {/* Top Bar */}
      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + (Platform.OS === "android" ? 20 : 10) },
        ]}
      >
        <View style={styles.topBarLeft}>
          <MaterialCommunityIcons
            name="monitor-dashboard"
            size={22}
            color="#e11d48"
          />
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              const changeView = () => {
                navigation.navigate("MainApp");
              };
              Alert.alert(
                "Vista Bombero",
                "¿Deseas visualizar la aplicación con el rol de Bombero?",
                [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Cambiar Vista", onPress: changeView },
                ],
              );
            }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="account-switch"
              size={20}
              color="#dc2626"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setNotifModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color="#94a3b8"
            />
            {unreadCount > 0 && (
              <View style={notifStyles.bellBadge}>
                <Text style={notifStyles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => cargarDatos(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="refresh" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.contenido,
          desktopContentStyle,
          { paddingBottom: insets.bottom + (isDesktopWeb ? 128 : 120) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => cargarDatos(true)}
            colors={["#dc2626"]}
            tintColor="#dc2626"
          />
        }
      >
        {cargando ? (
          <View style={styles.centrado}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text style={styles.textoCarga}>Cargando datos del panel...</Text>
          </View>
        ) : error ? (
          <View style={styles.centrado}>
            <MaterialCommunityIcons name="wifi-off" size={48} color="#ef4444" />
            <Text style={styles.textoCarga}>{error}</Text>
            <TouchableOpacity
              style={styles.botonReintentar}
              onPress={() => cargarDatos()}
            >
              <Text style={styles.textoReintentar}>REINTENTAR</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Header Row */}
            <View style={[styles.headerRow, desktopHeaderStyle]}>
              <View style={styles.titleLeftGroup}>
                <View style={styles.redAccent} />
                <View>
                  <Text style={styles.headerLabel}>
                    {user?.rol === "ADMIN"
                      ? "SISTEMA DE MONITOREO"
                      : "SISTEMA OPERATIVO TÁCTICO"}
                  </Text>
                  <Text style={styles.mainTitle}>
                    {user?.rol === "ADMIN"
                      ? "PANEL DE\nCONTROL"
                      : "PANEL TÁCTICO\nBOMBERO"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Active Emergency Banner */}
            {(() => {
              const alertaActiva = clasificadas.find(
                (a) => a.estado === "activa" || a.estado === "progreso",
              );
              if (!alertaActiva) return null;
              return (
                <View style={{ marginBottom: 16 }}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() =>
                      navigation.navigate("Asistencia", {
                        alerta_id: alertaActiva.id,
                      })
                    }
                    style={[styles.activeEmergencyBanner, { marginBottom: 0 }]}
                  >
                    <View style={styles.emergencyBannerLeft}>
                      <View style={styles.emergencyPulseIcon}>
                        <MaterialCommunityIcons
                          name="alarm-light"
                          size={20}
                          color="#fff"
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.emergencyBannerTitle}>
                          EMERGENCIA EN CURSO
                        </Text>
                        <Text
                          style={styles.emergencyBannerDesc}
                          numberOfLines={1}
                        >
                          {alertaActiva.tipo.toUpperCase()} •{" "}
                          {alertaActiva.ubicacion.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.emergencyBannerRight}>
                      <Text style={styles.emergencyBannerBtnText}>
                        VER ASISTENCIA
                      </Text>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color="#fff"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Acceso rápido a Pedir Suministro durante la emergencia */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate("PedidosSuministro", {
                        alerta_id: alertaActiva.id,
                      })
                    }
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#ea580c",
                      borderRadius: 10,
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      marginTop: 8,
                      gap: 8,
                    }}
                  >
                    <MaterialCommunityIcons
                      name="cart-plus"
                      size={18}
                      color="#fff"
                    />
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
                        fontWeight: "900",
                        letterSpacing: 0.5,
                      }}
                    >
                      SOLICITAR SUMINISTRO PARA LA EMERGENCIA
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* ── Stat grande: total de alertas con barra de resolución ── */}
            <View style={[styles.totalCard, desktopTotalStyle]}>
              <View style={[styles.totalLeft, desktopTotalLeftStyle]}>
                <Text style={styles.totalLabel}>
                  ALERTAS REGISTRADAS (ÚLTIMOS 30 DÍAS)
                </Text>
                <Text style={styles.totalValue}>
                  {String(totalAlertas).padStart(2, "0")}
                </Text>
              </View>
              <View style={[styles.totalProgress, desktopTotalProgressStyle]}>
                <View style={styles.progressBarHeader}>
                  <Text style={styles.progressBarLabel}>
                    EFICIENCIA DE RESOLUCIÓN
                  </Text>
                  <Text
                    style={[styles.progressBarPercent, { color: "#10b981" }]}
                  >
                    {resolucionRate.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${resolucionRate}%` },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View style={isDesktopWeb ? styles.desktopBody : null}>
              <View style={isDesktopWeb ? styles.desktopMainColumn : null}>
                {/* ── Acceso a Centro Logístico ───────────────────────────────── */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("Logistica")}
                  style={styles.logisticCard}
                >
                  <View style={styles.logisticCardLeft}>
                    <View style={styles.logisticIconBg}>
                      <MaterialCommunityIcons
                        name="truck-delivery"
                        size={22}
                        color="#fff"
                      />
                    </View>
                    <View style={styles.logisticDetails}>
                      <Text style={styles.logisticCardTitle}>
                        CENTRO LOGÍSTICO
                      </Text>
                      <Text style={styles.logisticCardSub}>
                        Control de móviles, checklists de servicio y refuerzos
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {/* ── Centro de Acciones y Registro (Grid Categorizado) ──────────── */}
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <View style={styles.sectionLine} />
                  <Text style={styles.sectionTitle}>
                    CENTRO DE ACCIONES Y REGISTRO
                  </Text>
                </View>

                <Text style={styles.gridSectionTitle}>Operaciones y Mapa</Text>
                <View style={styles.gridContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("GestionPois")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(59, 130, 246, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-radius"
                          size={18}
                          color="#3b82f6"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Gestión de POIs</Text>
                    <Text style={styles.gridItemSub}>Puntos de interés</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.gridSectionTitle}>Servicios y Control</Text>
                <View style={styles.gridContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("WeeklyChecklist")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(139, 92, 246, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="calendar-check"
                          size={18}
                          color="#8b5cf6"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Checklist Semanal</Text>
                    <Text style={styles.gridItemSub}>Controles de móviles</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("ControlMoviles")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(225, 29, 72, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="fire-truck"
                          size={18}
                          color="#e11d48"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Control de Móviles</Text>
                    <Text style={styles.gridItemSub}>
                      Flota y compartimentos
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("ControlBolsos")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(14, 165, 233, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="bag-personal"
                          size={18}
                          color="#0ea5e9"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Control de Bolsos</Text>
                    <Text style={styles.gridItemSub}>Kits de rescate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("PedidosSuministro")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(249, 115, 22, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="cart-outline"
                          size={18}
                          color="#f97316"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Pedidos Suministro</Text>
                    <Text style={styles.gridItemSub}>Solicitud de insumos</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.gridSectionTitle}>
                  Informes y Estadísticas
                </Text>
                <View style={styles.gridContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("Estadisticas")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(225, 29, 72, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="chart-bar"
                          size={18}
                          color="#e11d48"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Métricas</Text>
                    <Text style={styles.gridItemSub}>
                      Estadísticas generales
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate("Reports")}
                    style={[styles.gridItem, actionCardStyle]}
                  >
                    <View style={styles.gridItemHeader}>
                      <View
                        style={[
                          styles.gridIconBg,
                          { backgroundColor: "rgba(148, 163, 184, 0.12)" },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="file-chart"
                          size={18}
                          color="#94a3b8"
                        />
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={16}
                        color="#475569"
                      />
                    </View>
                    <Text style={styles.gridItemTitle}>Reportes Legales</Text>
                    <Text style={styles.gridItemSub}>Historial de actas</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isDesktopWeb ? (
                <View style={styles.desktopSideColumn}>
                  {renderRecentActivity()}
                </View>
              ) : null}
            </View>

            {/* ── Administración secundaria ────────────────────────────── */}
            {/* RF-04: Solo visible para usuarios ADMIN */}
            {user?.rol === "ADMIN" && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 26 }]}>
                  <View style={styles.sectionLineMuted} />
                  <Text style={styles.sectionTitle}>ADMINISTRACIÓN</Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("Personal")}
                  style={[styles.logisticCard, styles.adminCard]}
                >
                  <View style={styles.logisticCardLeft}>
                    <View style={[styles.logisticIconBg, styles.adminIconBg]}>
                      <MaterialCommunityIcons
                        name="account-group"
                        size={22}
                        color="#c7d2fe"
                      />
                    </View>
                    <View style={styles.logisticDetails}>
                      <Text style={styles.logisticCardTitle}>
                        GESTIÓN DE PERSONAL
                      </Text>
                      <Text style={styles.logisticCardSub}>
                        Administración de bomberos, rangos y estado operativo
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("AdminEquipment")}
                  style={[
                    styles.logisticCard,
                    styles.adminCard,
                    { marginTop: 10 },
                  ]}
                >
                  <View style={styles.logisticCardLeft}>
                    <View
                      style={[
                        styles.logisticIconBg,
                        { backgroundColor: "#1a2332" },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={22}
                        color="#60a5fa"
                      />
                    </View>
                    <View style={styles.logisticDetails}>
                      <Text style={styles.logisticCardTitle}>
                        GESTIÓN DE EQUIPOS
                      </Text>
                      <Text style={styles.logisticCardSub}>
                        Control de equipamiento e inventario
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </>
            )}

            {!isDesktopWeb ? renderRecentActivity() : null}
          </>
        )}
      </ScrollView>

      {/* RF-03: Modal de notificaciones de controles de inventario */}
      <Modal
        visible={notifModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotifModalVisible(false)}
      >
        <View style={notifStyles.overlay}>
          <View style={notifStyles.panel}>
            {/* Header */}
            <View style={notifStyles.header}>
              <View style={notifStyles.headerLeft}>
                <MaterialCommunityIcons name="bell" size={20} color="#e11d48" />
                <Text style={notifStyles.title}>NOTIFICACIONES</Text>
                {unreadCount > 0 && (
                  <View style={notifStyles.headerBadge}>
                    <Text style={notifStyles.headerBadgeText}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <View style={notifStyles.headerActions}>
                {notifications.length > 0 && (
                  <>
                    <TouchableOpacity
                      onPress={markAllAsRead}
                      style={notifStyles.headerBtn}
                    >
                      <Text style={notifStyles.headerBtnText}>LEER TODO</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={clearAll}
                      style={notifStyles.headerBtn}
                    >
                      <MaterialCommunityIcons
                        name="delete-sweep-outline"
                        size={16}
                        color="#64748b"
                      />
                    </TouchableOpacity>
                  </>
                )}
                <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color="#94a3b8"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista */}
            <ScrollView
              style={notifStyles.list}
              showsVerticalScrollIndicator={false}
            >
              {notifications.length === 0 ? (
                <View style={notifStyles.emptyState}>
                  <MaterialCommunityIcons
                    name="bell-check-outline"
                    size={48}
                    color="#334155"
                  />
                  <Text style={notifStyles.emptyText}>Sin notificaciones</Text>
                  <Text style={notifStyles.emptySubtext}>
                    Aquí aparecerán los controles de inventario realizados por
                    los bomberos.
                  </Text>
                </View>
              ) : (
                notifications.map((n) => {
                  const isFaltante = n.tieneFaltantes;
                  const tipoLabel =
                    n.tipo === "CONTROL_DIARIO"
                      ? "Control Diario"
                      : n.tipo === "CONTROL_BOLSO"
                        ? "Control Post-Emergencia"
                        : n.tipo === "PEDIDO_SUMINISTRO"
                          ? "Pedido de Suministro"
                          : n.tipo === "CONTROL_CUARTEL"
                            ? "Inventario de Base"
                            : "Control";
                  const tipoIcon =
                    n.tipo === "CONTROL_DIARIO"
                      ? "clipboard-check-outline"
                      : n.tipo === "CONTROL_BOLSO"
                        ? "bag-personal-outline"
                        : n.tipo === "PEDIDO_SUMINISTRO"
                          ? "truck-delivery-outline"
                          : "package-variant-closed";
                  const fecha = n.fechaHora
                    ? new Date(n.fechaHora)
                    : new Date();
                  const horaText = fecha.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  const fechaText = fecha.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                  });

                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={[
                        notifStyles.item,
                        !n.leida && notifStyles.itemUnread,
                        isFaltante && notifStyles.itemFaltante,
                      ]}
                      onPress={() => markAsRead(n.id)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          notifStyles.itemIcon,
                          {
                            backgroundColor: isFaltante
                              ? "rgba(239, 68, 68, 0.12)"
                              : "rgba(16, 185, 129, 0.12)",
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={isFaltante ? "alert-circle" : tipoIcon}
                          size={20}
                          color={isFaltante ? "#ef4444" : "#10b981"}
                        />
                      </View>
                      <View style={notifStyles.itemContent}>
                        <View style={notifStyles.itemTopRow}>
                          <Text
                            style={notifStyles.itemBombero}
                            numberOfLines={1}
                          >
                            {n.bomberoNombre || "Bombero"}
                          </Text>
                          {!n.leida && <View style={notifStyles.unreadDot} />}
                        </View>
                        <Text style={notifStyles.itemTipo}>{tipoLabel}</Text>
                        {n.recursoNombre && (
                          <Text style={notifStyles.itemRecurso}>
                            {n.recursoNombre}
                          </Text>
                        )}
                        {n.mensaje && (
                          <Text
                            style={[
                              notifStyles.itemRecurso,
                              {
                                color: "#94a3b8",
                                fontStyle: "italic",
                                marginTop: 2,
                              },
                            ]}
                            numberOfLines={3}
                          >
                            {n.mensaje}
                          </Text>
                        )}
                        {isFaltante && n.cantidadFaltantes > 0 && (
                          <View style={notifStyles.faltanteBadge}>
                            <MaterialCommunityIcons
                              name="alert"
                              size={11}
                              color="#fbbf24"
                            />
                            <Text style={notifStyles.faltanteText}>
                              {n.cantidadFaltantes} FALTANTE
                              {n.cantidadFaltantes > 1 ? "S" : ""}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={notifStyles.itemTime}>
                        {horaText}
                        {"\n"}
                        {fechaText}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// RF-03: Estilos del sistema de notificaciones
const notifStyles = StyleSheet.create({
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#e11d48",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#1a1c23",
  },
  bellBadgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "900",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start",
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  panel: {
    backgroundColor: "#16181d",
    borderRadius: 18,
    maxHeight: "70%",
    borderWidth: 1,
    borderColor: "#26282f",
    marginHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 15 },
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#26282f",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  headerBadge: {
    backgroundColor: "#e11d48",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  headerBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerBtnText: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
  emptySubtext: {
    color: "#475569",
    fontSize: 11,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 20,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1b1d24",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    gap: 10,
    borderWidth: 1,
    borderColor: "#26282f",
  },
  itemUnread: {
    borderColor: "#334155",
    backgroundColor: "#1e2028",
  },
  itemFaltante: {
    borderColor: "rgba(239, 68, 68, 0.25)",
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
  },
  itemIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  itemContent: {
    flex: 1,
  },
  itemTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemBombero: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "800",
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3b82f6",
  },
  itemTipo: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  itemRecurso: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 1,
  },
  faltanteBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  faltanteText: {
    color: "#fbbf24",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  itemTime: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "right",
    lineHeight: 13,
  },
});
