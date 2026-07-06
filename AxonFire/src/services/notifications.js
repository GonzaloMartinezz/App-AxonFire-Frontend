import * as Notifications from 'expo-notifications';

export async function sendEmergencyAlert() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "ALERTA DE EMERGENCIA",
      body: "Incendio estructural - Av. Corrientes 1234",
      sound: 'siren.mp3',
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: null,
    channelId: 'emergency',
  });
}

/*
import { sendEmergencyAlert } from '../services/notifications';

const handleEmergency = () => {
  sendEmergencyAlert();
};
*/

export async function sendSupplyRequestAlert(message) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "PEDIDO DE SUMINISTRO",
      body: message || "Se ha recibido un nuevo pedido de suministro.",
      priority: Notifications.AndroidNotificationPriority.DEFAULT,
    },
    trigger: null,
  });
}