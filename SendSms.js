exports.handler = function(context, event, callback) {
	const client = context.getTwilioClient();
    const body = 'Welcome to foo.DS! Start driving by sending a text command:\n"Drive  <zip>,<zip>  <fee>".';

    client.messages.create({
        body: body,
        to: event.phoneNumber,
        from: context.TWILIO_PHONE_NUMBER
    })
    .then(() => {
        callback(null, '');
    })
    .catch(err => {
        console.log('ERR ' + err);
        return callback(err);
    });
};