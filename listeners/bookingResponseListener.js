const database = require("firebase-admin/database");
const firebaseAdmin = require("firebase-admin");
const firestore = require("firebase-admin/firestore");

const bookingResponseType = {
    acceptTrip: "acceptTrip",
    pickedUp: "pickedUp",
    finished: "finished",
}

const db = database.getDatabase();
const firestoreDb = firestore.getFirestore();

var currentTrips;

db.ref("currentTrips").on("value", (dataSnapshot) => currentTrips = dataSnapshot.val());

db.ref("bookingResponse").on("child_changed", (dataSnapshot) => {
    let val = dataSnapshot.val();
    
    if (val.keyword == bookingResponseType.acceptTrip) {
        acceptTrip(val, dataSnapshot.key);
    }
    else {
        messageUser(dataSnapshot.key, {
            keyword: val.keyword
        })
    }
})

async function acceptTrip(val, tripID)
{
    if (currentTrips[tripID]) {
        if (currentTrips[tripID] != val.driverID) {
            messageUser(val.driverID, { message: "Trip is taken" });
        }
    }
    else {
        db.ref("currentTrips").update({
            [tripID]: val.driverID
        })
        messageUser(tripID, {
            keyword: bookingResponseType.acceptTrip,
            driverName: val.driverName,
            driverPhone: val.driverPhone,
            driverID: val.driverID
        });
    }
}

async function messageUser(userID, payload)
{
    let token = await getDeviceToken(userID);
    firebaseAdmin.messaging().sendToDevice(token, payload);
}

async function getDeviceToken(userID)
{
    let snapshot = await firestoreDb.collection("users").doc(userID).get();
    let val = snapshot.val();
    return val.deviceToken;
}