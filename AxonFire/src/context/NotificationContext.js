import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationContext = createContext(null);

const STORAGE_KEY = 'axonfire_admin_notifications';
const MAX_NOTIFICATIONS = 50;

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider — RF-03
 * 
 * Gestiona notificaciones internas para el panel de administrador.
 * Cuando un bombero completa un control de inventario (diario o post-emergencia),
 * se agrega una notificación que el admin puede ver en su campana.
 * 
 * Tipos de notificación:
 * - CONTROL_DIARIO: Checklist diario de un móvil
 * - CONTROL_BOLSO: Checklist post-emergencia de un bolso
 * - CONTROL_CUARTEL: Inventario de base/cuartel
 * 
 * Estructura de cada notificación:
 * {
 *   id: string,
 *   tipo: 'CONTROL_DIARIO' | 'CONTROL_BOLSO' | 'CONTROL_CUARTEL',
 *   bomberoNombre: string,
 *   fechaHora: string (ISO),
 *   recursoNombre: string (nombre del camión, bolso, etc.),
 *   tieneFaltantes: boolean,
 *   cantidadFaltantes: number,
 *   leida: boolean,
 * }
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Guardar notificaciones explícitamente y notificar a otras pestañas
  const saveNotifications = async (newNotifications) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
      // Despachar evento para sincronización local si es necesario (misma pestaña u otras si se usa BroadcastChannel en el futuro)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new Event('axonfire_local_storage_sync'));
      }
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const parsedArray = Array.isArray(parsed) ? parsed : [];
          
          setNotifications((prev) => {
            if (JSON.stringify(prev) !== JSON.stringify(parsedArray)) {
              return parsedArray;
            }
            return prev;
          });
        }
      } catch (error) {
        console.error('Error loading notifications from storage:', error);
      } finally {
        setLoaded((prev) => (prev ? prev : true));
      }
    };
    
    // Carga inicial
    loadNotifications();

    // RF-03: Polling muy corto para asegurar la actualización rápida (fallback por si falla el evento storage)
    const intervalId = setInterval(() => {
      loadNotifications();
    }, 1500);

    // Event listener nativo de Web para localStorage (instantáneo entre pestañas)
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY || e.type === 'axonfire_local_storage_sync') {
        loadNotifications();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('axonfire_local_storage_sync', handleStorageChange);
    }

    return () => {
      clearInterval(intervalId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('axonfire_local_storage_sync', handleStorageChange);
      }
    };
  }, []);

  /**
   * Agrega una nueva notificación al inicio de la lista.
   * @param {Object} notification — datos de la notificación (sin id ni leida)
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      leida: false,
      fechaHora: new Date().toISOString(),
      ...notification,
    };
    setNotifications((prev) => {
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  /**
   * Marca una notificación como leída.
   */
  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, leida: true } : n));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  /**
   * Marca todas las notificaciones como leídas.
   */
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, leida: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  /**
   * Elimina todas las notificaciones.
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  /**
   * Retorna la cantidad de notificaciones no leídas.
   */
  const getUnreadCount = useCallback(() => {
    return notifications.filter((n) => !n.leida).length;
  }, [notifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        getUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
