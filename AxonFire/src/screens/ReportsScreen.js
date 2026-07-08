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
import * as Print from 'expo-print';
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
  const { user, token } = useAuth();
  
  // ── Print desde listado: abre informe en nueva pestaña ──
  const imprimirDesdeListado = async (alerta) => {
    if (Platform.OS !== 'web') return;

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Fetch responses for this alert
    let alertResponses = [];
    try {
      const res = await axios.get(`${API_BASE_URL}/respuestas_alertas/${alerta.id}`, { headers, timeout: 5000 });
      if (res.status === 200 && Array.isArray(res.data)) alertResponses = res.data;
    } catch (err) {
      console.log('Error loading responses for print:', err?.message);
    }

    const aceptados = alertResponses
      .filter(r => r.estado_respuesta === 'ACEPTADO')
      .map(r => {
        const b = r.usuarioId?.bombero || r.bombero || {};
        const name = b.nombre ? `${b.nombre} ${b.apellido || ''}` : 'BOMBERO';
        return {
          name: name.toUpperCase(),
          role: b.rangoBombero?.nombre_rol || b.rango || 'BOMBERO',
          hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
        };
      });

    const fechaInicio = parseDateLocal(alerta.fecha_hora);
    let fechaFin;
    if (alerta.fecha_hora_finalizacion) {
      fechaFin = parseDateLocal(alerta.fecha_hora_finalizacion);
    } else {
      fechaFin = new Date(fechaInicio.getTime() + 2 * 60 * 60 * 1000);
    }

    const formatFH = (d) => d.toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    const tableRows = aceptados.map(r => `
      <tr><td>${r.name}</td><td>${r.role}</td><td>${r.hora} HS</td></tr>
    `).join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Informe Legal - Siniestro #${alerta.id?.slice(0, 8).toUpperCase()}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; line-height: 1.6; max-width: 900px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 22px; text-transform: uppercase; margin: 0; color: #7f1d1d; letter-spacing: 1px; }
    .header h2 { font-size: 13px; margin: 5px 0 0; color: #475569; font-weight: normal; letter-spacing: 2px; }
    .doc-title { text-align: center; text-transform: uppercase; font-size: 16px; font-weight: bold; margin: 20px 0; color: #0f172a; text-decoration: underline; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 13px; text-transform: uppercase; font-weight: bold; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-bottom: 12px; color: #7f1d1d; }
    .grid { display: flex; flex-wrap: wrap; margin-bottom: 15px; }
    .grid-item { width: 50%; margin-bottom: 8px; font-size: 13px; box-sizing: border-box; }
    .grid-item span { font-weight: bold; color: #475569; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .stamp-box { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border: 1px dashed #cbd5e1; padding: 15px; border-radius: 6px; }
    .footer-signature { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; text-align: center; border-top: 1px solid #94a3b8; padding-top: 10px; font-size: 12px; color: #475569; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Cuerpo de Bomberos Voluntarios</h1>
    <h2>DOCUMENTO DE CONSTANCIA OFICIAL</h2>
  </div>
  <div class="doc-title">Borrador de Informe Legal de Siniestro</div>
  <div class="section">
    <div class="section-title">Datos de la Emergencia</div>
    <div class="grid">
      <div class="grid-item"><span>ID Alerta:</span> ${alerta.id}</div>
      <div class="grid-item"><span>Tipo de Siniestro:</span> ${alerta.subCategoriaAlerta?.nombre_sub_categoria || alerta.observaciones || 'Siniestro'}</div>
      <div class="grid-item"><span>Fecha/Hora Inicio:</span> ${formatFH(fechaInicio)}</div>
      <div class="grid-item"><span>Fecha/Hora Fin:</span> ${formatFH(fechaFin)}</div>
      <div class="grid-item"><span>Ubicación:</span> ${alerta.ubicacion || 'No especificada'}</div>
      <div class="grid-item"><span>Estado:</span> FINALIZADO</div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Descripción y Observaciones</div>
    <p style="font-size:13px;margin:5px 0;">${alerta.observaciones || 'No hay observaciones adicionales.'}</p>
  </div>
  <div class="section">
    <div class="section-title">Personal de Asistencia</div>
    ${tableRows ? `<table><thead><tr><th>Nombre y Apellido</th><th>Rango</th><th>Hora de Respuesta</th></tr></thead><tbody>${tableRows}</tbody></table>` : '<p style="font-size:13px;color:#64748b;">No se registraron asistencias oficiales.</p>'}
  </div>
  <div class="stamp-box">
    <strong>Nota Importante:</strong> Este documento constituye un borrador generado por AxonFire. El informe definitivo con firma digital o sello debe solicitarse en la sede del Cuartel.
  </div>
  <div class="footer-signature">
    <div class="signature-box">Firma y Aclaración<br>Oficial a Cargo del Siniestro</div>
    <div class="signature-box">Firma y Sello<br>Jefe de Cuerpo / Administración</div>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => { printWindow.print(); }, 500);
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
  const generateLegalReportPDF = async (alerta) => {
    setGeneratingPdfId(alerta.id);
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 1. Obtener las respuestas de esta alerta específica para poder cruzar los bomberos aceptados
      let alertResponses = [];
      try {
        const resResp = await axios.get(`${API_BASE_URL}/respuestas_alertas/${alerta.id}`, {
          headers,
          timeout: 5000
        });
        if (resResp.status === 200 && Array.isArray(resResp.data)) {
          alertResponses = resResp.data;
        }
      } catch (err) {
        console.log('Error loading responses for alert, trying backup endpoint:', err?.message || err);
        try {
          const resRespBackup = await axios.get(`${API_BASE_URL}/respuestas_alertas`, {
            headers,
            timeout: 5000
          });
          if (resRespBackup.status === 200 && Array.isArray(resRespBackup.data)) {
            alertResponses = resRespBackup.data.filter(
              r => r.alerta_id === alerta.id || r.alertaId === alerta.id || r.alertaId?.id === alerta.id
            );
          }
        } catch (backupErr) {
          console.log('Backup responses fetch failed:', backupErr?.message || backupErr);
        }
      }

      // 2. Combinar con respuestas locales de AsyncStorage si las hubiera
      try {
        const localSaved = await AsyncStorage.getItem(`responses_${alerta.id}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          const combined = [...alertResponses];
          parsed.forEach(fl => {
            const uId = fl.usuario_id || fl.usuarioId?.id;
            if (uId && !combined.some(c => (c.usuario_id || c.usuarioId?.id) === uId)) {
              combined.push(fl);
            }
          });
          alertResponses = combined;
        }
      } catch (e) {
        console.log('Error reading local responses:', e);
      }

      // 3. Fallback adicional por si acaso (para mantener compatibilidad heredada)
      try {
        const storedResponses = await AsyncStorage.getItem('local_alert_responses');
        if (storedResponses) {
          const parsed = JSON.parse(storedResponses);
          const filteredLocal = parsed.filter(r => r.alerta_id === alerta.id || r.alertaId?.id === alerta.id);
          const combined = [...alertResponses];
          filteredLocal.forEach(fl => {
            const uId = fl.usuario_id || fl.usuarioId?.id;
            if (uId && !combined.some(c => (c.usuario_id || c.usuarioId?.id) === uId)) {
              combined.push(fl);
            }
          });
          alertResponses = combined;
        }
      } catch (e) {
        console.log('Error reading fallback local responses:', e);
      }

      const aceptados = alertResponses
        .filter(r => r.estado_respuesta === 'ACEPTADO')
        .map((r, i) => {
          const b = r.usuarioId?.bombero || r.bombero || {};
          const nombreUsuario = r.usuarioId?.nombre_usuario || r.usuarioId?.nombre || '';
          const name = b.nombre ? `${b.nombre} ${b.apellido || ''}` : nombreUsuario;
          return {
            name: (name || 'BOMBERO').toUpperCase(),
            role: b.rangoBombero?.nombre_rol || b.rango || 'BOMBERO',
            hora: r.fecha_hora ? new Date(r.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'
          };
        });

      const fechaInicio = parseDateLocal(alerta.fecha_hora);
      let fechaFin;
      if (alerta.fecha_hora_finalizacion) {
        fechaFin = parseDateLocal(alerta.fecha_hora_finalizacion);
      } else if (alerta.duracion_total_alerta) {
        // Si duracion_total_alerta > 1000, asumimos que está en milisegundos y lo usamos directamente;
        // de lo contrario, lo tratamos como horas y lo convertimos a milisegundos.
        const duracionMs = alerta.duracion_total_alerta > 1000
          ? alerta.duracion_total_alerta
          : alerta.duracion_total_alerta * 60 * 60 * 1000;
        fechaFin = new Date(fechaInicio.getTime() + duracionMs);
      } else {
        // Estimar 2 horas por defecto
        fechaFin = new Date(fechaInicio.getTime() + 2 * 60 * 60 * 1000);
      }

      const formatFechaHora = (date) => {
        return date.toLocaleString('es-AR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
      };

      const tableRows = aceptados.map(r => `
        <tr>
          <td>${r.name}</td>
          <td>${r.role}</td>
          <td>${r.hora} HS</td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                color: #1e293b;
                padding: 40px;
                line-height: 1.6;
              }
              .header {
                text-align: center;
                border-bottom: 3px double #0f172a;
                padding-bottom: 20px;
                margin-bottom: 30px;
              }
              .header h1 {
                font-size: 24px;
                text-transform: uppercase;
                margin: 0;
                color: #7f1d1d;
                letter-spacing: 1px;
              }
              .header h2 {
                font-size: 14px;
                margin: 5px 0 0 0;
                color: #475569;
                font-weight: normal;
                letter-spacing: 2px;
              }
              .doc-title {
                text-align: center;
                text-transform: uppercase;
                font-size: 18px;
                font-weight: bold;
                margin: 20px 0;
                color: #0f172a;
                text-decoration: underline;
              }
              .section {
                margin-bottom: 25px;
              }
              .section-title {
                font-size: 14px;
                text-transform: uppercase;
                font-weight: bold;
                border-bottom: 1px solid #cbd5e1;
                padding-bottom: 5px;
                margin-bottom: 12px;
                color: #7f1d1d;
              }
              .grid {
                display: flex;
                flex-wrap: wrap;
                margin-bottom: 15px;
              }
              .grid-item {
                width: 50%;
                margin-bottom: 8px;
                font-size: 13px;
              }
              .grid-item span {
                font-weight: bold;
                color: #475569;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 13px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #f1f5f9;
                color: #0f172a;
                font-weight: bold;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .footer-signature {
                margin-top: 60px;
                display: flex;
                justify-content: space-between;
              }
              .signature-box {
                width: 45%;
                text-align: center;
                border-top: 1px solid #94a3b8;
                padding-top: 10px;
                font-size: 12px;
                color: #475569;
              }
              .stamp-box {
                margin-top: 40px;
                text-align: center;
                font-size: 11px;
                color: #64748b;
                border: 1px dashed #cbd5e1;
                padding: 15px;
                border-radius: 6px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Cuerpo de Bomberos Voluntarios</h1>
              <h2>DOCUMENTO DE CONSTANCIA OFICIAL</h2>
            </div>
            
            <div class="doc-title">Borrador de Informe Legal de Siniestro</div>
            
            <div class="section">
              <div class="section-title">Datos de la Emergencia</div>
              <div class="grid">
                <div class="grid-item"><span>ID Alerta:</span> ${alerta.id}</div>
                <div class="grid-item"><span>Tipo de Siniestro:</span> ${alerta.subCategoriaAlerta?.nombre_sub_categoria || alerta.observaciones || 'Siniestro'}</div>
                <div class="grid-item"><span>Fecha/Hora Inicio:</span> ${formatFechaHora(fechaInicio)}</div>
                <div class="grid-item"><span>Fecha/Hora Fin (Est.):</span> ${formatFechaHora(fechaFin)}</div>
                <div class="grid-item"><span>Ubicación:</span> ${alerta.ubicacion || 'No especificada'}</div>
                <div class="grid-item"><span>Estado:</span> FINALIZADO</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Descripción y Observaciones</div>
              <p style="font-size: 13px; margin: 5px 0;">${alerta.observaciones || 'No hay observaciones adicionales registradas para este siniestro.'}</p>
            </div>

            <div class="section">
              <div class="section-title">Personal de Asistencia</div>
              <table>
                <thead>
                  <tr>
                    <th>Nombre y Apellido</th>
                    <th>Rango</th>
                    <th>Hora de Respuesta</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows || '<tr><td colspan="3" style="text-align:center;">No se registraron asistencias oficiales.</td></tr>'}
                </tbody>
              </table>
            </div>

            <div class="stamp-box">
              <strong>Nota Importante para la Aseguradora / Desarrollo Social:</strong><br>
              El presente documento constituye un borrador de informe de intervención de emergencia expedido por el sistema digital AxonFire. El informe definitivo con firma digital o sello holográfico del Jefe de Cuerpo debe solicitarse en la sede central del Cuartel de Bomberos Voluntarios correspondiente.
            </div>

            <div class="footer-signature">
              <div class="signature-box">
                Firma y Aclaración<br>
                Oficial a Cargo del Siniestro
              </div>
              <div class="signature-box">
                Firma y Sello<br>
                Jefe de Cuerpo / Administración
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Informe_Legal_${alerta.id}.pdf`,
        UTI: 'com.adobe.pdf'
      });
    } catch (err) {
      console.log('Error generating PDF:', err);
      Alert.alert('Error', 'No se pudo generar el borrador legal en PDF.');
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
            <TouchableOpacity
              key={item.id}
              className="printable-card"
              style={styles.alertCard}
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
                    <MaterialCommunityIcons name="file-document-outline" size={18} color="#fff" />
                    <Text style={styles.pdfButtonText}>GENERAR BORRADOR LEGAL</Text>
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
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