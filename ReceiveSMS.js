exports.handler = function(context, event, callback) {

    const dispatchPath = Runtime.getAssets()['Dispatch.js'].path;
    const dispatch = require(dispatchPath)(context);

    const driversPath = Runtime.getAssets()['Drivers.js'].path;
    const drivers = require(driversPath)(context);

    const messageParts = event.Body.toLowerCase().split(' ');
    const command = messageParts[0];
    const phoneNumber = event.From;

    switch (command) {
        case 'drive':
            return drivers.getDriver(phoneNumber)
                            .then(driver => {
                                if (driver) return respond(`You are already driving! Your fee is $${driver.fee} and you service zip codes ${driver.zip_codes}. Send the command "Done" to stop driving.`);
                                
                                const zips = messageParts[1];
                                if (!zips) return respond('Can\'t start driving, the zip codes you service were not specified.');
                                
                                const fee = messageParts[2];
                                if (!fee) return respond('Can\'t start driving, the fee you charge was not specified.');

                                return drivers.createDriver(phoneNumber, zips, fee)
                                        .then(() => respond(`You are now driving! Send the command "Done" to stop driving.`));
                            });
        
        case 'done':
            return drivers.deleteDriver(phoneNumber)
                            .then(() => respond('You are done driving... for now!'));

        case 'pickup':
            return drivers.getDriver(phoneNumber)
                            .then(driver => {
                                if (!driver.current_delivery_id) return respond('Sorry, you are not currently driving! Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');

                                return dispatch.sendStatus(driver.current_delivery_id, 'InTransit')
                                        .then(() => respond('Delivery picked up, ok.'));
                            });

        case 'dropoff':
            return drivers.getDriver(phoneNumber)
                            .then(driver => {
                                if (!driver.current_delivery_id) return respond('Sorry, you are not currently driving! Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');

                                return dispatch.sendStatus(driver.current_delivery_id, 'Delivered')
                                        .then(() => {
                                            return drivers.setDelivery(phoneNumber, null)
                                                    .then(() => respond('Delivery dropped off, ok.'));
                                        });
                            });

        default:
            return drivers.getDriver(phoneNumber)
                            .then(driver => {
                                if (!driver) return respond('Ready to start driving for yourself? Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');

                                if (driver.current_delivery_id) return respond('You have a delivery to complete. Send the command "Pickup" after you pick up the food. Send the command "Dropoff" after you deliver it.');

                                return respond('Sorry that\'s an unknown command. Send the command "Done" to stop driving.');
                            });
    }

    function respond(message) {
        let twiml = new Twilio.twiml.MessagingResponse();
        twiml.message(message);
        return callback(null, twiml);
    }
};