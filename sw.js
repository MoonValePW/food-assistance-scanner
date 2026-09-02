/**
 * Minimal service worker, deliberately cache-free.
 *
 * It exists for one reason: Chrome will not offer to install a web app
 * (beforeinstallprompt never fires) unless the page is controlled by a service
 * worker with a fetch handler. That is the whole job.
 *
 * IT MUST NOT CACHE ANYTHING. A caching worker on a static host is how a phone
 * ends up running a version of this scanner that was fixed days ago, and a
 * stale page is indistinguishable from a fix that did not work — which has
 * already cost this project a round of debugging. Every request passes straight
 * through to the network.
 */

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Present so the app is installable; passes through untouched so nothing is
// ever served from a cache.
self.addEventListener('fetch', function (event) {
  event.respondWith(fetch(event.request));
});
