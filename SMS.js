const moment = require('moment');

module.exports = function(context) {
    var exports = {};

    exports.deliveryMessage = function (event) {
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

        return body;
    };

    exports.sendDeliveryMessage = function(phoneNumber, event) {
        const client = context.getTwilioClient();
        const body = exports.deliveryMessage(event);

        return client.messages.create({
            body: body,
            to: phoneNumber,
            from: context.TWILIO_PHONE_NUMBER
        });
    };

    return exports;
};