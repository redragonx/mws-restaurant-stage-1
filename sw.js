// Define the Caches
var staticCacheName = 'mws-restaurant-static-db-';

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var randomizedID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var cacheID = randomizedID;

staticCacheName += cacheID;

self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(staticCacheName).then(function(cache) {
        return cache.addAll([
            '/index.html',
            '/restaurant.html',
            '/css/styless.css',
            '/css/under550.css',
            '/css/under700.css',
            '/js/dbhelper.js',
            '/js/main.js',
            '/js/restaurant_info.js',
            '/img/*',
            '/js/register.js',
            'https://fonts.googleapis.com/css?family=Roboto:300,400,500'
        ]).catch(error => {});
    }));
});

self.addEventListener('activate', function(event) {
    event.waitUntil(caches.keys().then(function(cacheNames) {
        return Promise.all(cacheNames.filter(function(cacheName) {
            return cacheName.startsWith('mws-restaurant-') && cacheName != staticCacheName;
        }).map(function(cacheName) {
            return caches.delete(cacheName);
        }));
    }));
});
self.addEventListener("fetch", function(event) {
    console.log('WORKER: fetch event in progress.');

    if (event.request.method !== 'GET') {

        console.log('WORKER: fetch event ignored.', event.request.method, event.request.url);
        return;
    }

    event.respondWith(caches.match(event.request).then(function(cached) {
        var networked = fetch(event.request)
        // We handle the network request with success and failure scenarios.
            .then(fetchedFromNetwork, unableToResolve)
        // We should catch errors on the fetchedFromNetwork handler as well.
            .catch(unableToResolve);
        console.log(
            'WORKER: fetch event', cached
            ? '(cached)'
            : '(network)',
        event.request.url);
        return cached || networked;

        function fetchedFromNetwork(response) {
            /* We copy the response before replying to the network request.
             This is the response that will be stored on the ServiceWorker cache.
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

            console.log('WORKER: fetch request failed in both cache and network.');

            return new Response('NO IIIIIINNNNNTERNEEEEEEEEEEEZ, run away', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({'Content-Type': 'text/html'})
            });
        }
    }));
});
