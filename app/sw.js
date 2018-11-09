// Define the Caches
var staticCacheName = 'mws-restaurant-static-db-1';

self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(staticCacheName).then(function(cache) {
        return cache.addAll([
            '/',
            '/index.html',
            '/restaurant.html',
            '/css/reviews.css',
            '/css/simpleModalBox.css',
            '/css/styles.css',
            '/css/under550.css',
            '/css/under700.css',
            '/js/dbhelper.js',
            '/js/idb.js',
            '/js/main.js',
            '/js/restaurant_info.js',
            '/js/swRegister.js',
            '/img/icons/likeBtns/like0.svg',
            '/img/icons/likeBtns/like1.svg',
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
            .catch(noCacheFileFound);
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
            return caches.match(request.event);
        }


        function noCacheFileFound() {
            return new Response('NO IIIIIINNNNNTERNEEEEEEEEEEEZ, run away', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({'Content-Type': 'text/html'})
            });
        }
    }));
});




const channel = new BroadcastChannel('updates');

self.addEventListener('sync', function (event) {

    event.waitUntil(
         DBHelper.openDB().then((db) => {

            let transaction = db.transaction(DB_PENDING_REVIEW_TABLE_NAME, 'readonly');
            let store = transaction.objectStore(DB_PENDING_REVIEW_TABLE_NAME);

            return store.getAll();
        })
            .then((messages) => {
                return Promise.all(messages.map(function (message) {

                    const postUrl = message.urlRoot;

                    return fetch(postUrl, {
                        method: 'POST',
                        cache: "no-cache",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(message.review)
                    })
                        .then((response) => {
                            return response.json();
                        })
                        .then((rrr) => {
                            console.log('resp ', rrr);
                            /* TODO: pass back received reply from remote DB to page so it can update */
                            channel.postMessage(rrr);

                            return store.outbox('readwrite')
                                .then((outbox) => {
                                    console.log('sent and purged id #' + message.id);
                                    return outbox.delete(message.id);
                                });
                        })
                }))
            })
            .catch((err) => {
                console.error(err);
            })
    );

    /* TODO: pass back received reply from remote DB to page so it can update */
});
