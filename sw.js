// Define the Caches
var staticCacheName = 'mws-restaurant-static-db-';


 //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var randomizedID =  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
var cacheID = randomizedID;

staticCacheName += cacheID;

self.addEventListener("install", function(event) {
    event.waitUntil(caches.open(staticCacheName).then(function(cache) {
        return cache.addAll([
            'index.html',
            'restaurant.html',
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

self.addEventListener('fetch', function(event) {
    event.respondWith(caches.match(event.request).then(function(response) {
        if (response !== undefined) {
            return response;
        } else {
            return fetch(event.request).then(function(response) {
                let responseClone = response.clone();

                caches.open(staticCacheName).then(function(cache) {
                    cache.put(event.request, responseClone);
                });
                return response;
            });
        }
    })) // end of promise for cache match); // end of respond with

});
