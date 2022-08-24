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

db.ref("bookingResponse").on("value", async (dataSnapshot) => {
    let val = dataSnapshot.val();
    console.log('bookingRes: ', val);
    
    if (val.keyword == bookingResponseType.acceptTrip) {
        acceptTrip(val, val.customerId);
    }
    else {
        let token = await getDeviceToken(val.customerId);
        if (val.keyword == "pickedUp") {
            val.keyword = "driverArrived"
        }
        else if (val.keyword == "finished") {
            val.keyword = "tripFinished";
        }
        messenger.notifyDrivers([token], {
            keyword: val.keyword
        }, val.keyword);
    }
})

async function acceptTrip(val, tripID)
{
    if (!currentTrips && currentTrips[tripID]) {
        if (currentTrips[tripID] != val.driverID) {
            messenger.notifyDrivers([val.driverID], { message: "Trip is taken" }, alertType.notAvailable);
        }
    }
    else {
        db.ref("currentTrips").update({
            [tripID]: val.driverID
        })

        let token = await getDeviceToken(tripID);
        messenger.notifyDrivers([token], {
            keyword: bookingResponseType.acceptTrip,
            driverName: val.driverName,
            driverPhone: val.driverPhone,
            driverID: val.driverID
        }, alertType.driverFound);

        token = await getDeviceToken(val.driverID);
        messenger.notifyDrivers([token], { }, alertType.confirmAcceptation);
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