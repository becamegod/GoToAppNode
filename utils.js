const admin = require("firebase-admin");
const realtime = admin.database();
const firestore = admin.firestore();

const getAvailableDrivers = (callback) => {
    realtime.ref('availableDrivers').once('value')
        .then(snapshot => {
            const drivers = snapshot.val();
            const tokens = Object.values(drivers);
            console.log('tokens: ', tokens);
            if (tokens.length > 0) callback(tokens);
        })
        .catch(error => console.log(error));
}

const getDriverDeviceToken = (driverId, callback) => {
    firestore.collection('users').doc(driverId).get()
        .then(snapshot => {
            const driver = snapshot.data();
            if (driver) callback(driver.deviceToken);
            else console.log("Can't find driver with id " + driverId);
        })
        .catch(err => console.error(err));
}

module.exports = { getAvailableDrivers, getDriverDeviceToken }