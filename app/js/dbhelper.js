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
                    var tempReviewStore = upgradeDb.createObjectStore(DB_PENDING_REVIEW_TABLE_NAME, {keyPath: 'id', autoIncrement: true});
                    // tempReviewStore.createIndex('by-id', 'id');

            }
        });

        return dbPromise;
    }

    /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
    static get DATABASE_URL() {
        const port = 80 // Change this to your server port
        let dataURL = "";
        if (location.protocol.indexOf("https") !== -1) {
            dataURL = `https://restaurantserver.herokuapp.com:${port}/restaurants/`;
        } else {
            dataURL = `http://restaurantserver.herokuapp.com:${port}/restaurants/`;
        }

        return dataURL;
    }

    /**
   * Review URL.
   */
    static get REVIEW_URL() {
        const port = 80 // Change this to your server port
        let dataURL = "";
        if (location.protocol.indexOf("https") !== -1) {
            dataURL = `https://restaurantserver.herokuapp.com:${port}/reviews/`;
        } else {
            dataURL = `http://restaurantserver.herokuapp.com:${port}/reviews/`;
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

            let tx = db.transaction(tableName, 'readwrite');
            let store = tx.objectStore(tableName);
            //console.log(store);
            //console.log('Inserting in IDB: ' + data);
            store.put(data);

            return tx.complete;
        }).catch((err) => {
            console.log("error inserting something into the idb", err);
            return;
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

    static updateFavorite(id, newState) {

        console.log("updateFavorite");

        DBHelper.updateFavoriteIDB(id, {
            "is_favorite": newState
        }, (newRestaurantUpdate) => {
            const isFavorite = (newRestaurantUpdate["is_favorite"] && newRestaurantUpdate["is_favorite"].toString() === "true")
                ? true
                : false;

            console.log("am i running updateFavoriteIDB callback");

            const favoriteBtn = document.getElementById("favorite-icon-" + newRestaurantUpdate.id);

            favoriteBtn.style.background = isFavorite
                ? `url("/img/icons/likeBtns/like1.svg") no-repeat`
                : `url("/img/icons/likeBtns/like0.svg") no-repeat`;
            favoriteBtn.innerHTML = isFavorite
                ? newRestaurantUpdate.name + " is a favorite"
                : newRestaurantUpdate.name + " is not a favorite";
            favoriteBtn.id = "favorite-icon-" + newRestaurantUpdate.id;
            // reset eventHandler
            favoriteBtn.onclick = event => handleFavoriteClick(newRestaurantUpdate);

            // Finally update favorite on the server.
            let dataURL = DBHelper.DATABASE_URL + id + '/?is_favorite=';
            dataURL = dataURL + newRestaurantUpdate["is_favorite"];
            fetch(dataURL, {method: 'PUT'}).then(response => response.json());

        });

    }

    static updateFavoriteIDB(id, newStateObj, callback) {

        return DBHelper.openDB().then(function(db) {

            console.log("I am in updateFavoriteIDB");

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            let restaurant = store.get(id).then((newRestaurant) => {
                return newRestaurant;
            });

            return restaurant;
        }).then(restaurant => {
            if (restaurant) {
                restaurant["is_favorite"] = newStateObj.is_favorite;

                console.log(restaurant);
                DBHelper.insertDataIDB(DB_RESTAURANTS_TABLE_NAME, restaurant)
                callback(restaurant);
            } else {
                console.log("This shouldn't happen! Database was deleted. Reload main page to fix.");
            }
        }).catch((err) => {
            console.log("error getting restaurant data for updating favorite option.", err);
            return;
        });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {

        DBHelper.getRestaurantFromIDB(id, callback);
    }

    /**
      * fetch a single restaurant from idb
      */
    static getRestaurantFromIDB(id, callback) {

        return DBHelper.openDB().then(function(db) {
            console.log("I am in getRestaurantFromIDB");

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            let restaurant = store.get(id).then((newRestaurant) => {
                return newRestaurant;
            });

            return restaurant;

        }).then(restaurant => {
            // console.log(restaurant);
            if (restaurant) {
                DBHelper.fetchRestaurantReviews(restaurant, callback);
                // callback(null, restaurant);

            } else {
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
                    console.log(error);
                    console.log("im in the fetchRestaurantById catch");
                    //DBHelper.getRestaurantFromIDB(id, callback);
                });
            }
        }).catch(() => {
            console.log("error getting something from the idb");
            return;
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
            callback("Failed to get the restaurant review json for id: " + restaurant.id, null);
        });

    }

    /**
      * fetch a single restaurant from idb
      */
    static getReviewsFromIDB(restaurant, callback) {
        // load from idb instead...
        // console.log("Some error appended, but loading reviews from idb", err);

        DBHelper.openDB().then(function(db) {

            let tx = db.transaction(DB_REVIEW_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_REVIEW_TABLE_NAME);

            let reviews = store.getAll(restaurant.id);

            return reviews;
        }).then(reviews => {
            if (reviews) {
                restaurant["reviews"] = reviews;
                callback(null, restaurant);
            } else {
                DBHelper.fetchRestaurantReviews(restaurant, callback);
            }
            //console.log('got all reviews for restaurant: ' + restaurant.id);
        }).catch((err) => {
            console.log("error getting reviews from the idb", err);
            return;
        });
    }

    /**
      * fetch all restaurants from idb
      */
    static getAllRestaurantsFromIDB(callback) {
        // load from idb instead...
        console.log("Some error appended, but loading from idb");

        DBHelper.openDB().then(function(db) {

            let tx = db.transaction(DB_RESTAURANTS_TABLE_NAME, 'readonly');
            let store = tx.objectStore(DB_RESTAURANTS_TABLE_NAME);

            //console.log('idb ', 'getting IDB: ' + data);
            return store.getAll();

        }).then(restaurants => {
            console.log(restaurants);
            callback(null, restaurants);
        }).catch((err) => {
            console.log("error getting something from the idb");
            return;
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

    static queueMessage(msg) {
        console.log("queueing ", msg);

        return DBHelper.openDB().then((db) => {

            let transaction = db.transaction(DB_PENDING_REVIEW_TABLE_NAME, 'readwrite');
            let store = transaction.objectStore(DB_PENDING_REVIEW_TABLE_NAME);

            store.add(msg);

            return transaction.complete;

        }).then(function() {

            /* here we request a background sync */
            navigator.serviceWorker.ready.then(registration => {
                console.log('sync register');
                return registration.sync.register('flush');
            });
        });
    }
}
