import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { token, user } = useAuth();

  const loadNotifications = useCallback(async () => {
    // Si no hay usuario o token, o no es ADMIN, no cargamos notificaciones
    // o bien si queremos que todos las vean, lo dejamos.
    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/notificaciones`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 3000,
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.notificaciones || []);

      setNotifications((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(data)) {
          return data;
        }
        return prev;
      });
    } catch (error) {

      if (error?.response?.status !== 404) {
        console.log('Error polling notificaciones:', error?.message);
      }
    } finally {
      setLoaded(true);
    }
  }, [token]);

  useEffect(() => {
    // Carga inicial
    loadNotifications();

    const intervalId = setInterval(() => {
      loadNotifications();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [loadNotifications]);

  /**
   * Agrega una nueva notificación de forma local temporalmente.
   * Nota: En producción, el backend debe generarlas automáticamente
   * al guardar un checklist, por lo que este método se usa como fallback.
   */
  const addNotification = useCallback(async (notification) => {
    if (!token) return;
    try {
      // Intento de guardar en el backend si el endpoint existe
      await axios.post(`${API_BASE_URL}/notificaciones`, notification, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.log('Error al enviar notificación al backend:', err?.message);
    }
  }, [token, loadNotifications]);

  /**
   * Marca una notificación como leída.
   */
  const markAsRead = useCallback(async (id) => {
    if (!token) return;

    // Actualización optimista local
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, leida: true } : n)));

    try {
      await axios.patch(`${API_BASE_URL}/notificaciones/${id}/leer`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.log('Error marcando notificación como leída:', err?.message);
    }
  }, [token, loadNotifications]);

  /**
   * Marca todas las notificaciones como leídas.
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    // Actualización optimista local
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })));

    try {
      await axios.post(`${API_BASE_URL}/notificaciones/leer-todas`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.log('Error marcando todas como leídas:', err?.message);
    }
  }, [token, loadNotifications]);

  /**
   * Elimina todas las notificaciones.
   */
  const clearAll = useCallback(async () => {
    if (!token) return;

    // Actualización optimista
    setNotifications([]);

    try {
      await axios.delete(`${API_BASE_URL}/notificaciones`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      loadNotifications();
    } catch (err) {
      console.log('Error limpiando notificaciones:', err?.message);
    }
  }, [token, loadNotifications]);

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

