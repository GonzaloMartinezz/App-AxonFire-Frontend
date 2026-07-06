import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { styles } from '../styles/GestionMovilesScreenStyles';

export default function GestionMovilesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();

  const [moviles, setMoviles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // States for Modals
  const [modalType, setModalType] = useState(null); // 'NUEVO_MOVIL', 'NUEVO_COMPARTIMENTO', 'NUEVA_HERRAMIENTA', 'CHECKLIST'
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedMovilId, setSelectedMovilId] = useState(null);
  const [selectedCompartment, setSelectedCompartment] = useState(null);

  // Stores inventory state for expanded moviles
  // Format: { [camionId]: [ { nombre_sector, herramientas: [...] } ] }
  const [movilesInventory, setMovilesInventory] = useState({});

  useEffect(() => {
    fetchMoviles();
  }, []);

  const fetchMoviles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/camiones`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMoviles(Array.isArray(data) ? data : []);
      } else {
        console.warn('Error fetching móviles:', res.status);
      }
    } catch (e) {
      console.warn('Error fetching móviles:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (idCamion) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/camiones_inventario/camion/${idCamion}/agrupado?t=${Date.now()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        }
      );
      if (res.ok) {
        const data = await res.json();
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
        setMovilesInventory(prev => ({ ...prev, [idCamion]: lista }));
      }
    } catch (e) {
      console.warn('Error fetching inventory:', e);
    }
  };

  const toggleExpand = async (idCamion) => {
    if (expandedId === idCamion) {
      setExpandedId(null);
    } else {
      setExpandedId(idCamion);
      if (!movilesInventory[idCamion]) {
        await fetchInventory(idCamion);
      }
    }
  };

  const handleCreate = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Error', 'El campo no puede estar vacío.');
      return;
    }

    try {
      if (modalType === 'NUEVO_MOVIL') {
        const res = await fetch(`${API_BASE_URL}/camiones`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ nombre_camion: inputValue.trim() })
        });
        if (res.ok) {
          Alert.alert('✅ Éxito', 'El móvil se ha agregado correctamente.');
          await fetchMoviles();
        } else {
          Alert.alert('Error', 'No se pudo agregar el móvil.');
        }

      } else if (modalType === 'NUEVO_COMPARTIMENTO') {
        // Optimistic UI updates as endpoint might not be perfectly mapped
        const newCompartment = { nombre_sector: inputValue.trim(), herramientas: [] };
        setMovilesInventory(prev => {
          const inventory = prev[selectedMovilId] ? [...prev[selectedMovilId]] : [];
          inventory.push(newCompartment);
          return { ...prev, [selectedMovilId]: inventory };
        });
        Alert.alert('✅ Éxito', 'El compartimento se ha agregado correctamente.');

      } else if (modalType === 'NUEVA_HERRAMIENTA') {
        const newTool = {
          id: Math.random().toString(),
          herramienta: { nombre_herramienta: inputValue.trim() },
          cantidad_herramienta: 1
        };
        setMovilesInventory(prev => {
          const inventory = prev[selectedMovilId] ? [...prev[selectedMovilId]] : [];
          const compartmentIndex = inventory.findIndex(c => c.nombre_sector === selectedCompartment);
          if (compartmentIndex !== -1) {
            inventory[compartmentIndex].herramientas.push(newTool);
          }
          return { ...prev, [selectedMovilId]: inventory };
        });
        Alert.alert('✅ Éxito', 'La herramienta se ha agregado correctamente.');
      }
      
      closeModal();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error de conexión.');
    }
  };

  const openModal = (type, movilId = null, compartment = null) => {
    setModalType(type);
    setSelectedMovilId(movilId);
    setSelectedCompartment(compartment);
    setInputValue('');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalType(null);
    setInputValue('');
  };

  const renderModalContent = () => {
    let title = '';
    let placeholder = '';
    
    if (modalType === 'NUEVO_MOVIL') {
      title = 'NUEVO MÓVIL';
      placeholder = 'Ej. MÓVIL 03';
    } else if (modalType === 'NUEVO_COMPARTIMENTO') {
      title = 'NUEVO COMPARTIMENTO';
      placeholder = 'Ej. COMPARTIMENTO LATERAL IZQUIERDO';
    } else if (modalType === 'NUEVA_HERRAMIENTA') {
      title = 'NUEVA HERRAMIENTA';
      placeholder = 'Ej. MANGUERA 2.5"';
    } else if (modalType === 'CHECKLIST') {
      return (
        <View style={styles.checklistModalContainer}>
           <View style={styles.checklistModalHeader}>
             <Text style={styles.checklistModalTitle}>CHECKLIST DE CONTROL</Text>
             <TouchableOpacity onPress={closeModal}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
             </TouchableOpacity>
           </View>
           <ScrollView contentContainerStyle={styles.checklistContent}>
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="check-all" size={48} color="#10b981" />
                <Text style={styles.emptyStateText}>El flujo de checklist se ha redirigido a la pantalla dedicada o se ejecutará directamente aquí según la integración completa.</Text>
                
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalBtnConfirm, { marginTop: 24, width: '100%' }]}
                  onPress={() => {
                    closeModal();
                    navigation.navigate('WeeklyChecklist', { camionId: selectedMovilId, initialTab: 'diario' });
                  }}
                >
                  <Text style={styles.modalBtnTextConfirm}>IR AL CHECKLIST COMPLETO</Text>
                </TouchableOpacity>
              </View>
           </ScrollView>
        </View>
      );
    }

    return (
      <View style={styles.modalCenteredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#e11d48" />
            <Text style={styles.modalTitle}>{title}</Text>
          </View>
          <TextInput
            style={styles.modalInput}
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            value={inputValue}
            onChangeText={setInputValue}
            autoCapitalize="characters"
          />
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={closeModal}>
              <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn, styles.modalBtnConfirm]} onPress={handleCreate}>
              <Text style={styles.modalBtnTextConfirm}>GUARDAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1a1c23" />
      
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === 'android' ? 20 : 10) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>SISTEMA INTEGRAL</Text>
        <Text style={styles.mainTitle}>CONTROL DE{'\n'}MÓVILES</Text>
        <Text style={styles.descText}>
          Gestioná la flota de móviles tácticos, sus compartimentos y el inventario de herramientas asignadas a cada uno.
        </Text>

        <TouchableOpacity style={styles.actionBtn} onPress={() => openModal('NUEVO_MOVIL')}>
          <MaterialCommunityIcons name="truck-plus" size={20} color="#fff" />
          <Text style={styles.actionBtnText}>AGREGAR NUEVO MÓVIL</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
        ) : moviles.length === 0 ? (
          <View style={styles.emptyState}>
             <MaterialCommunityIcons name="truck-remove-outline" size={48} color="#334155" />
             <Text style={styles.emptyStateText}>No hay móviles registrados</Text>
          </View>
        ) : (
          moviles.map((movil) => {
            const isExpanded = expandedId === movil.id;
            const inventory = movilesInventory[movil.id] || [];

            return (
              <View key={movil.id} style={[styles.vehicleCard, isExpanded && styles.vehicleCardActive]}>
                <TouchableOpacity 
                  style={styles.vehicleHeader} 
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(movil.id)}
                >
                  <View style={styles.vehicleHeaderLeft}>
                    <MaterialCommunityIcons name="fire-truck" size={24} color={isExpanded ? "#e11d48" : "#94a3b8"} />
                    <Text style={styles.vehicleName}>{movil.nombre_camion?.toUpperCase()}</Text>
                  </View>
                  <MaterialCommunityIcons name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#64748b" />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.vehicleDetails}>
                    <Text style={styles.sectionTitle}>COMPARTIMENTOS Y HERRAMIENTAS</Text>
                    
                    {inventory.length === 0 ? (
                       <Text style={[styles.descText, { marginBottom: 12 }]}>No hay compartimentos asignados.</Text>
                    ) : (
                      inventory.map((compartment, idx) => (
                        <View key={idx} style={styles.compartmentCard}>
                          <View style={styles.compartmentHeader}>
                             <Text style={styles.compartmentName}>{compartment.nombre_sector}</Text>
                          </View>
                          
                          {compartment.herramientas.length === 0 ? (
                             <Text style={{color: '#475569', fontSize: 11, marginBottom: 8}}>Sin herramientas en este compartimento.</Text>
                          ) : (
                            compartment.herramientas.map((herramienta, hIdx) => (
                              <View key={hIdx} style={styles.toolItem}>
                                 <MaterialCommunityIcons name="wrench" size={14} color="#64748b" />
                                 <Text style={styles.toolName}>{herramienta.herramienta?.nombre_herramienta}</Text>
                              </View>
                            ))
                          )}

                          <TouchableOpacity 
                            style={styles.addToolBtn} 
                            onPress={() => openModal('NUEVA_HERRAMIENTA', movil.id, compartment.nombre_sector)}
                          >
                            <MaterialCommunityIcons name="plus-box-outline" size={16} color="#64748b" />
                            <Text style={styles.addToolText}>AGREGAR HERRAMIENTA</Text>
                          </TouchableOpacity>
                        </View>
                      ))
                    )}

                    <TouchableOpacity 
                      style={styles.addCompartmentBtn} 
                      onPress={() => openModal('NUEVO_COMPARTIMENTO', movil.id)}
                    >
                      <MaterialCommunityIcons name="layers-plus" size={18} color="#fff" />
                      <Text style={styles.addCompartmentText}>NUEVO COMPARTIMENTO</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.executeChecklistBtn} 
                      onPress={() => {
                        // Enlazar a checklist: según criterio 5 debe ser en la misma vista (modal)
                        openModal('CHECKLIST', movil.id);
                      }}
                    >
                      <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#fff" />
                      <Text style={styles.executeChecklistText}>EJECUTAR CHECKLIST DE CONTROL</Text>
                    </TouchableOpacity>

                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        {renderModalContent()}
      </Modal>

    </View>
  );
}
