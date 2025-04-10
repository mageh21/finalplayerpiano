const CACHE_NAME = 'musicxml-player-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/build/musicxml-player.css',
  '/build/musicxml-player.mjs',
  'https://unpkg.com/unzipit@1.4.3/dist/unzipit.min.js',
  '/data/asa-branca.musicxml',
  '/data/bach-invention-1.musicxml',
  '/data/chopin-prelude-20.musicxml',
  '/data/debussy-clair-de-lune.musicxml',
  'https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3/instrument.js'
];

// Install event - cache initial assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Special handling for soundfont files
  if (event.request.url.includes('midi-js-soundfonts')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then((response) => {
              // Cache soundfont files for offline use
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return response;
            });
        })
    );
    return;
  }

  // Regular assets
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }
            // Cache successful responses for static assets
            if (event.request.url.match(/\.(js|css|html|json|musicxml)$/)) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }
            return response;
          })
          .catch(() => {
            // Return a fallback response for failed image requests
            if (event.request.url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
              return caches.match('/icons/fallback-image.png');
            }
            // Return a fallback HTML page for other failed requests
            return caches.match('/offline.html');
          });
      })
  );
}); 