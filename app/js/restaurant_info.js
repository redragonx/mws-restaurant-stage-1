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

                // Get the modal
                var modal = document.getElementById('myModal');

                var modalContent = createModalContent(error);

                modal.innerHTML = modalContent;

                // Get the <span> element that closes the modal
                var span = document.getElementsByClassName("close")[0];

                modal.style.display = "block";

                // When the user clicks on <span> (x), close the modal
                span.onclick = function() {
                    modal.style.display = "none";
                }

                // When the user clicks anywhere outside of the modal, close it
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = "none";
                    }
                }
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
}

function createModalContent(text) {
    return [
        '<div class="modal-content">',
        '<span class="close">&times;</span>',
        '<center><p>',
        text,
        '</p></center>',
        '</div>'
    ].join('\n');
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {

    const mainDiv = document.getElementById("maincontent");
    const favDiv = document.getElementById("favSpan");

    favDiv.innerHTML = createFavIcon(restaurant).outerHTML;

    const favorite = document.getElementById("favorite-icon-" + restaurant.id);
    //favDiv.onclick = event => handleFavoriteClick(restaurant);
    favorite.onclick = event => handleFavoriteClick(restaurant);

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
    // let imgName = imgSrcBaseFolder.substring(0, imgSrcBaseFolder.length - 4);

    const imgurl1x = imgSrcBaseFolder + "_450.jpg";
    const imgurl2x = imgSrcBaseFolder + "_550.jpg";
    const imgurl3x = imgSrcBaseFolder + "_900.jpg";

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

handleFavoriteClick = (restaurant) => {
    // Update properties of the restaurant data object
    const favorite = document.getElementById("favorite-icon-" + restaurant.id);
    newFavState = !restaurant["is_favorite"];
    console.log("handleFavoriteClick new state is: ", newFavState );

    DBHelper.updateFavorite(restaurant.id, newFavState);

    //favorite.onclick = event => handleFavoriteClick(restaurant.id, newFavState);
};

createFavIcon = (restaurant) => {
    const isFavorite = (restaurant["is_favorite"] && restaurant["is_favorite"].toString() === "true")
        ? true
        : false;

    const favorite = document.createElement("button");
    favorite.style.background = isFavorite
        ? `url("/img/icons/likeBtns/like1.svg") no-repeat`
        : `url("/img/icons/likeBtns/like0.svg") no-repeat`;
    favorite.innerHTML = isFavorite
        ? restaurant.name + " is a favorite"
        : restaurant.name + " is not a favorite";
    favorite.id = "favorite-icon-" + restaurant.id;
    return favorite;
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

    reviews = reviews.reverse();

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
    date.innerHTML = new Date(review.createdAt).toLocaleDateString();
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

reviewSubmit = () => {
    let reviewForm = document.getElementById('review-form').elements;

    console.log(this.restaurant);

    const review = {
        restaurant_id: this.restaurant.id,
        name: reviewForm['reviewer-name'].value,
        rating: reviewForm['reviewer-rating'].value,
        comments: reviewForm['reviewer-comment'].value
    };

    const message = {
        urlRoot: DBHelper.REVIEW_URL,
        review: review
    };

    /* queue outbound update */
    DBHelper.queueMessage(message);

    document.getElementById('reviewer-name').value = "";
    document.getElementById('reviewer-rating').value = "3";
    document.getElementById('reviewer-comment').value = "";

    // Get the modal
    var modal = document.getElementById('myModal');


    //Notify the user about their review.

    let isOnline = null;

    if (navigator.onLine) {
        isOnline = "Online";
    } else {
        isOnline = "Offline";
    }


    var modalContent = createModalContent("Your review is added. It will be sent whenever you're online. Current status: " + isOnline);
    modal.innerHTML = modalContent;

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // createModalContent("Your review is added. It will be sent whenever you're online. Current Status: " + navigator.onLine)

    return false;
};

const channel = new BroadcastChannel('updates');

channel.onmessage = (ev) => {
    if (parseInt(this.restaurant.id) === parseInt(ev.data.restaurant_id)) {
        console.log('update for me');
        this.restaurant.reviews.push(ev.data);

        /*
         * I decided not to update the reviews on the page until after
         * the server has been updated, if we're offline the dates of the
         * reviews could be different after a refresh.
         */
        fillReviewsListHTML();
    }
};


fillReviewsListHTML = (reviews = self.restaurant.reviews) => {

    const list = document.getElementById('reviews-list');

    /* remove all the old reviews */
    while (list.hasChildNodes()) {
        list.removeChild(list.lastChild);
    }

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        list.appendChild(noReviews);
        return;
    }

    // new reviews first

    reviews = reviews.reverse();

    reviews.forEach(review => {
        list.appendChild(createReviewHTML(review));
    });

    document.getElementById("reviews-list").firstChild.className = "highlight";
};
