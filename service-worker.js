// Service Worker pour Couronne de Vie
const CACHE_NAME = 'couronne-de-vie-v2'; // Version incrémentée pour forcer la mise à jour
// Ne PAS mettre en cache les fichiers JavaScript pour éviter les problèmes d'événements
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  // '/app.js', // NE PAS CACHER - doit toujours être chargé depuis le réseau
  // '/compatibility.js', // NE PAS CACHER
  // '/ai-assistant.js', // NE PAS CACHER
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Mise en cache des fichiers');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  // Forcer l'activation immédiate
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

