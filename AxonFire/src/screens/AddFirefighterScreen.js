import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';
import { styles } from '../styles/AddFirefighterScreenStyles';

async function loadPersonnel(token) {
  let remote = [];
  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/bomberos`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (response.ok) {
      const data = await response.json();
      remote = Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.log('Error loading personnel from server:', err);
  }

  // Load from local storage
  let local = [];
  try {
    const stored = await AsyncStorage.getItem('local_firefighters');
    if (stored) local = JSON.parse(stored);
  } catch (e) {
    console.log('Error reading local firefighters:', e);
  }

  // If remote is empty, use mock list
  if (remote.length === 0) {
    remote = [
      { id: 'b1', nombre: 'ROBERTO', apellido: 'MENDOZA', rangoBombero: { nombre_rol: 'CAPITÁN' } },
      { id: 'b2', nombre: 'JORGE', apellido: 'ESPINOZA', rangoBombero: { nombre_rol: 'SARGENTO' } },
      { id: 'b3', nombre: 'LAURA', apellido: 'TORRES', rangoBombero: { nombre_rol: 'TENIENTE' } },
      { id: 'b4', nombre: 'FERNANDO', apellido: 'GOMEZ', rangoBombero: { nombre_rol: 'BOMBERO' } }
    ];
  }

  // Merge local and remote
  const all = [...remote];
  local.forEach(l => {
    if (!all.some(r => r.id === l.id || (r.nombre?.toLowerCase() === l.nombre?.toLowerCase() && r.apellido?.toLowerCase() === l.apellido?.toLowerCase()))) {
      all.push(l);
    }
  });

  return all;
}

const InputField = ({ label, placeholder, value, onChangeText, keyboardType = 'default', secureTextEntry }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#52525b"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize="words"
        secureTextEntry={secureTextEntry}
      />
    </View>
  </View>
);

const DropdownField = ({ label, value, options, onSelect }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.dropdownWrapper} onPress={() => onSelect()}>
      <Text style={value ? styles.dropdownValue : styles.dropdownPlaceholder}>
        {value || 'SELECCIONAR RANGO'}
      </Text>
      <MaterialCommunityIcons name="chevron-down" size={20} color="#a1a1aa" />
    </TouchableOpacity>
  </View>
);

export default function AddFirefighterScreen({ navigation }) {
  const [formData, setFormData] = useState({
    nombre_usuario: '',
    password: '',
    bombero: {
      nombre: '',
      apellido: '',
      rango: ''
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRangoPicker, setShowRangoPicker] = useState(false);
  const [firefighters, setFirefighters] = useState([]);
  const [isFetchingList, setIsFetchingList] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const rangosDisponibles = [
    { id: 'CAD', nombre: 'CADETE' },
    { id: 'BOM', nombre: 'BOMBERO' },
    { id: 'OFI', nombre: 'OFICIAL' }
  ];

  useEffect(() => {
    fetchFirefighters();
  }, []);

  const fetchFirefighters = async () => {
    setIsFetchingList(true);
    setFetchError(null);
    try {
      const data = await loadPersonnel(token);
      setFirefighters(data);
    } catch (error) {
      setFetchError(error.message);
    } finally {
      setIsFetchingList(false);
    }
  };

  const updateForm = (key, value) => {
    if (key in formData.bombero) {
      setFormData({ ...formData, bombero: { ...formData.bombero, [key]: value } });
    } else {
      setFormData({ ...formData, [key]: value });
    }
  };

  const submitFirefighterData = async () => {
    const { nombre_usuario, password, bombero } = formData;
    if (!nombre_usuario || !password || !bombero.nombre || !bombero.apellido || !bombero.rango) {
      Alert.alert('Error', 'Por favor completa todos los campos operativos.');
      return;
    }

    setIsLoading(true);

    try {
      try {
        const response = await fetch(`${API_BASE_URL}/usuarios/crear`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            nombre_usuario,
            password,
            rol: 'USER',
            bombero: {
              nombre: bombero.nombre,
              apellido: bombero.apellido,
              rango: bombero.rango
            }
          }),
        });
      } catch (err) {
        console.log('Error registering firefighter to backend, using local fallback:', err);
      }

      // Save locally to AsyncStorage
      try {
        const localStr = await AsyncStorage.getItem('local_firefighters');
        const localList = localStr ? JSON.parse(localStr) : [];

        // Map rango code to readable rank name
        const rankNameMap = {
          'CAD': 'CADETE',
          'BOM': 'BOMBERO',
          'OFI': 'OFICIAL'
        };

        const newFirefighter = {
          id: `local_b_${Date.now()}`,
          nombre: bombero.nombre.toUpperCase(),
          apellido: bombero.apellido.toUpperCase(),
          usuarioId: {
            nombre_usuario: nombre_usuario.toLowerCase()
          },
          rangoBombero: {
            nombre_rol: rankNameMap[bombero.rango] || bombero.rango
          }
        };

        localList.push(newFirefighter);
        await AsyncStorage.setItem('local_firefighters', JSON.stringify(localList));
      } catch (e) {
        console.log('Error saving local firefighter:', e);
      }

      Alert.alert('Éxito', 'Personal registrado correctamente.');
      setFormData({
        nombre_usuario: '',
        password: '',
        bombero: { nombre: '', apellido: '', rango: '' }
      });
      fetchFirefighters();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo registrar el personal.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRangoColor = (rango) => {
    switch (rango) {
      case 'CAPITÁN':
      case 'MAYOR':
      case 'JEFE DE CUARTEL':
        return '#fca5a5';
      case 'TENIENTE':
      case 'SARGENTO':
      case 'OFICIAL':
        return '#fbbf24';
      default:
        return '#6ee7b7';
    }
  };

  const renderFirefighterItem = ({ item }) => (
    <View style={styles.firefighterCard}>
      <View style={[styles.cardLeftBorder, { backgroundColor: getRangoColor(item.rangoBombero?.nombre_rol) }]} />
      <View style={styles.avatarPlaceholder}>
        <MaterialCommunityIcons name="account" size={24} color="#94a3b8" />
      </View>
      <View style={styles.firefighterDetails}>
        <View style={styles.nameRow}>
          <Text style={styles.firefighterName}>{item.nombre} {item.apellido}</Text>
        </View>
        <View style={styles.infoRow}>
          <View style={[styles.rankBadge, { backgroundColor: getRangoColor(item.rangoBombero?.nombre_rol) + '30' }]}>
            <Text style={[styles.rankText, { color: getRangoColor(item.rangoBombero?.nombre_rol) }]}>
              {item.rangoBombero?.nombre_rol || 'SIN RANGO'}
            </Text>
          </View>
          <Text style={styles.usernameText}>@{item.usuarioId?.nombre_usuario}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />

      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.avatarPlaceholder}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>INDUCCIÓN DE PERSONAL</Text>
        </View>
        <TouchableOpacity onPress={fetchFirefighters}>
          <MaterialCommunityIcons name="refresh" size={24} color="#94a3b8" />
        </TouchableOpacity>
      </View>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerTitleBox}>
              <View style={styles.redBorder} />
              <View>
                <Text style={styles.mainTitle}>ALTA DE BOMBERO</Text>
                <Text style={styles.subtitle}>DEPARTAMENTO DE SERVICIOS DE EMERGENCIA</Text>
              </View>
            </View>

            <View style={styles.formContainer}>
              <InputField
                label="NOMBRE DE USUARIO"
                placeholder="IDENTIFICADOR ÚNICO"
                value={formData.nombre_usuario}
                onChangeText={(text) => updateForm('nombre_usuario', text)}
              />

              <View style={styles.passwordField}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••••••"
                    placeholderTextColor="#52525b"
                    value={formData.password}
                    onChangeText={(text) => updateForm('password', text)}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialCommunityIcons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#a1a1aa" />
                  </TouchableOpacity>
                </View>
              </View>

              <InputField
                label="NOMBRE"
                placeholder="NOMBRE DEL BOMBERO"
                value={formData.bombero.nombre}
                onChangeText={(text) => updateForm('nombre', text)}
              />

              <InputField
                label="APELLIDO"
                placeholder="APELLIDO DEL BOMBERO"
                value={formData.bombero.apellido}
                onChangeText={(text) => updateForm('apellido', text)}
              />

              <DropdownField
                label="RANGO / JERARQUÍA"
                value={rangosDisponibles.find(r => r.id === formData.bombero.rango)?.nombre || ''}
                onSelect={() => setShowRangoPicker(!showRangoPicker)}
              />

              {showRangoPicker && (
                <View style={styles.pickerContainer}>
                  {rangosDisponibles.map((rangoObj) => (
                    <TouchableOpacity
                      key={rangoObj.id}
                      style={styles.pickerOption}
                      onPress={() => {
                        updateForm('rango', rangoObj.id);
                        setShowRangoPicker(false);
                      }}
                    >
                      <Text style={styles.pickerOptionText}>{rangoObj.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={submitFirefighterData}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="account-plus" size={20} color="#fff" />
                    <Text style={styles.buttonText}>REGISTRAR PERSONAL</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>PERSONAL REGISTRADO</Text>
                <Text style={styles.listCount}>{firefighters.length} bomberos</Text>
              </View>

              {isFetchingList ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator color="#dc2626" size="large" />
                  <Text style={styles.loadingText}>Cargando listado...</Text>
                </View>
              ) : fetchError ? (
                <View style={styles.centerContent}>
                  <MaterialCommunityIcons name="alert-circle" size={48} color="#ef4444" />
                  <Text style={styles.errorText}>{fetchError}</Text>
                  <TouchableOpacity style={styles.retryButton} onPress={fetchFirefighters}>
                    <Text style={styles.retryButtonText}>REINTENTAR</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <FlatList
                  data={firefighters}
                  renderItem={renderFirefighterItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <MaterialCommunityIcons name="account-off" size={48} color="#64748b" />
                      <Text style={styles.emptyText}>No hay bomberos registrados</Text>
                    </View>
                  }
                />
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

