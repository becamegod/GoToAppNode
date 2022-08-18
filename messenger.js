const alertType = require('./alertType');
const admin = require("firebase-admin");
const { v4: uuidv4 } = require('uuid');

const notifyDrivers = (tokens, payload, type) => {

    let content = {};
    content.id = uuidv4();
    content.channelKey = 'basic_channel';

    switch (type) {
        case alertType.clientFound:
            content.title = 'Có khách ở gần bạn';
            content.body = 'Đã tìm thấy khách hàng đang tìm xe, hãy mau đến đón.';
            break;
        case alertType.driverFound:
            content.title = 'Đã tìm thấy tài xế';
            content.body = 'Đã có tài xế nhận cuốc đặt xe và đang trên đường đến đón bn bạn.';
            break;

        default:
            content.title = 'TYPE';
            content.body = 'TYPE';
            break;
    }

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

module.exports = { notifyDrivers }