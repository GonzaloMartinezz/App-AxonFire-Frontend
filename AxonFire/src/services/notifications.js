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