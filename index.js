var admin = require("firebase-admin");

var serviceAccount = require("./gotoapp-357309-firebase-adminsdk-poj6o-c6c2fbb064.json");

// init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gotoapp-357309-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// listen realtime database (booking)
let firstTime = true;
var db = admin.database();
var ref = db.ref("booking");
ref.on('value', (snapshot) => {
  if (firstTime) {
    firstTime = false;
    return;
  }
  const change = snapshot.val();
  console.log('new booking change: ', change);

  // get all device tokens from firestore db
  var fs = admin.firestore();
  fs.collection('users').where('accountType', '==', 'Driver').get()
    .then(values => {
      const tokens = values.docs.map(entry => entry.data().deviceToken);
      console.log('tokens: ', tokens);
      if (tokens.length > 0) notifyDrivers(tokens, change);
    })
    .catch(error => console.error(error));
});

const notifyDrivers = (tokens, data) => {  
  
  const message = {
    data: {'content': JSON.stringify(data)},
    tokens: tokens,
  };
    
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