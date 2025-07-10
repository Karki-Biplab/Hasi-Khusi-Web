// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCkZ2d4tuh7OtPcHUmkPqNbEv_52Kblh90",
  authDomain: "workshop-management-sys.firebaseapp.com",
  projectId: "workshop-management-sys",
  storageBucket: "workshop-management-sys.firebasestorage.app",
  messagingSenderId: "643643416124",
  appId: "1:643643416124:web:6b7e62f544402456a0ad39"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const { title, body, icon } = payload.notification || {};
  const notificationTitle = title || 'Workshop Manager';
  const notificationOptions = {
    body: body || 'You have a new notification',
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'workshop-notification',
    requireInteraction: true,
    data: payload.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app and navigate to relevant page
    const urlToOpen = new URL('/', self.location.origin).href;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    console.log('Notification dismissed');
  } else {
    // Default action (clicking notification body)
    const urlToOpen = new URL('/', self.location.origin).href;
    
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
});