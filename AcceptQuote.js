exports.handler = function(context, event, callback) {

    const driversPath = Runtime.getAssets()['Drivers.js'].path;
    const drivers = require(driversPath)(context);

    const smsPath = Runtime.getAssets()['SMS.js'].path;
    const sms = require(smsPath)(context);

    const dispatchPath = Runtime.getAssets()['Dispatch.js'].path;
    const dispatch = require(dispatchPath)(context);

    return drivers.getDriverForZip(event.pickup.postalCode)
                    .then(driver => {
                        if (!driver) return callback('No drivers available.');

                        const deliveryId = event.deliveryId;

                        return drivers.setDelivery(driver.phone_number, deliveryId)
                                        .then(() => sms.sendDeliveryMessage(driver.phone_number, event))
                                        .then(() => dispatch.acceptQuote())
                                        .then((accept) => callback(null, accept));
                    });
};