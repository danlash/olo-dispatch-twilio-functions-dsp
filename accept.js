const uuidv4 = require('uuid/v4');
const moment = require('moment');

exports.handler = function(context, event, callback) {
    
    let pickupMinutes = 0;
    const now = moment();

    if (event.pickupTime) {
        const pickupTime = moment(event.pickupTime, moment.ISO_8601);
        pickupMinutes = pickupTime.diff(now, 'minutes');
    } else {
        const dropoffTime = moment(event.dropoffTime, moment.ISO_8601);
        const pickupTime = dropoffTime.clone().subtract(context.TRANSIT_MINUTES, 'minutes');
        pickupMinutes = pickupTime.diff(now, 'minutes');
    }

    let body = 'New delivery from ' + event.pickup.name + ' (' + event.pickup.phoneNumber + ')\n';
    body += event.pickup.street + ', ' + event.pickup.unit + ', ' + event.pickup.city + ', ' + event.pickup.postalCode + '\n';
    body += event.pickup.instructions + '\n';
    body += 'You should arrive in ' + pickupMinutes + ' minutes!'
    
    const client = context.getTwilioClient();
    
    client.messages.create({
        body: body,
        to: context.DRIVER_PHONE_NUMBER,
        from: context.TWILIO_PHONE_NUMBER
    })
    .then((message) => {
        const response = { 
            confirmationId: uuidv4()
        };
    
        callback(null, response);
    });
};
