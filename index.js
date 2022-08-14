require('dotenv').config();
const admin = require("firebase-admin");
const serviceAccount = JSON.parse(process.env.adminsdk);
const { v4: uuidv4 } = require('uuid');

// init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gotoapp-357309-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// listen realtime database (booking)
let firstTime = true;
const rt = admin.database();
const bookingRef = rt.ref("booking");
const availableDriversRef = rt.ref('availableDrivers');
bookingRef.on('value', (snapshot) => {
  if (firstTime) {
    firstTime = false;
    return;
  }
  let change = snapshot.val();
  console.log('new booking change: ', change);

  // get customer's info
  const fs = admin.firestore();
  fs.collection('users').doc(change.customerId).get()
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
        availableDriversRef.once('value')
          .then(snapshot => {
            const drivers = snapshot.val();
            const tokens = Object.values(drivers);
            console.log('tokens: ', tokens);
            if (tokens.length > 0) notifyDrivers(tokens, change);
          })
          .catch(error => console.log(error));

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

const notifyDrivers = (tokens, payload) => {

  let content = {};
  content.id = uuidv4();
  content.channelKey = 'basic_channel';
  content.title = 'Có khách ở gần bạn';
  content.body = 'Đã tìm thấy khách hàng đang tìm xe, hãy mau đến đón.';
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

console.log('server started...');