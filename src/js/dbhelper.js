MWS_DB_NAME = 'mws-db';
DB_TABLE_NAME = 'mws-restaurants';
DB_REVIEW_TABLE_NAME = 'reviews';

/**
 * Common database helper functions.
 */

class DBHelper {

    static openDB() {

        console.log('opening the IDB for mws');

        let dbPromise = idb.open(MWS_DB_NAME, 1, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    var mwsDBStore = upgradeDb.createObjectStore(DB_TABLE_NAME, {keyPath: 'id'});
                    mwsDBStore.createIndex('by-id', 'id');

                case 1:
                    var reviewsStore = upgradeDb.createObjectStore(DB_REVIEW_TABLE_NAME, {keyPath: 'id'});
                    reviewsStore.createIndex('by-id', 'id');
            }
        });

        return dbPromise;
    }

    /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port
        let dataURL = "";
        if (location.protocol.indexOf("https") !== -1) {
            dataURL = `https://${location.hostname}:${port}/restaurants/`;
        } else {
            dataURL = `http://${location.hostname}:${port}/restaurants/`;
        }

        return dataURL;
    }

    static fetchDataFromAPI(callback) {
        fetch(DBHelper.DATABASE_URL).then(function(response) {
            if (response.ok) {
                //console.log("Response OK", response);
                return response.json();
            }
            console.log("fetch failed response", response);
        }).then(function(json) {
            // console.log("test fetch:", json);
            let restaurants = json;

            // Insert the mws data into the idb HERE

            restaurants.forEach(function(restaurant) {
                DBHelper.insertDataIDB(restaurant);
            });
            callback(null, restaurants);
        }).catch(function(err) {
            console.log("Some error appended", err);

            DBHelper.openDB().then(function (db) {
                db.onError = function(evt) {
                    console.log("error getting something from the idb");
                    return;
                };

                let tx = db.transaction(DB_TABLE_NAME, 'read');
                let store = tx.objectStore(DB_TABLE_NAME);

                console.log('idb ', 'getting IDB: ' + data);
                return store.getAll();

            }).then(restaurants => {
                console.log(restaurants);
                callback(null, restaurants);
            });
        });
    }

    /* Method to insert in an IDB */
    static insertDataIDB(data) {

        return DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error inserting something into the idb");
                return;
            };

            let tx = db.transaction(DB_TABLE_NAME, 'readwrite');
            let store = tx.objectStore(DB_TABLE_NAME);

            // console.log('Inserting in IDB: ' + data);
            store.put(data);

            return tx.complete;
        });
    }

    /**
   * Fetch all restaurants.
   */
    static fetchRestaurants(callback) {
        if (!self.fetch) {
            throw new Error("Please update your browser. This app uses fetch api");
            return;
        }

        // check for local restaurant idb

        this.fetchDataFromAPI(callback);
    }

    /*
    static legacyXHRFetch(callback) {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", DBHelper.DATABASE_URL);
        xhr.onload = () => {
            if (xhr.status === 200) {
                // Got a success response from server!
                const json = JSON.parse(xhr.responseText);
                const restaurants = json.restaurants;
                callback(null, restaurants);
            } else {
                // Oops!. Got an error from server.
                const error = `Request failed. Returned status of ${xhr.status}`;
                callback(error, null);
            }
        };
        xhr.send();
    }
*/
    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        // fetch all restaurants with proper error handling.
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                const restaurant = restaurants.find(r => r.id == id);
                if (restaurant) {
                    // Got the restaurant
                    callback(null, restaurant);
                } else {
                    // Restaurant does not exist in the database
                    callback("Restaurant does not exist", null);
                }
            }
        });
    }
    /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
   * Fetch all neighborhoods with proper error handling.
   */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
   * Fetch all cuisines with proper error handling.
   */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {

                console.log("fetchCuisines:", restaurants);
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
   * Restaurant page URL.
   */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
   * Restaurant image URL.
   */
    static imageUrlForRestaurant(restaurant) {
        // console.log("wtf", restaurant);
        return (`/img/${restaurant.photograph}`);
    }

    /**
   * Map marker for a restaurant.
   */
    static mapMarkerForRestaurant(restaurant, map) {
        // https://leafletjs.com/reference-1.3.0.html#marker
        const marker = new L.marker([
            restaurant.latlng.lat, restaurant.latlng.lng
        ], {
            title: restaurant.name,
            alt: restaurant.name,
            url: DBHelper.urlForRestaurant(restaurant)
        })
        marker.addTo(newMap);
        return marker;
    }
    /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}
