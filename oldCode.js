// NOT USED
// STORE HERE FOR ARCHIVING

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

// get all device tokens from firestore db
fs.collection('users').where('accountType', '==', 'Driver').get()
    .then(values => {
        const tokens = values.docs.map(entry => entry.data().deviceToken);
        console.log('tokens: ', tokens);
        if (tokens.length > 0) notifyDrivers(tokens, change);
    })
    .catch(error => console.error(error));