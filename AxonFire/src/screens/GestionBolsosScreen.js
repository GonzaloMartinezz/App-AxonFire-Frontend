import React, { useState, useEffect } from "react";
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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { styles } from "../styles/GestionBolsosScreenStyles";

export default function GestionBolsosScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { token, logout } = useAuth();
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

  const [bolsos, setBolsos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const [modalType, setModalType] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [quantityValue, setQuantityValue] = useState("1");
  const [selectedBolsoId, setSelectedBolsoId] = useState(null);

  const [bolsosInventory, setBolsosInventory] = useState({});

  useEffect(() => {
    fetchBolsos();
  }, []);

  const fetchBolsos = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/bolsos`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setBolsos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Error fetching bolsos:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async (idBolso) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/bolsos_inventario/bolso/${idBolso}?t=${Date.now()}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );
      if (res.ok) {
        const data = await res.json();
        setBolsosInventory((prev) => ({
          ...prev,
          [idBolso]: Array.isArray(data) ? data : [],
        }));
      }
    } catch (e) {
      console.warn("Error fetching inventory:", e);
    }
  };

  const toggleExpand = async (idBolso) => {
    if (expandedId === idBolso) {
      setExpandedId(null);
    } else {
      setExpandedId(idBolso);
      if (!bolsosInventory[idBolso]) {
        await fetchInventory(idBolso);
      }
    }
  };

  const handleCreate = async () => {
    try {
      if (modalType === "NUEVO_BOLSO") {
        const res = await fetch(`${API_BASE_URL}/bolsos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            nombre_bolso: inputValue.trim(),
            estado: "ACTIVO",
          }),
        });
        if (res.ok) {
          Alert.alert("✅ Éxito", "El bolso se ha agregado correctamente.");
          await fetchBolsos();
        } else {
          Alert.alert("Error", "No se pudo agregar el bolso.");
        }
      } else if (modalType === "NUEVA_HERRAMIENTA") {
        if (!inputValue.trim()) {
          Alert.alert("Error", "Ingresa el nombre de la herramienta.");
          return;
        }
        const newTool = {
          id: `temp-${Date.now()}`,
          herramienta: { nombre_herramienta: inputValue.trim() },
          cantidad_herramienta: parseInt(quantityValue, 10) || 1,
        };
        setBolsosInventory((prev) => ({
          ...prev,
          [selectedBolsoId]: [...(prev[selectedBolsoId] || []), newTool],
        }));
        Alert.alert(
          "✅ Éxito",
          "El material se ha agregado temporalmente al bolso.",
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo procesar la solicitud.");
    }

    setModalVisible(false);
    setInputValue("");
  };

  const removeTool = (bolsoId, toolId) => {
    setBolsosInventory((prev) => {
      const inventory = prev[bolsoId] || [];
      return {
        ...prev,
        [bolsoId]: inventory.filter((item) => item.id !== toolId),
      };
    });
  };

  const openModal = (type, bolsoId = null) => {
    setModalType(type);
    setSelectedBolsoId(bolsoId);
    setInputValue("");
    setQuantityValue("1");
    if (type === "CHECKLIST") {
      navigation.navigate("ChecklistBolsos", {
        bolsoId,
        inventarioLocal: bolsosInventory[bolsoId],
      });
    } else {
      setModalVisible(true);
    }
  };

  const renderModalContent = () => {
    let title = "";
    let placeholder = "";

    if (modalType === "NUEVO_BOLSO") {
      title = "NUEVO BOLSO / KIT";
      placeholder = "Ej. BOLSO TRAUMA A";
    } else if (modalType === "NUEVA_HERRAMIENTA") {
      title = "AGREGAR HERRAMIENTA";
      placeholder = "Ej. TIJERA DE TRAUMA";
    }

    return (
      <View style={styles.modalView}>
        <View style={styles.modalHeader}>
          <MaterialCommunityIcons
            name={modalType === "NUEVA_HERRAMIENTA" ? "wrench" : "bag-personal"}
            size={24}
            color="#e11d48"
          />
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
        {modalType === "NUEVA_HERRAMIENTA" && (
          <TextInput
            style={styles.modalInput}
            placeholder="Cantidad (Ej: 1)"
            placeholderTextColor="#64748b"
            value={quantityValue}
            onChangeText={setQuantityValue}
            keyboardType="numeric"
          />
        )}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalBtnCancel]}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.modalBtnTextCancel}>CANCELAR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalBtn, styles.modalBtnConfirm]}
            onPress={handleCreate}
          >
            <Text style={styles.modalBtnTextConfirm}>GUARDAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#16181d" />

      <View
        style={[
          styles.topBar,
          { paddingTop: insets.top + (Platform.OS === "android" ? 20 : 10) },
        ]}
      >
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.goBack()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="#94a3b8"
            />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>AXON FIRE</Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#e11d48" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>LOGÍSTICA</Text>
        <Text style={styles.mainTitle}>CONTROL DE{"\n"}BOLSOS</Text>
        <Text style={styles.descText}>
          Gestioná los bolsos y kits tácticos post-emergencia y sus herramientas
          asignadas.
        </Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openModal("NUEVO_BOLSO")}
        >
          <MaterialCommunityIcons
            name="bag-personal-plus"
            size={20}
            color="#fff"
          />
          <Text style={styles.actionBtnText}>CREAR BOLSO NUEVO</Text>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={styles.sectionTitle}>BOLSOS ACTIVOS</Text>
        </View>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <ActivityIndicator size="large" color="#dc2626" />
            <Text
              style={{
                color: "#94a3b8",
                marginTop: 12,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Cargando bolsos...
            </Text>
          </View>
        ) : bolsos.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <MaterialCommunityIcons
              name="bag-remove-outline"
              size={48}
              color="#334155"
            />
            <Text
              style={{
                color: "#94a3b8",
                marginTop: 12,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              No hay bolsos registrados.
            </Text>
          </View>
        ) : (
          bolsos.map((bolso) => {
            const isExpanded = expandedId === bolso.id;
            const inventory = bolsosInventory[bolso.id];

            return (
              <View key={bolso.id} style={styles.vehicleCard}>
                <TouchableOpacity
                  style={styles.vehicleHeaderRow}
                  activeOpacity={0.8}
                  onPress={() => toggleExpand(bolso.id)}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <View style={styles.vehicleIconBg}>
                      <MaterialCommunityIcons
                        name="bag-personal"
                        size={24}
                        color="#e11d48"
                      />
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View>
                        <Text style={styles.vehicleName}>
                          {bolso.nombre_bolso?.toUpperCase()}
                        </Text>
                        <Text style={styles.vehicleType}>
                          KITS POST-EMERGENCIA
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#94a3b8"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.vehicleExpandedContent}>
                    <Text style={styles.sectionTitle}>
                      MATERIALES Y HERRAMIENTAS
                    </Text>

                    {!inventory ? (
                      <ActivityIndicator
                        size="small"
                        color="#e11d48"
                        style={{ marginVertical: 12 }}
                      />
                    ) : inventory.length === 0 ? (
                      <Text style={[styles.descText, { marginBottom: 12 }]}>
                        No hay materiales asignados a este bolso.
                      </Text>
                    ) : (
                      <View style={styles.compartmentCard}>
                        {inventory.map((item, idx) => (
                          <View key={item.id || idx} style={styles.toolItem}>
                            <MaterialCommunityIcons
                              name="check-circle-outline"
                              size={14}
                              color="#10b981"
                            />
                            <Text style={styles.toolName}>
                              {item.herramienta?.nombre_herramienta?.toUpperCase() ||
                                item.herramienta?.toUpperCase() ||
                                "HERRAMIENTA"}
                            </Text>
                            <Text
                              style={{
                                color: "#94a3b8",
                                fontSize: 12,
                                fontWeight: "700",
                                marginRight: 8,
                              }}
                            >
                              {item.cantidad_herramienta || item.cantidad || 1}{" "}
                              uds
                            </Text>
                            <TouchableOpacity
                              onPress={() => removeTool(bolso.id, item.id)}
                              style={{ padding: 4 }}
                            >
                              <MaterialCommunityIcons
                                name="close-circle-outline"
                                size={18}
                                color="#ef4444"
                              />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.addToolBtn}
                      onPress={() => openModal("NUEVA_HERRAMIENTA", bolso.id)}
                    >
                      <MaterialCommunityIcons
                        name="plus-box-multiple"
                        size={16}
                        color="#64748b"
                      />
                      <Text style={styles.addToolText}>AGREGAR MATERIAL</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.executeChecklistBtn}
                      onPress={() => openModal("CHECKLIST", bolso.id)}
                    >
                      <MaterialCommunityIcons
                        name="clipboard-check-outline"
                        size={20}
                        color="#fff"
                      />
                      <Text style={styles.executeChecklistText}>
                        EJECUTAR CHECKLIST DE CONTROL
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalCenteredView}>{renderModalContent()}</View>
      </Modal>
    </View>
  );
}
