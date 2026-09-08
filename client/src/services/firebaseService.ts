import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import axios from 'axios';

const firebaseConfig = {
  apiKey: "AIzaSyAqqnCK4mdFOUCy3WGohHuzR6cSo0XmJXM",
  authDomain: "tour-1a8a9.firebaseapp.com",
  projectId: "tour-1a8a9",
  storageBucket: "tour-1a8a9.firebasestorage.app",
  messagingSenderId: "1022570633231",
  appId: "1:1022570633231:web:a2a6b05e18cd4d30a02b7a"
};

const app = initializeApp(firebaseConfig);
let messaging: any = null;

export const initWebPushNotifications = async () => {
  try {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('⚠️ Web notifications are not supported in this browser environment.');
      return;
    }

    messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('🔔 Web Notification permission granted.');
      const currentToken = await getToken(messaging, {
        vapidKey: 'BDb0-place-holder-vapid-key' // Optional VAPID key if web push certificate configured
      }).catch((err) => {
        console.warn('⚠️ Could not obtain Web FCM token:', err);
        return null;
      });

      if (currentToken) {
        console.log('🔑 Web FCM Token:', currentToken);
        await saveFcmTokenToBackend(currentToken);
      }

      onMessage(messaging, (payload) => {
        console.log('📲 Web Foreground Push Notification received:', payload);
        if (payload.notification) {
          new Notification(payload.notification.title || 'HolidayCity Notification', {
            body: payload.notification.body,
            icon: '/logo.png',
          });
        }
      });
    }
  } catch (error) {
    console.warn('⚠️ Web push initialization error:', error);
  }
};

export const saveFcmTokenToBackend = async (token: string) => {
  try {
    const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';
    const authToken = localStorage.getItem('hc_token') || localStorage.getItem('hc_access_token') || sessionStorage.getItem('hc_access_token') || sessionStorage.getItem('hc_token');
    await axios.post(
      `${apiBase}/users/fcm-token`,
      { token },
      {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      }
    );
    console.log('✅ Web FCM token synced to backend');
  } catch (err) {
    console.warn('⚠️ Failed to save Web FCM token:', err);
  }
};
