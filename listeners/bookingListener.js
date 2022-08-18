const admin = require("firebase-admin");
const realtime = admin.database();
const type = require('../alertType');
const { getAvailableDrivers } = require('../utils');
const { notifyDrivers } = require('../messenger');

let firstTime = true;
const currentTripsRef = realtime.ref('currentTrips');

realtime.ref("booking").on('value', (snapshot) => {
    if (firstTime) {
        firstTime = false;
        return;
    }
    let change = snapshot.val();
    console.log('new booking change: ', change);

    // get customer's info
    const customerId = change.customerId;
    const firestore = admin.firestore();
    firestore.collection('users').doc(customerId).get()
        .then(document => {

            // add to "change"
            const customer = document.data();
            change.customerName = customer.name;
            change.phoneNumber = customer.phoneNumber;

            if (change.isFromWeb) {
                // [SMS]

            }
            else {
                /// [FCM]        
                // create currentTrip
                currentTripsRef.child(customerId).set('')
                    .catch(err => console.error(err));

                // get available drivers
                getAvailableDrivers((tokens) => notifyDrivers(tokens, change, type.clientFound));
            }

        })
        .catch(error => console.log(error));
});