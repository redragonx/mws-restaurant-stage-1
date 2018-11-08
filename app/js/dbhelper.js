MWS_DB_NAME = 'mws-db';
DB_RESTAURANTS_TABLE_NAME = 'mws-restaurants';
DB_REVIEW_TABLE_NAME = 'reviews';
DB_PENDING_REVIEW_TABLE_NAME = 'PendingReviews';

/**
 * Common database helper functions.
 */

class DBHelper {

    static openDB() {

        console.log('opening the IDB for mws');

        let dbPromise = idb.open(MWS_DB_NAME, 2, upgradeDb => {
            switch (upgradeDb.oldVersion) {
                case 0:
                    var mwsDBStore = upgradeDb.createObjectStore(DB_RESTAURANTS_TABLE_NAME, {keyPath: 'id'});
                    mwsDBStore.createIndex('by-id', 'id');

                case 1:
                    var reviewsStore = upgradeDb.createObjectStore(DB_REVIEW_TABLE_NAME, {keyPath: 'id'});
                    reviewsStore.createIndex('by-id', 'id');

                case 2:
                    var tempReviewStore = upgradeDb.createObjectStore(DB_PENDING_REVIEW_TABLE_NAME, {keyPath: 'restaurant_id'});
                    tempReviewStore.createIndex('by-id', 'id');

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

    /**
   * Review URL.
   */
    static get REVIEW_URL() {
        const port = 1337 // Change this to your server port
        let dataURL = "";
        if (location.protocol.indexOf("https") !== -1) {
            dataURL = `https://${location.hostname}:${port}/reviews/`;
        } else {
            dataURL = `http://${location.hostname}:${port}/reviews/`;
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
                DBHelper.insertDataIDB(DB_RESTAURANTS_TABLE_NAME, restaurant);
            });
            callback(null, restaurants);
        }).catch(function(err) {
            DBHelper.getAllRestaurantsFromIDB(callback);
        });
    }

    /* Method to insert in an IDB */
    static insertDataIDB(tableName, data) {

        return DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error inserting something into the idb");
                return;
            };

            let tx = db.transaction(tableName, 'readwrite');
            let store = tx.objectStore(tableName);
            //console.log(store);
            //console.log('Inserting in IDB: ' + data);
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

    static updateFavorite(id, newState) {

        // Block any more clicks on this until the callback
        const fav = document.getElementById("favorite-icon-" + id);
        fav.onclick = null;
        console.log("updateFavorite");


        DBHelper.updateFavoriteIDB(id, {"is_favorite": newState}, (newRestaurantUpdate) => {
            const isFavorite = (newRestaurantUpdate["is_favorite"] && newRestaurantUpdate["is_favorite"].toString() === "true")
                ? true
                : false;

                console.log("am i running updateFavoriteIDB callback");

                const favoriteBtn = document.getElementById("favorite-icon-" + restaurant.id);

                favoriteBtn.style.background = isFavorite
                    ? `url("/img/icons/likeBtns/like1.svg") no-repeat`
                    : `url("/img/icons/likeBtns/like0.svg") no-repeat`;
                favoriteBtn.innerHTML = isFavorite
                    ? newRestaurantUpdate.name + " is a favorite"
                    : newRestaurantUpdate.name + " is not a favorite";
                favorite.id = "favorite-icon-" + newRestaurantUpdate.id;

                favoriteBtn.onclick = event => handleFavoriteClick(newRestaurantUpdate.id, !isFavorite);
        });
    }

    static updateFavoriteIDB(id, newStateObj, callback) {

        return DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error getting restaurant data for updating favorite option");
                return;
            };

            console.log("I am in updateFavoriteIDB");

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            var countRequest = store.count();
            countRequest.onsuccess = function(evt) {
                console.log(evt.target.value);
              console.log(countRequest.result);
            }

            countRequest.onsuccess = function() {
              console.log("errorrrrr");
            }

            let restaurant = null;
            store.openCursor().onsuccess = function(event) {
                console.log("cursor");
                var cursor = event.target.result;
                if (cursor && cursor.value.restaurant_id === id) {
                    restaurant = cursor.value;

                    console.log("restaurant is", restaurant);
                } else {
                    cursor.continue();
                }
            };

            store.openCursor().onerror = function(event) {
                // report the success of our request
                console.log("why tho");

                callback("No restaurant store", null);
                return;
            };

            return restaurant;
        }).then(restaurant => {
            if (restaurant) {
                restaurant["is_favorite"] = newStateObj;

                console.log(restaurant);
                return;
                callback(restaurant);
            } else {
                //callback(null, restaurant);
            }
        });

    }


    static addReviewsToIDB(reviews) {

        reviews.forEach(function(review) {
            // review.id = parseInt(review.id);
            DBHelper.insertDataIDB(DB_REVIEW_TABLE_NAME, review);
        });
        console.log("I am called from addReviewsToIDB.");

    }

    /**
     * Fetch all reviews for a specific restaurant
     */
    static fetchRestaurantReviews(restaurant, callback) {

        fetch(DBHelper.REVIEW_URL + "?restaurant_id=" + restaurant.id).then((reviewResp) => {
            if (!reviewResp.ok) {
                callback("Failed to get the restaurant review json for id: " + restaurant.id, null);
            } else {
                return reviewResp.json();
            }
        }).then((reviews) => {
            if (reviews) {
                // Creates a full restaurant object before calling a callback.
                restaurant["reviews"] = reviews;
                DBHelper.addReviewsToIDB(reviews);
                callback(null, restaurant);
                // console.log("review", restaurant);
            } else {
                // Has no reviews.
                callback(null, restaurant);
            }
        }).catch(function(error) {

            // Try to load reviews from IDB
            DBHelper.getReviewsFromIDB(restaurant, callback);
        });

    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {

        // Get the restaurant from the server
        console.log("am i really getting errors from dbhelper?");
        fetch(DBHelper.DATABASE_URL + id).then((restaurantResp) => {
            //console.log(restaurantResp);
            if (!restaurantResp.ok) {
                callback("Failed to get the restaurant json for id: " + id, null);
            } else {
                return restaurantResp.json();
            }
        }).then((restaurant) => {

            if (restaurant) {
                // now get the restaurant reviews before returning the actual restaurant json

                console.log(restaurant);
                DBHelper.fetchRestaurantReviews(restaurant, callback);
                //callback(null, restaurant);
            } else {
                // Restaurant does not exist in the database
                callback("Restaurant (id: " + id + ") does not exist locally or the server is down. You might be offline. Try again later.", null);
            }
        }).catch(function(error) {
            // Try to load from the idb instead
            console.log("im in the fetchRestaurantById catch");
            DBHelper.getRestaurantFromIDB(id, callback);
        });
    }

    /**
      * fetch a single restaurant from idb
      */
    static getRestaurantFromIDB(id, callback) {
        // load from idb instead...
        console.log("Some error appended, but loading from idb", err);

        DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error getting restaurant from the idb: " + id);
                return;
            };

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            // Make a request to get a record by key from the object store
            let objectStoreRequest = objectStore.get(id);
            let restaurant = {};

            objectStoreRequest.onsuccess = function(event) {
                // report the success of our request

                restaurant = objectStoreRequest.result;
            };

            objectStoreRequest.onerror = function(event) {
                callback("No Restaurant found", null);
                return;
            };

            return restaurant;

        }).then(restaurant => {
            // console.log(restaurant);
            DBHelper.fetchRestaurantReviews(restaurant, callback);
        });
    }

    /**
      * fetch a single restaurant from idb
      */
    static getReviewsFromIDB(restaurant, callback) {
        // load from idb instead...
        // console.log("Some error appended, but loading reviews from idb", err);

        DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error getting reviews from the idb");
                return;
            };

            let tx = db.transaction(DB_REVIEW_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_REVIEW_TABLE_NAME);

            let reviews = null;
            store.openCursor().onsuccess = function(event) {

                reviews = [];
                var cursor = event.target.result;
                if (cursor && cursor.value.restaurant_id === restaurant.id) {
                    reviews.push(cursor.value);
                    cursor.continue();
                }
            };

            store.openCursor().onerror = function(event) {
                // report the success of our request

                callback("No review store", null);
                return;
            };

            return reviews;
        }).then(reviews => {
            if (reviews) {
                restaurant["reviews"] = reviews;
                callback(null, restaurant);
            } else {
                callback(null, restaurant);
            }
            console.log('got all reviews for restaurant: ' + restaurant.id);
        });
    }

    /**
      * fetch a single restaurant from idb
      */
    static getRestaurantFromIDB(id, callback) {
        // load from idb instead...
        console.log("Some error appended, but loading from idb", err);

        DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error getting something from the idb");
                return;
            };

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            // Make a request to get a record by key from the object store
            let objectStoreRequest = objectStore.get(id);
            let restaurant = null;

            objectStoreRequest.onsuccess = function(event) {
                // report the success of our request

                restaurant = objectStoreRequest.result;
            };

            objectStoreRequest.onerror = function(event) {
                // report the failure of our request

                return;
            };

            return restaurant;

        }).then(restaurant => {
            // console.log(restaurant);
            if (restaurant) {
                DBHelper.fetchRestaurantReviews(restaurant, callback);
                callback(null, restaurant);

            } else {
                callback("No Restaurant found in the IDB cache!", null);
            }
        });
    }

    /**
      * fetch all restaurants from idb
      */
    static getAllRestaurantsFromIDB(callback) {
        // load from idb instead...
        console.log("Some error appended, but loading from idb");

        DBHelper.openDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error getting something from the idb");
                return;
            };

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            //console.log('idb ', 'getting IDB: ' + data);
            return store.getAll();

        }).then(restaurants => {
            console.log(restaurants);
            callback(null, restaurants);
        });
    }

    /*
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
    */

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
