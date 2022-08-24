const admin = require("firebase-admin");
const realtime = admin.database();
const type = require('../alertType');
const { notifyDrivers } = require('../messenger');
const { getDriverDeviceToken } = require('../utils');

let firstTime = true;
const currentTripsRef = realtime.ref('currentTrips');

realtime.ref('bookingStatus').on('value', (snapshot) => {
    if (firstTime) {
        firstTime = false;
        return;
    }
    let change = snapshot.val();
    console.log('new booking status: ', change);

    // get status
    const { customerId, keyword } = change;
    switch (keyword) {
        case 'cancel':
            const ref = currentTripsRef.child(customerId);
            ref.get()
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        console.log(`current trip of customer ${customerId} doesn't exists`);
                        return;
                    }
                    const driverId = snapshot.val();

                    // send message if there's an accepted driver
                    if (driverId != '') {
                        getDriverDeviceToken(driverId,
                            token => notifyDrivers([token], {}, type.clientCancel)
                        );
                    }

                    // remove entry
                    ref.remove().catch(err => console.error(err));

                    console.log(`customer ${customerId} cancel: entry ${driverId} removed`);
                })
                .catch(err => console.error(err));

            break;

        default:
            console.log(`keyword '${keyword}' is not recognized`);
            break;
    }
});