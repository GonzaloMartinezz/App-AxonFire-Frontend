import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  FlatList,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles } from '../styles/ReportsScreenStyles';

const { width } = Dimensions.get('window');

const MESES = [
  { value: 0, label: 'Enero' },
  { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' },
  { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' },
  { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' },
  { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' },
  { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' },
  { value: 11, label: 'Diciembre' }
];

const ANIOS = [2024, 2025, 2026, 2027];

// ── Helper: parsea fecha de la base de datos a local ──────────────────────────
function parseDateLocal(dateInput) {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput !== 'string') return new Date(dateInput);

  // Strip 'Z' at the end or '+00:00' timezone offset to parse it as local time
  const cleaned = dateInput.replace(/Z$/, '').replace(/\+00:?00$/, '');
  return new Date(cleaned);
}

export default function ReportsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
  
  // ── Abrir PDF del backend en nueva pestaña (web) ──
  const imprimirDesdeListado = async (alerta) => {
    if (Platform.OS !== 'web') return;
    setGeneratingPdfId(alerta.id);
    const win = window.open('', '_blank');
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const checkRes = await fetch(`${API_BASE_URL}/informes/${alerta.id}/datos`, { headers });
      if (!checkRes.ok) {
        win.close();
        Alert.alert('Informe no disponible', 'No se encuentra cargado el informe legal, por favor, asocie uno antes de imprimir');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/informes/${alerta.id}/pdf`, {
        headers,
        responseType: 'blob',
        timeout: 60000
      });
      const url = URL.createObjectURL(response.data);
      win.location.href = url;
    } catch (err) {
      win.close();
      console.log('Error al obtener PDF del backend:', err?.message);
      Alert.alert('Error', 'No se pudo generar el informe PDF desde el servidor.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth());
  const [selectedAnio, setSelectedAnio] = useState(new Date().getFullYear());
  const [mesModalVisible, setMesModalVisible] = useState(false);
  const [anioModalVisible, setAnioModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [finalizedAlerts, setFinalizedAlerts] = useState([]);
  const [generatingPdfId, setGeneratingPdfId] = useState(null);

  // Cargar alertas finalizadas
  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 1. Obtener límites mensuales
      const desde = new Date(selectedAnio, selectedMes, 1).toISOString();
      const hasta = new Date(selectedAnio, selectedMes + 1, 0, 23, 59, 59, 999).toISOString();

      console.log('ReportsScreen - Rango de fechas para consulta:', { desde, hasta });

      let alertsData = [];

      // 2. Fetch Alertas por rango
      try {
        const resAlerts = await axios.get(`${API_BASE_URL}/alerta/rango`, {
          params: { fecha_desde: desde, fecha_hasta: hasta },
          headers,
          timeout: 5000
        });
        const data = resAlerts.data;
        alertsData = Array.isArray(data?.alertas) ? data.alertas : Array.isArray(data) ? data : [];
      } catch (err) {
        console.log('Error loading range alerts for reports:', err?.message || err);
      }

      // 3. Filtrar alertas finalizadas
      // Chequear si el estado de la alerta es FINALIZADO, o si tiene fecha de finalización,
      // o si está marcada como finalizada de forma local en AsyncStorage.
      const filtered = [];
      for (const alert of alertsData) {
        const isLocallyFinalized = await AsyncStorage.getItem(`finalized_alert_${alert.id}`);
        const isFinalized =
          alert.estadoAlerta?.nombre_estado === 'FINALIZADO' ||
          !!alert.fecha_hora_finalizacion ||
          isLocallyFinalized === 'true';

        if (isFinalized) {
          filtered.push({
            ...alert,
            // Normalizar el estado a finalizado para la UI
            estadoAlerta: {
              ...alert.estadoAlerta,
              nombre_estado: 'FINALIZADO'
            }
          });
        }
      }

      // Ordenar por fecha decreciente
      filtered.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      setFinalizedAlerts(filtered);

    } catch (err) {
      console.log('Error calculating reports:', err);
      Alert.alert('Error', 'No se pudieron cargar los reportes legales.');
    } finally {
      setLoading(false);
    }
  }, [selectedMes, selectedAnio, token]);

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  // Generación de PDF Legal
  // Descargar PDF del backend y compartir
  const generateLegalReportPDF = async (alerta) => {
    setGeneratingPdfId(alerta.id);
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const checkRes = await fetch(`${API_BASE_URL}/informes/${alerta.id}/datos`, { headers });
      if (!checkRes.ok) {
        Alert.alert('Informe no disponible', 'No se encuentra cargado el informe legal, por favor, asocie uno antes de imprimir');
        return;
      }

      const fileUri = FileSystem.documentDirectory + `informe_${alerta.id}.pdf`;
      const downloadPromise = FileSystem.downloadAsync(
        `${API_BASE_URL}/informes/${alerta.id}/pdf`,
        fileUri,
        { headers }
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 60000)
      );
      const downloadResult = await Promise.race([downloadPromise, timeoutPromise]);
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Informe_Legal_${alerta.id}.pdf`,
        UTI: 'com.adobe.pdf'
      });
    } catch (err) {
      console.log('Error downloading PDF from backend:', err);
      Alert.alert('Error', 'No se pudo generar el informe PDF desde el servidor.');
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Filtrado de la lista por texto de búsqueda
  const filteredAlertsList = finalizedAlerts.filter(a => {
    const query = searchText.toLowerCase();
    const obsMatch = (a.observaciones || '').toLowerCase().includes(query);
    const locMatch = (a.ubicacion || '').toLowerCase().includes(query);
    const idMatch = (a.id || '').toLowerCase().includes(query);
    const catMatch = (a.subCategoriaAlerta?.nombre_sub_categoria || '').toLowerCase().includes(query);
    return obsMatch || locMatch || idMatch || catMatch;
  });

  const currentMesLabel = MESES.find(m => m.value === selectedMes)?.label || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121417" />

      {/* Header */}
      <View className="no-print" style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#e11d48" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>REPORTES LEGALES</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
          <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Subtítulo informativo */}
        <Text className="no-print" style={styles.screenDesc}>
          Historial de siniestros finalizados y emisión de constancias legales en PDF para aseguradoras.
        </Text>

        {/* Barra de Filtros */}
        <View className="no-print" style={styles.filtersContainer}>
          <TouchableOpacity style={styles.filterSelector} onPress={() => setMesModalVisible(true)}>
            <MaterialCommunityIcons name="calendar-month" size={18} color="#cbd5e1" />
            <Text style={styles.filterText}>{currentMesLabel.toUpperCase()}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterSelector} onPress={() => setAnioModalVisible(true)}>
            <MaterialCommunityIcons name="calendar-today" size={18} color="#cbd5e1" />
            <Text style={styles.filterText}>{selectedAnio}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Buscador */}
        <View className="no-print" style={styles.searchRow}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="BUSCAR POR PALABRA CLAVE O UBICACIÓN"
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <MaterialCommunityIcons name="close" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Cuerpo / Listado */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
            <Text style={styles.loadingText}>Cargando reportes del mes...</Text>
          </View>
        ) : filteredAlertsList.length > 0 ? (
          filteredAlertsList.map((item) => (
            <View
              key={item.id}
              className="printable-card"
              style={styles.alertCard}
            >
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => navigation.navigate('AlertDetail', { alerta_id: item.id })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.cardId}>SINIESTRO #{item.id.slice(0, 8).toUpperCase()}</Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>FINALIZADO</Text>
                  </View>
                </View>

                <Text style={styles.cardTitle}>
                  {item.subCategoriaAlerta?.nombre_sub_categoria || item.observaciones || 'Incidente'}
                </Text>

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={15} color="#94a3b8" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {item.ubicacion || 'Ubicación no especificada'}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={15} color="#94a3b8" />
                  <Text style={styles.metaText}>
                    {parseDateLocal(item.fecha_hora).toLocaleDateString('es-AR')} • {parseDateLocal(item.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} HS
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pdfButton}
                onPress={() => Platform.OS === 'web' ? imprimirDesdeListado(item) : generateLegalReportPDF(item)}
                disabled={generatingPdfId !== null}
                activeOpacity={0.8}
              >
                {generatingPdfId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="printer" size={18} color="#fff" />
                    <Text style={styles.pdfButtonText}>IMPRIMIR REPORTE LEGAL</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-cancel-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>
              No hay emergencias finalizadas registradas en este período.
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Mes Modal Selector */}
      <Modal visible={mesModalVisible} transparent animationType="fade" onRequestClose={() => setMesModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECCIONAR MES</Text>
              <TouchableOpacity onPress={() => setMesModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={MESES}
              keyExtractor={(item) => String(item.value)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedMes === item.value && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedMes(item.value);
                    setMesModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedMes === item.value && styles.modalItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Anio Modal Selector */}
      <Modal visible={anioModalVisible} transparent animationType="fade" onRequestClose={() => setAnioModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SELECCIONAR AÑO</Text>
              <TouchableOpacity onPress={() => setAnioModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={ANIOS}
              keyExtractor={(item) => String(item)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalItem, selectedAnio === item && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedAnio(item);
                    setAnioModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, selectedAnio === item && styles.modalItemTextActive]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};