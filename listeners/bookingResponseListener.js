const database = require("firebase-admin/database");
const firebaseAdmin = require("firebase-admin");
const firestore = require("firebase-admin/firestore");
const messenger = require("../messenger");
const alertType = require("../alertType");

const bookingResponseType = {
    acceptTrip: "acceptTrip",
    pickedUp: "pickedUp",
    finished: "finished",
}

const db = database.getDatabase();
const firestoreDb = firestore.getFirestore();

var currentTrips;

db.ref("currentTrips").on("value", (dataSnapshot) => currentTrips = dataSnapshot.val());

db.ref("bookingResponse").on("value", (dataSnapshot) => {
    let val = dataSnapshot.val();
    console.log('bookingRes: ', val);
    
    if (val.keyword == bookingResponseType.acceptTrip) {
        acceptTrip(val, val.customerId);
    }
    else {
        messenger.notifyDrivers(val.customerId, {
            keyword: val.keyword
        }, alertType.notAvailable);
    }
})

async function acceptTrip(val, tripID)
{
    if (!currentTrips && currentTrips[tripID]) {
        if (currentTrips[tripID] != val.driverID) {
            messenger.notifyDrivers(val.driverID, { message: "Trip is taken" }, alertType.notAvailable);
        }
    }
    else {
        db.ref("currentTrips").update({
            [tripID]: val.driverID
        })
        messenger.notifyDrivers(tripID, {
            keyword: bookingResponseType.acceptTrip,
            driverName: val.driverName,
            driverPhone: val.driverPhone,
            driverID: val.driverID
        }, alertType.driverFound);
    }
}

async function getDeviceToken(userID)
{
    console.log('get device token of ', userID);
    let snapshot = await firestoreDb.collection("users").doc(userID).get();
    let data = snapshot.data();
    console.log('user data ', data);
    return data.deviceToken;
}