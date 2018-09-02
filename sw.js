// Define the Caches
var staticCacheName = 'mws-restaurant-static-db-';

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var randomizedID = Math.random().toString(5).slice(2);
var cacheID = 1;

staticCacheName += cacheID;

self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(staticCacheName).then(function(cache) {
        return cache.addAll([
            '/',
            '/index.html',
            '/restaurant.html',
            '/css/*',
            '/data/*',
            '/img/*',
            '/js/*',
            'https://fonts.googleapis.com/css?family=Roboto:300,400,500'
        ]).catch(error => {});
    }));
});

// The activate handler takes care of cleaning up old caches.
self.addEventListener("activate", event => {
    const currentCaches = [staticCacheName];
    console.log(`Activating service worker with CACHE ${staticCacheName}`);
    event.waitUntil(caches.keys().then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
        return Promise.all(cachesToDelete.map(cacheToDelete => {
            return caches.delete(cacheToDelete);
        }));
    }).then(() => self.clients.claim()));
});

self.addEventListener("fetch", function(event) {
    console.log('WORKER: fetch event in progress.');

    event.respondWith(caches.match(event.request).then(function(cached) {
        var fetchedRes = fetch(event.request)
        // We handle the network request with success and failure scenarios.
            .then(fetchedFromNetwork, unableToResolve)
        // We should catch errors on the fetchedFromNetwork handler as well.
            .catch(unableToResolve);
        console.log(
            'WORKER: fetch event', cached
            ? '(cached)'
            : '(network)',
        event.request.url);
        return cached || fetchedRes;

        function fetchedFromNetwork(response) {
            /* We copy the response before replying to the network request.
             * This is the response that will be stored on the ServiceWorker cache.
             */
            var cacheCopy = response.clone();

            console.log('WORKER: fetch response from network.', event.request.url);

            caches
            // We open a cache to store the response for this request.
                .open(staticCacheName).then(function add(cache) {

                /* We store the response for this request. It'll later become
                 available to caches.match(event.request) calls, when looking
                 for cached responses.
                */
                return cache.put(event.request, cacheCopy);
            }).then(function() {
                console.log('WORKER: fetch response stored in cache.', event.request.url);
            });

            // Return the response so that the promise is settled in fulfillment.
            return response;
        }

        function unableToResolve() {
            return new Response('NO IIIIIINNNNNTERNEEEEEEEEEEEZ, run away', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({'Content-Type': 'text/html'})
            });
        }
    }));
});
