// CoachAI · Service Worker AUTO-DISATTIVANTE
// Rimuove le cache vecchie e si disinstalla, così nessuna versione resta "bloccata".
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((c) => c.navigate(c.url));
    } catch (e) {}
  })());
});
// Nessun fetch handler: tutte le richieste passano direttamente dalla rete.
