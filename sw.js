self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'Flow Finance';
  const options = {
    body: data.body || 'Você tem uma nova notificação.',
    icon: data.icon || 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b',
    badge: 'https://api.dicebear.com/9.x/shapes/png?seed=FlowFinance&backgroundColor=0a0a0b',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});