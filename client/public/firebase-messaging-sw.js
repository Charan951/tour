importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAqqnCK4mdFOUCy3WGohHuzR6cSo0XmJXM",
  authDomain: "tour-1a8a9.firebaseapp.com",
  projectId: "tour-1a8a9",
  storageBucket: "tour-1a8a9.firebasestorage.app",
  messagingSenderId: "1022570633231",
  appId: "1:1022570633231:web:a2a6b05e18cd4d30a02b7a"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || 'HolidayCity Notification';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo.png',
    data: payload.data,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
