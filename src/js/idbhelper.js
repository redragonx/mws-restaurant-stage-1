DB_TABLE_NAME = 'mws-restaurants';
DB_REVIEW_TABLE_NAME = 'reviews';



class IDBHelper {

    static openDB(database) {

        console.log('opening the IDB for mws');

        // Check service worker support, if it is not supported I don't do anything
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }

        let dbPromise = IDB.open(database, 1, upgradeDb => {
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

    static insertFullMWSResponse(json) {

        for (var restaurant in json) {
            IDBHelper.insertIDB(restaurant);
        }
    }

    /* Method to insert in an IDB */
    static insertIDB(data) {
        return IDB.openIDB().then(function(db) {
            db.onError = function(evt) {
                console.log("error inserting something into the idb");
                return;
            };

            let tx = db.transaction(DB_TABLE_NAME, 'readwrite');
            let store = tx.objectStore(DB_TABLE_NAME);
            // data.forEach(function (restaurant) {
            console.log('Inserting in IDB: ' + data);
            store.put(data);
            // });

            return tx.complete;
        });
    }

}
