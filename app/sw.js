// Define the Caches
var staticCacheName = 'mws-restaurant-static-db-';

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var randomizedID = Math.random().toString(5).slice(3);
var cacheID = randomizedID;

staticCacheName += cacheID;

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

self.addEventListener('fetch', function(event) {

    event.respondWith(caches.match(event.request, {ignoreSearch: true}).then(function(response) {
        if (response) {
            /* response was cached already, return it */
            //console.log("served from cache :" + event.request.url);
            return response;
        } else {
            /* we need to go to the network to fetch response */
            return fetch(event.request).then(function(response) {
                /* TODO: make this test more generic, at least for review content */
                if ((!event.request.url.match(/^https:\/\/api.tiles.mapbox.com\//)) && (!event.request.url.match(/^http:\/\/localhost:1337\//))) {
                    /* don't cache maps or reviews content */
                    return caches.open(staticCacheName).then(function(cache) {
                        cache.put(event.request.url, response.clone());
                        /* lastly, pass the response back */
                        return response;
                    })
                } else {
                    return response;
                }
            }).catch(function(error) {
                /* errors are normal when there's no net connection - shut it up */
            });
        }
    }));
});
