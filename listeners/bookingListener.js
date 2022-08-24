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
    console.log('new booking: ', change);

    // get customer's info
    const customerId = change.customerId;
    const firestore = admin.firestore();
    const customerRef = firestore.collection('users').doc(customerId);
    customerRef.get()
        .then(document => {

            // add to "change"
            const customer = document.data();
            change.customerName = customer.name;
            change.phoneNumber = customer.phoneNumber;

            // add location frequency
            const endPoint = change.endPoint;
            let freqs = customer.frequencies;
            let existed = false;
            if (!freqs) freqs = [];
            else freqs.forEach(element => {
                if (element.address == endPoint.name) {
                    element.count++;
                    existed = true;
                    console.log(`update count = ${element.count} for ${element.address}`);
                    return;
                }
            });
            if (!existed) {
                freqs.push({
                    address: endPoint.name,
                    coordinate: {
                        latitude: endPoint.lat,
                        longitude: endPoint.lng,
                    },
                    count: 1,
                })
                console.log(`first time book at ${endPoint.name}`);
            }
            customerRef.update({ frequencies: freqs });

            if (change.isFromWeb) {
                // [SMS]

            }
            else {
                /// [FCM]        
                // create currentTrip
                currentTripsRef.child(customerId).set('')
                    .then(() => console.log(`current trip ${customerId} created`))
                    .catch(err => console.error(err));

                // get available drivers
                getAvailableDrivers((tokens) => notifyDrivers(tokens, change, type.clientFound));
            }

        })
        .catch(error => console.log(error));
});