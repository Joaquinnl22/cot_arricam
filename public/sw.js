self.addEventListener('install', () => {
    console.log('[Service Worker] Instalado');
    self.skipWaiting();
  });
  
  self.addEventListener('activate', () => {
    console.log('[Service Worker] Activado');
  });
  
  self.addEventListener('push', function (event) {
    const data = event.data.json();
    console.log('[Service Worker] Push recibido:', data);
  
    const title = data.title || 'Nueva actualización';
    const options = {
      body: data.body || 'Tienes un nuevo cambio en la app.',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    };
  
    event.waitUntil(self.registration.showNotification(title, options));
  });
  self.addEventListener('fetch', function(event) {
    // No es necesario hacer nada, pero este listener debe existir
  });
  