/**
 * Axon Fire — API Helper
 * 
 * El backend usa GET /alerta/rango con req.body para recibir las fechas.
 * En dispositivos nativos (Android/iOS), axios.get con `data` funciona correctamente.
 * En web (Expo Web / navegador), los browsers NO envían body en peticiones GET,
 * por lo que la data nunca llega al servidor.
 *
 * Esta función usa `fetch` con method GET + body en nativo,
 * y en web usa POST-style fetch como workaround (el backend Express
 * parsea el body con express.json() independientemente del método).
 * 
 * Si el backend rechaza POST, fallback a GET con query params.
 */
import { Platform } from 'react-native';
import axios from 'axios';

/**
 * Fetch alertas por rango de fechas. Compatible con web y nativo.
 * @param {string} baseUrl - API_BASE_URL
 * @param {string} fecha_desde - ISO date string
 * @param {string} fecha_hasta - ISO date string  
 * @param {object} headers - Headers including Authorization
 * @param {number} timeout - Timeout in ms (default 8000)
 * @returns {Array} - Array of alertas
 */
export async function fetchAlertasPorRango(baseUrl, fecha_desde, fecha_hasta, headers = {}, timeout = 8000) {
  const body = JSON.stringify({ fecha_desde, fecha_hasta });

  if (Platform.OS === 'web') {
    // En web, los browsers no envían body con GET.
    // Usamos fetch con method POST como workaround — Express parsea el body igual.
    // Si POST falla (405), hacemos fallback a GET con query params.
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Intento 1: fetch con GET + body (algunos navegadores modernos lo permiten)
      const res = await fetch(`${baseUrl}/alerta/rango`, {
        method: 'GET',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: body,
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json();
        return data?.alertas || [];
      }

      // Intento 2: usar query params como fallback
      const queryUrl = `${baseUrl}/alerta/rango?fecha_desde=${encodeURIComponent(fecha_desde)}&fecha_hasta=${encodeURIComponent(fecha_hasta)}`;
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), timeout);

      const res2 = await fetch(queryUrl, {
        method: 'GET',
        headers,
        signal: controller2.signal,
      });

      clearTimeout(timeoutId2);

      if (res2.ok) {
        const data2 = await res2.json();
        return data2?.alertas || [];
      }

      console.log('fetchAlertasPorRango web: ambos intentos fallaron, status:', res2.status);
      return [];
    } catch (err) {
      console.log('fetchAlertasPorRango web error:', err?.message || err);
      return [];
    }
  } else {
    // En nativo (Android/iOS), axios.get con data funciona correctamente
    try {
      const res = await axios.get(`${baseUrl}/alerta/rango`, {
        headers,
        data: { fecha_desde, fecha_hasta },
        timeout,
      });
      return res.data?.alertas || [];
    } catch (err) {
      console.log('fetchAlertasPorRango native error:', err?.message || err);
      return [];
    }
  }
}
