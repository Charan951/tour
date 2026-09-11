import { initializeApp, cert, App } from 'firebase-admin/app';
import { getMessaging, Message, MulticastMessage } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

let firebaseApp: App | null = null;

export const initFirebase = (): App | null => {
  if (firebaseApp) return firebaseApp;

  try {
    const relativeOrAbsolutePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './src/config/firebase-service-account.json';
    const serviceAccountPath = path.isAbsolute(relativeOrAbsolutePath)
      ? relativeOrAbsolutePath
      : path.join(process.cwd(), relativeOrAbsolutePath);

    if (fs.existsSync(serviceAccountPath)) {
      const rawText = fs.readFileSync(serviceAccountPath, 'utf8').trim();
      let serviceAccount: any;
      try {
        serviceAccount = JSON.parse(rawText);
      } catch (jsonErr) {
        const sanitized = rawText.replace(/[\u0000-\u001F]+/g, (match) => (match === '\n' || match === '\r' ? '\\n' : ''));
        // Also neutralise invalid backslash escapes (e.g. a stray "\x" inside
        // the key body), which the control-char pass above does not touch.
        const escFixed = sanitized.replace(/\\(?!["\\/bfnrtu])/g, '\\n');
        serviceAccount = JSON.parse(escFixed);
        console.warn('⚠️ Firebase service account JSON had invalid escape sequences and was auto-repaired; re-download it from the Firebase console if push notifications misbehave.');
      }
      if (serviceAccount && typeof serviceAccount.private_key === 'string') {
        const rawKey = serviceAccount.private_key.replace(/\\n/g, '\n');
        const lines = rawKey.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        const bodyLines = lines.filter((l: string) => !l.includes('-----BEGIN') && !l.includes('-----END'));
        serviceAccount.private_key = `-----BEGIN PRIVATE KEY-----\n${bodyLines.join('\n')}\n-----END PRIVATE KEY-----\n`;
      }
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized successfully');
      return firebaseApp;
    } else {
      console.warn(`⚠️ Firebase service account file not found at: ${serviceAccountPath}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
    return null;
  }
};

export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!firebaseApp) {
    initFirebase();
  }
  if (!firebaseApp) {
    console.warn('⚠️ Cannot send push notification: Firebase Admin is not initialized.');
    return null;
  }

  try {
    // Android: DATA-ONLY. The Flutter client renders every notification through
    // flutter_local_notifications (foreground + background isolate), which is
    // the only way to get reliable lock-screen delivery when the app is killed
    // on aggressive-OEM Android. iOS keeps an `aps.alert` so the OS shows it.
    const message: Message = {
      token,
      notification: {
        title,
        body,
      },
      data: { ...data, title, body },
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          channelId: 'high_importance_channel',
          priority: 'high',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
    };

    const response = await getMessaging(firebaseApp).send(message);
    console.log('📲 Push notification sent successfully to single token:', response);
    return response;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    return null;
  }
};

export const sendMulticastPushNotification = async (
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string> = {}
) => {
  if (!tokens || tokens.length === 0) return null;
  if (!firebaseApp) {
    initFirebase();
  }
  if (!firebaseApp) {
    console.warn('⚠️ Cannot send push notification: Firebase Admin is not initialized.');
    return null;
  }

  try {
    const message: MulticastMessage = {
      tokens,
      notification: {
        title,
        body,
      },
      data: { ...data, title, body },
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          channelId: 'high_importance_channel',
          priority: 'high',
          sound: 'default',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        headers: { 'apns-priority': '10' },
        payload: {
          aps: {
            alert: { title, body },
            sound: 'default',
            badge: 1,
            'content-available': 1,
          },
        },
      },
    };

    const response = await getMessaging(firebaseApp).sendEachForMulticast(message);
    console.log(`📲 Multicast push notification sent: ${response.successCount} succeeded, ${response.failureCount} failed out of ${tokens.length}`);
    return response;
  } catch (error) {
    console.error('❌ Error sending multicast push notification:', error);
    return null;
  }
};

export default { initFirebase, sendPushNotification, sendMulticastPushNotification };
