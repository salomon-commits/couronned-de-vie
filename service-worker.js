const CACHE_NAME = 'couronne-de-vie-v4';
const urlsToCache = [
  './',
  './index.html',
  './styles.css'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers');
        const cachePromises = urlsToCache.map(url => {
          return fetch(new Request(url, { cache: 'reload' }))
            .then((response) => {
              if (response && response.status === 200) {
                return cache.put(url, response);
              }
            })
            .catch((error) => {
              console.warn(`[Service Worker] Impossible de mettre en cache ${url}:`, error);
            });
        });
        return Promise.allSettled(cachePromises);
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prendre le contrôle immédiatement
  return self.clients.claim();
});

// Stratégie: Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const requestUrl = request.url;

  // Ignorer les requêtes vers Supabase (toujours en ligne, jamais en cache)
  // Forcer le rechargement à chaque fois pour avoir les données à jour
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          ...request.headers,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    );
    return;
  }

  // Pour les fichiers JavaScript, TOUJOURS charger depuis le réseau (jamais en cache)
  if (requestUrl.endsWith('.js') || requestUrl.includes('/app.js') || requestUrl.includes('/compatibility.js') || requestUrl.includes('/ai-assistant.js')) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }).catch(() => {
        // En cas d'échec réseau, ne pas utiliser le cache
        return new Response('JavaScript non disponible', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
    );
    return;
  }

  // Pour les fichiers HTML, toujours essayer le réseau d'abord (pour les mises à jour)
  if (request.method === 'GET' && (requestUrl.endsWith('.html') || requestUrl.endsWith('/') || !requestUrl.includes('.'))) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Pour les autres ressources (CSS, JS, images), utiliser Network First
  event.respondWith(
    fetch(request, { cache: 'reload' })
      .then((response) => {
        // Vérifier si la réponse est valide
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cloner la réponse pour la mettre en cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // En cas d'échec, utiliser le cache
        return caches.match(request)
          .then((response) => {
            if (response) {
              return response;
            }
            // Si pas de cache, retourner une réponse par défaut
            return new Response('Ressource non disponible hors ligne', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
  );
});

// Gestion des messages depuis l'application
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Forcer la mise à jour du cache
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
    );
  }
});

// ============================================
// GESTION DES NOTIFICATIONS PUSH FCM
// ============================================

// Écouter les notifications push en arrière-plan (quand l'app est fermée)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notification push reçue:', event);
  
  let notificationData = {
    title: 'Couronne de Vie',
    body: 'Vous avez une nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'default',
    data: {}
  };

  // Si les données sont disponibles dans l'événement
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Service Worker] Payload reçu:', payload);
      
      notificationData = {
        title: payload.notification?.title || payload.data?.title || 'Couronne de Vie',
        body: payload.notification?.body || payload.data?.body || 'Vous avez une nouvelle notification',
        icon: payload.notification?.icon || payload.data?.icon || '/icon-192.png',
        badge: payload.notification?.badge || payload.data?.badge || '/icon-192.png',
        tag: payload.data?.tag || payload.notification?.tag || 'default',
        data: payload.data || {},
        requireInteraction: payload.notification?.requireInteraction || false,
        actions: payload.notification?.actions || []
      };
    } catch (error) {
      console.error('[Service Worker] Erreur lors du parsing des données:', error);
      // Utiliser les données textuelles si le JSON échoue
      const text = event.data.text();
      if (text) {
        notificationData.body = text;
      }
    }
  }

  // Afficher la notification
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: notificationData.requireInteraction,
      actions: notificationData.actions,
      vibrate: [200, 100, 200],
      timestamp: Date.now()
    })
  );
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification cliquée:', event);
  
  event.notification.close();

  // Ouvrir ou focaliser l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre est déjà ouverte, la focaliser
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Gérer la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification fermée:', event);
});

