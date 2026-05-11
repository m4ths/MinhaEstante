const CACHE = 'minha-estante-v2';
const STATIC = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=DM+Sans:wght@300;400;500&display=swap'
];

// Instala e faz cache dos arquivos estáticos
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(STATIC))
  );
  self.skipWaiting();
});

// Limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: ignora Firebase/APIs externas, cache-first para estáticos
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Ignora tudo que não é GET (Firebase usa POST internamente)
  if (e.request.method !== 'GET') return;

  // Ignora Firebase, Google APIs e CDNs externos
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase.googleapis.com') ||
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('gstatic.com/firebasejs') ||
    url.includes('script.google.com')
  ) return;

  // Para o resto: tenta rede, cai no cache se offline
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Só faz cache de respostas válidas e de mesma origem ou CDNs seguros
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
