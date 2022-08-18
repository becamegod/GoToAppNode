const admin = require("firebase-admin");
const realtime = admin.database();

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

module.exports = { getAvailableDrivers }