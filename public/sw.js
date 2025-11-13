// Service Worker para PWA
const CACHE_NAME = 'rentacar-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/auth',
  '/manifest.json',
  '/logo.png'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('Erro ao cachear recursos:', error);
      })
  );
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  // Ignorar requisições não-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorar requisições não-HTTP(S) (chrome-extension:, file:, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Ignorar requisições para APIs externas
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retornar do cache se disponível
        if (response) {
          return response;
        }

        // Buscar da rede
        return fetch(event.request).then((response) => {
          // Verificar se resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar resposta
          const responseToCache = response.clone();

          // Verificar se a requisição é cacheável (apenas HTTP/HTTPS)
          if (event.request.url.startsWith('http')) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache).catch((error) => {
                  console.warn('Erro ao fazer cache:', error);
                });
              });
          }

          return response;
        });
      })
      .catch(() => {
        // Se falhar, retornar página offline se for navegação
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      })
  );
});

// Notificações push (para uso futuro)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [200, 100, 200],
    tag: 'rentacar-notification'
  };

  event.waitUntil(
    self.registration.showNotification('RentaCar', options)
  );
});

