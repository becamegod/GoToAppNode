require('dotenv').config();
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.adminsdk);
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// constants
const type = require('./alertType');

// init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gotoapp-357309-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// listen realtime database (booking)
let firstTime = true;
const realtime = admin.database();
const bookingRef = realtime.ref("booking");
const availableDriversRef = realtime.ref('availableDrivers');
bookingRef.on('value', (snapshot) => {
  if (firstTime) {
    firstTime = false;
    return;
  }
  let change = snapshot.val();
  console.log('new booking change: ', change);

  // get customer's info
  const firestore = admin.firestore();
  firestore.collection('users').doc(change.customerId).get()
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
        // get available drivers
        getAvailableDrivers((tokens) => notifyDrivers(tokens, change, type.clientFound));

        // get all device tokens from firestore db
        // fs.collection('users').where('accountType', '==', 'Driver').get()
        //   .then(values => {
        //     const tokens = values.docs.map(entry => entry.data().deviceToken);
        //     console.log('tokens: ', tokens);
        //     if (tokens.length > 0) notifyDrivers(tokens, change);
        //   })
        //   .catch(error => console.error(error));
      }

    })
    .catch(error => console.log(error));

});

const notifyDrivers = (tokens, payload, type) => {

  let content = {};
  content.id = uuidv4();
  content.channelKey = 'basic_channel';
  content.title = 'Có khách ở gần bạn';
  content.body = 'Đã tìm thấy khách hàng đang tìm xe, hãy mau đến đón.';
  payload.type = type;
  content.payload = payload;

  const message = {
    data: { 'content': JSON.stringify(content) },
    tokens: tokens,
  };

  console.log('message to be sent: ', message);

  admin.messaging().sendMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(registrationTokens[idx]);
          }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
      }
      else {
        console.log('message sent')
      }
    });
}

// [DEBUG] read bookingRes handled keys
const handledFile = 'handled.txt';
let handled = [];
fs.readFile(handledFile, 'utf8', (error, data) => {
  if (error) {
    console.error(error);
    return;
  }
  handled = data.split('\r\n');

  // listen for bookingRespond
  const bookingResRef = realtime.ref('bookingRespond');
  bookingResRef.on('child_added', snapshot => {

    // filter old entries
    if (snapshot.key in handled) return;
    fs.appendFile(handledFile, snapshot.key + '\n', err => { if (err) console.error(err) });

    // real handle
    const respond = snapshot.val();
    console.log('new booking respond: ', snapshot.key, respond);
    getAvailableDrivers((tokens) => {
      const otherTokens = tokens.filter(element => element != respond.driverId);
      // TODO: FCM
      notifyDrivers(tokens, {});
    });
  });
});

const getAvailableDrivers = (callback) => {
  availableDriversRef.once('value')
    .then(snapshot => {
      const drivers = snapshot.val();
      const tokens = Object.values(drivers);
      console.log('tokens: ', tokens);
      if (tokens.length > 0) callback(tokens);
    })
    .catch(error => console.log(error));
}

console.log('server started...');