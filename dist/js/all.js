/**
 * Common database helper functions.
 */
class DBHelper {

    /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
    static get DATABASE_URL() {
        const port = 1337 // Change this to your server port
        let dataURL = "";
        if (location.protocol.indexOf("https") !== -1) {
            dataURL = `https://${location.origin}:${port}/restaurants/`;
        } else {
            dataURL = `http://${location.origin}:${port}/restaurants/`;
        }
        console.log(dataURL);
        return dataURL;
    }

    static fetchDatabaseData(callback) {
        fetch(DBHelper.DATABASE_URL).then(function(response) {
            if (response.ok) {
                //console.log("Response OK", response);
                return response.json();
            }
            console.log("Featch failed response", response);
        }).then(function(json) {
            callback(null, json.restaurants);
        }).catch(function(err) {
            console.log("Some error appended", err);
        });
    }
    /**
   * Fetch all restaurants.
   */
    static fetchRestaurants(callback) {
        fetch('http://example.com/movies.json').then(function(response) {
            return response.json();
        }).then(function(myJson) {
            console.log(JSON.stringify(myJson));
        });
    }

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

let restaurants,
    neighborhoods,
    cuisines
var newMap
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap(); // added
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

/**
 * Initialize leaflet map, called from HTML.
 */
initMap = () => {
    self.newMap = L.map('map', {
        center: [
            40.722216, -73.987501
        ],
        zoom: 12,
        scrollWheelZoom: false
    });
    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1IjoicmVkcmFnb254IiwiYSI6ImNqazk0dmEyNTJjYmgzcHFxbzBmbzUyZDYifQ.pyFbY8TPqHesQ0or_5godg',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
    }).addTo(newMap);

    updateRestaurants();
}
/* window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} */

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    if (self.markers) {
        self.markers.forEach(marker => marker.remove());
    }
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {

    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    let imgSrcBaseFolder = DBHelper.imageUrlForRestaurant(restaurant);

    let imgName = imgSrcBaseFolder.substring(0, imgSrcBaseFolder.length - 4);

    const imgurl1x = imgName + "_450.jpg";
    const imgurl2x = imgName + "_550.jpg";
    const imgurl3x = imgName + "_900.jpg";

    image.src = imgurl1x;
    image.srcset = `${imgurl1x} 450w, ${imgurl2x} 550w, ${imgurl3x} 900w`;
    image.sizes = `(max-width: 503px) 330px, (max-width: 900px) 413px, 900px`;

    image.alt = restaurant.name + " marketing photograph";

    li.append(image);

    const name = document.createElement('h1');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('button');
    var ariaAttribute = document.createAttribute("aria-labelledby")
    var restaurantNoSpaceLabel = restaurant.name.replace(/\s+/g, '');

    ariaAttribute.value = restaurantNoSpaceLabel + "_label";
    more.setAttributeNode(ariaAttribute);


    more.innerHTML = 'View Details';

    let ariaLabel = document.createElement('label');
    ariaLabel.id = restaurantNoSpaceLabel + "_label";
    ariaLabel.className = "aria-label";
    ariaLabel.style = "display: none;";
    ariaLabel.innerHTML = "Link: Restaurant " + restaurant.name + " Details. Neighborhood: " + restaurant.neighborhood + " Address: " + restaurant.address;

    more.onclick = function() {
        const url = DBHelper.urlForRestaurant(restaurant);
        window.location = url;
    }

    li.append(more);
    li.append(ariaLabel);

    return li;
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
        marker.on("click", onClick);
        function onClick() {
            window.location.href = marker.options.url;
        }
        self.markers.push(marker);
    });

}
/* addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
} */

let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.newMap = L.map('map', {
                center: [
                    restaurant.latlng.lat, restaurant.latlng.lng
                ],
                zoom: 16,
                scrollWheelZoom: false
            });
            L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
                mapboxToken: 'pk.eyJ1IjoicmVkcmFnb254IiwiYSI6ImNqazk0dmEyNTJjYmgzcHFxbzBmbzUyZDYifQ.pyFbY8TPqHesQ0or_5godg',
                maxZoom: 18,
                attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
                id: 'mapbox.streets'
            }).addTo(newMap);
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
        }
    });
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant)
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL'
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    let addrLabel = document.getElementById("address_label");
    addrLabel.innerHTML = "Address: " + restaurant.address;

    /* Image stuff */

    let image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';

    let imgSrcBaseFolder = DBHelper.imageUrlForRestaurant(restaurant);
    let imgName = imgSrcBaseFolder.substring(0, imgSrcBaseFolder.length - 4);

    const imgurl1x = imgName + "_450.jpg";
    const imgurl2x = imgName + "_550.jpg";
    const imgurl3x = imgName + "_900.jpg";

    image.src = imgurl1x;
    image.srcset = `${imgurl1x} 450w, ${imgurl2x} 550w, ${imgurl3x} 900w`;
    image.sizes = `(max-width: 503px) 330px, (max-width: 900px) 413px, 900px`;
    image.alt = restaurant.name + " restaurant marketing photograph";

    /* Restaurant cuisine element */
    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;
    var ariaLabel = document.getElementById('cuisine_label');
    ariaLabel.innerHTML = "Cuisine: " + restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        // Create Attitube for Tab Index on Row Only
        var labelTabIndex = document.createAttribute("tabindex");
        labelTabIndex.value = 0;
        // Set the attirubte to the row
        row.setAttributeNode(labelTabIndex);

        // Aria Labelled By
        var ariaAttribute = document.createAttribute("aria-labelledby");
        ariaAttribute.value = key + "_label";
        row.setAttributeNode(ariaAttribute);

        // Day
        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        // Hours
        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);
        hours.appendChild(row);

        var timeAriaLabel = document.createElement('label');
        timeAriaLabel.id = key + "_label";
        timeAriaLabel.className = "aria-label";
        timeAriaLabel.innerHTML = key + ". hours are the following." + operatingHours[key];
        hours.append(timeAriaLabel)
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
/**
  * Create review HTML and add it to the webpage.
  */
createReviewHTML = (review) => {

    // Set random id
    //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    var randomizedID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    var reviewID = randomizedID;

    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = review.date;
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    // Add tab index for each review
    var label_tabindex = document.createAttribute("tabindex");
    label_tabindex.value = 0;
    // Set the attirubte to the row
    li.setAttributeNode(label_tabindex);

    // Add aria labelledby for each review
    var label_attribute = document.createAttribute("aria-labelledby");
    label_attribute.value = reviewID + "_label";
    li.setAttributeNode(label_attribute);

    // Add aria label for each review
    var aria_label = document.createElement('label');
    aria_label.id = reviewID + "_label";
    aria_label.className = "aria-label";
    aria_label.innerHTML = "Rating " + review.rating + " stars. Date " + review.date + ". Reviewed By " + review.name + ". Comments: " + review.comments;

    li.appendChild(aria_label);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');

    const aLink = document.createElement('a');
    var linkText = document.createTextNode(restaurant.name);
    aLink.appendChild(linkText);
    aLink.title = restaurant.name + "restaurant";
    aLink.href = "#";
    // Add aria attribution
    var ariaAttribute = document.createAttribute("aria-current");
    ariaAttribute.value = "page";

    li.appendChild(aLink);
    aLink.setAttributeNode(ariaAttribute);
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/* Set up service worker */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
  .register('../sw.js', {scope: "/"})
    .then(reg => {
      console.log('Service Worker Registration Successful: ' + reg.scope);
    })
    .catch(error => {
      console.log('Service Worker Registration Failed: ' + error);
    });
}
