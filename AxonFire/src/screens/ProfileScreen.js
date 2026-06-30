import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles, dataStyles, actionStyles } from '../styles/ProfileScreenStyles';

// ── Rank mappings ────────────────────────────────────────────────
const RANGO_MAP = {
  CAD: { label: 'CADETE', color: '#94a3b8', bg: '#1e293b' },
  BOM: { label: 'BOMBERO', color: '#fca5a5', bg: '#2d1515' },
  OFI: { label: 'OFICIAL', color: '#fbbf24', bg: '#271e05' },
  CADETE: { label: 'CADETE', color: '#94a3b8', bg: '#1e293b' },
  BOMBERO: { label: 'BOMBERO', color: '#fca5a5', bg: '#2d1515' },
  OFICIAL: { label: 'OFICIAL', color: '#fbbf24', bg: '#271e05' },
  'CAPITÁN': { label: 'CAPITÁN', color: '#fbbf24', bg: '#271e05' },
  TENIENTE: { label: 'TENIENTE', color: '#60a5fa', bg: '#0f1e3a' },
  SARGENTO: { label: 'SARGENTO', color: '#34d399', bg: '#0a2518' },
};

function getRangoInfo(rango) {
  if (!rango) return { label: 'BOMBERO', color: '#fca5a5', bg: '#2d1515' };
  return RANGO_MAP[rango.toUpperCase()] || RANGO_MAP[rango] || { label: rango.toUpperCase(), color: '#fca5a5', bg: '#2d1515' };
}

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { logout, user, token } = useAuth();

  const [profile, setProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editField, setEditField] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editConfirm, setEditConfirm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEditPw, setShowEditPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  // ── Fetch profile ──────────────────────────────────────────────
  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!user?.id || !token) {
      setIsLoadingProfile(false);
      return;
    }
    try {
      if (isRefresh) setRefreshing(true);
      else setIsLoadingProfile(true);

      const res = await fetch(`${API_BASE_URL}/usuarios/bomberos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const list = await res.json();
        // API returns: { id (bombero pk), nombre, apellido, rangoBombero: { nombre_rol }, usuarioId: { id, nombre_usuario } }
        const me = Array.isArray(list)
          ? list.find((b) => String(b.usuarioId?.id) === String(user.id))
          : null;
        setProfile(me || null);
      }
    } catch (e) {
      console.warn('Error fetching profile:', e);
    } finally {
      setIsLoadingProfile(false);
      setRefreshing(false);
    }
  }, [user, token]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ── Derived values ─────────────────────────────────────────────
  const nombre = profile?.nombre || '';
  const apellido = profile?.apellido || '';
  const fullName = nombre && apellido
    ? `${nombre} ${apellido}`
    : nombre || apellido || user?.nombre_usuario || 'USUARIO';
  const rango = profile?.rango || profile?.rangoBombero?.nombre_rol || '';
  const rangoInfo = getRangoInfo(rango);
  const username = profile?.usuarioId?.nombre_usuario || user?.nombre_usuario || '';
  const isAdmin = user?.rol === 'ADMIN';

  // ── Logout ─────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: () => logout(), style: 'destructive' },
      ]
    );
  };

  // ── Edit modal ─────────────────────────────────────────────────
  const openEdit = (field) => {
    setEditField(field);
    setEditValue('');
    setEditConfirm('');
    setShowEditPw(false);
    setShowConfirmPw(false);
    setEditVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editValue.trim()) {
      Alert.alert('Error', 'El campo no puede estar vacío.');
      return;
    }
    if (editField === 'password') {
      if (editValue !== editConfirm) {
        Alert.alert('Error', 'Las contraseñas no coinciden.');
        return;
      }
      if (editValue.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }
    setIsSaving(true);
    try {
      let body = {};
      if (editField === 'password') body = { password: editValue };
      else if (editField === 'nombre') body = { bombero: { nombre: editValue.trim().toUpperCase() } };
      else if (editField === 'apellido') body = { bombero: { apellido: editValue.trim().toUpperCase() } };

      const res = await fetch(`${API_BASE_URL}/usuarios/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        Alert.alert('✅ Guardado', 'Tu perfil fue actualizado.');
        setEditVisible(false);
        fetchProfile(true);
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Sin soporte aún', err.message || 'La edición de perfil no está disponible. Contactá al administrador.');
        setEditVisible(false);
      }
    } catch {
      Alert.alert('Sin conexión', 'No se pudo conectar al servidor.');
      setEditVisible(false);
    } finally {
      setIsSaving(false);
    }
  };

  const editConfig = {
    nombre: { title: 'EDITAR NOMBRE', icon: 'account-edit', isPassword: false },
    apellido: { title: 'EDITAR APELLIDO', icon: 'account-edit', isPassword: false },
    password: { title: 'CAMBIAR CONTRASEÑA', icon: 'lock-reset', isPassword: true },
  };
  const cfg = editConfig[editField] || {};

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      {/* ── Top Bar ─────────────────────────────────────── */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <View style={styles.topBarLogo}>
            <MaterialCommunityIcons name="fire" size={16} color="#0284c7" />
          </View>
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <View style={styles.topBarRight}>
          {isAdmin && (
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('AdminApp')}>
              <MaterialCommunityIcons name="monitor-dashboard" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
          </TouchableOpacity>
        </View>
      </View>



      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchProfile(true)}
            tintColor="#dc2626"
            colors={['#dc2626']}
          />
        }
      >
        {/* ── Hero ─────────────────────────────────────── */}
        <Text style={styles.pageLabel}>MI PERFIL</Text>
        <Text style={styles.pageTitle}>INFORMACIÓN{'\n'}OPERATIVA</Text>

        {/* ── Profile Card ─────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardLeft}>
            <View style={styles.avatarBox}>
              <MaterialCommunityIcons name="shield-account" size={32} color="#e11d48" />
            </View>
            <View style={styles.onlineDot} />
          </View>
          <View style={styles.profileCardInfo}>
            {isLoadingProfile ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Text style={styles.profileName} numberOfLines={1}>
                  {fullName.toUpperCase()}
                </Text>
                {username ? <Text style={styles.profileUsername}>@{username}</Text> : null}
              </>
            )}
            <View style={styles.badgesRow}>
              <View style={[styles.badge, { backgroundColor: rangoInfo.bg }]}>
                <Text style={[styles.badgeText, { color: rangoInfo.color }]}>{rangoInfo.label}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: isAdmin ? '#1a0a2e' : '#0f1e3a' }]}>
                <Text style={[styles.badgeText, { color: isAdmin ? '#c084fc' : '#38bdf8' }]}>
                  {isAdmin ? 'ADMINISTRADOR' : 'BOMBERO'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Admin Banner ─────────────────────────────── */}
        {isAdmin && (
          <TouchableOpacity
            style={styles.adminBanner}
            onPress={() => navigation.navigate('AdminApp')}
            activeOpacity={0.8}
          >
            <View style={styles.adminBannerLeft}>
              <MaterialCommunityIcons name="shield-crown" size={18} color="#dc2626" />
              <View>
                <Text style={styles.adminBannerTitle}>MODO VISTA BOMBERO</Text>
                <Text style={styles.adminBannerSub}>Toca para volver al Panel de Control</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#334155" />
          </TouchableOpacity>
        )}

        {/* ── Datos personales ─────────────────────────── */}
        <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>

        <View style={styles.card}>
          <DataRow icon="account" label="NOMBRE" value={nombre || '—'} />
          <DataRow icon="account" label="APELLIDO" value={apellido || '—'} />
          <DataRow icon="at" label="USUARIO" value={username || '—'} />
          <DataRow icon="star-circle" label="RANGO" value={rangoInfo.label} valueColor={rangoInfo.color} />
          <DataRow
            icon={isAdmin ? 'shield-crown' : 'shield-account'}
            label="ROL EN EL SISTEMA"
            value={isAdmin ? 'Admin' : 'Bombero'}
            valueColor={isAdmin ? '#c084fc' : '#38bdf8'}
            noBorder
          />
        </View>

        {/* ── Operaciones ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>OPERACIONES</Text>
        <View style={styles.card}>
          <ActionRow
            icon="truck-delivery"
            iconBg="#2d1515"
            iconColor="#dc2626"
            title="Centro Logístico"
            sub="Acceso a móviles y recursos"
            onPress={() => navigation.navigate('Logistica')}
            noBorder
          />
        </View>

        {/* ── Acciones ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>ACCIONES DE CUENTA</Text>

        <View style={styles.card}>
          <ActionRow
            icon="account-edit"
            iconBg="#1e3a5f"
            iconColor="#60a5fa"
            title="Editar Nombre"
            sub="Cambiar nombre en el sistema"
            onPress={() => openEdit('nombre')}
          />
          <ActionRow
            icon="account-edit-outline"
            iconBg="#1e3a5f"
            iconColor="#60a5fa"
            title="Editar Apellido"
            sub="Actualizar apellido"
            onPress={() => openEdit('apellido')}
          />
          <ActionRow
            icon="lock-reset"
            iconBg="#0a2518"
            iconColor="#34d399"
            title="Cambiar Contraseña"
            sub="Actualizar credenciales de acceso"
            onPress={() => openEdit('password')}
            noBorder
          />
        </View>

        {/* ── Gestión Admin (solo ADMIN) ────────────────── */}
        {isAdmin && (
          <>
            <Text style={styles.sectionTitle}>GESTIÓN ADMINISTRATIVA</Text>
            <View style={styles.card}>
              <ActionRow
                icon="account-cog"
                iconBg="#1a1240"
                iconColor="#818cf8"
                title="Gestión de Usuarios"
                sub="Agregar o gestionar bomberos"
                onPress={() => navigation.navigate('AddFirefighter')}
                noBorder
              />
            </View>
          </>
        )}

        {/* ── Logout ───────────────────────────────────── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={18} color="#e11d48" />
          <Text style={styles.logoutText}>CERRAR SESIÓN</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>AXON FIRE · SISTEMA TÁCTICO v1.0</Text>
      </ScrollView>

      {/* ── Edit Modal ───────────────────────────────────── */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isSaving && setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View style={styles.modalIconBox}>
                <MaterialCommunityIcons name={cfg.icon || 'pencil'} size={20} color="#e11d48" />
              </View>
              <Text style={styles.modalTitle}>{cfg.title}</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => !isSaving && setEditVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDivider} />

            {cfg.isPassword ? (
              <>
                <Text style={styles.modalLabel}>NUEVA CONTRASEÑA</Text>
                <View style={styles.modalInputWrap}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Mínimo 6 caracteres..."
                    placeholderTextColor="#334155"
                    value={editValue}
                    onChangeText={setEditValue}
                    secureTextEntry={!showEditPw}
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                  <TouchableOpacity onPress={() => setShowEditPw(v => !v)} style={styles.pwToggle}>
                    <MaterialCommunityIcons name={showEditPw ? 'eye-off' : 'eye'} size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.modalLabel, { marginTop: 14 }]}>CONFIRMAR CONTRASEÑA</Text>
                <View style={styles.modalInputWrap}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Repetir contraseña..."
                    placeholderTextColor="#334155"
                    value={editConfirm}
                    onChangeText={setEditConfirm}
                    secureTextEntry={!showConfirmPw}
                    autoCapitalize="none"
                    editable={!isSaving}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPw(v => !v)} style={styles.pwToggle}>
                    <MaterialCommunityIcons name={showConfirmPw ? 'eye-off' : 'eye'} size={18} color="#475569" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.modalLabel}>
                  {editField === 'nombre' ? 'NUEVO NOMBRE' : 'NUEVO APELLIDO'}
                </Text>
                <View style={styles.modalInputWrap}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={editField === 'nombre' ? 'Nuevo nombre...' : 'Nuevo apellido...'}
                    placeholderTextColor="#334155"
                    value={editValue}
                    onChangeText={setEditValue}
                    autoCapitalize="words"
                    editable={!isSaving}
                  />
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => !isSaving && setEditVisible(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, isSaving && { opacity: 0.6 }]}
                onPress={handleSaveEdit}
                disabled={isSaving}
              >
                {isSaving
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Text style={styles.modalSaveText}>GUARDAR</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ── Sub-components ───────────────────────────────────────────────

function DataRow({ icon, label, value, valueColor, noBorder }) {
  return (
    <View style={[dataStyles.row, noBorder && { borderBottomWidth: 0 }]}>
      <View style={dataStyles.iconBox}>
        <MaterialCommunityIcons name={icon} size={16} color="#64748b" />
      </View>
      <View style={dataStyles.textCol}>
        <Text style={dataStyles.label}>{label}</Text>
        <Text style={[dataStyles.value, valueColor && { color: valueColor }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({ icon, iconBg, iconColor, title, sub, onPress, noBorder }) {
  return (
    <TouchableOpacity
      style={[actionStyles.row, noBorder && { borderBottomWidth: 0 }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[actionStyles.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={actionStyles.textCol}>
        <Text style={actionStyles.title}>{title}</Text>
        <Text style={actionStyles.sub}>{sub}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color="#334155" />
    </TouchableOpacity>
  );
};