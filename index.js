require('dotenv').config();
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.adminsdk);

// init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gotoapp-357309-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// set up listeners
require('./listeners/bookingListener');

console.log('server started...');