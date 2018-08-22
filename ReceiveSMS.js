const got = require('got');

exports.handler = function(context, event, callback) {

function dbGet(collection) {
    return got(context.RESTDB_URL + collection, {
        json: true,
        headers: { 'x-apikey': context.RESTDB_API_KEY }
    })
    .catch(err => {
        console.log('** GET ERROR **\n' + err);
        callback(err);
    });
}

function dbPost(collection, obj) {
    return got(context.RESTDB_URL + collection, {
        json: true,
        headers: { 'x-apikey': context.RESTDB_API_KEY },
        body: obj
    })
    .catch(err => {
        console.log('** POST ERROR **\n' + err);
    });
}

function dbDelete(collection, id) {
    return got(context.RESTDB_URL + collection + '/' + id, {
        json: true,
        headers: { 'x-apikey': context.RESTDB_API_KEY },
        method: 'DELETE'
    })
    .catch(err => {
        console.log('** DELETE ERROR **\n' + err);
    });
}

function dbPut(collection, obj) {
    return got(context['RESTDB_URL'] + collection, {
        json: true,
        headers: { 'x-apikey': context['RESTDB_API_KEY'] },
        method: 'PUT',
        body: obj
    })
    .catch(err => {
        console.log('** PUT ERROR **\n' + err);
        callback(err);
    });
}

function getDriver(phoneNumber) {
    return dbGet('drivers').then(response => {
        return response.body.find(driver => driver.phone_number === phoneNumber);
    });
}

function createDriver(phoneNumber, zipCodes, fee) {
    return dbPost('drivers', {
        phone_number: phoneNumber,
        zip_codes: zipCodes,
        fee: fee
    });
}

function deleteDriver(phoneNumber) {
    return getDriver(phoneNumber)
            .then(driver => {
                if (!driver) return;
                dbDelete('drivers', driver._id);
            });
}

function setDelivery(phoneNumber, deliveryId) {
    return getDriver(phoneNumber)
            .then(driver => {
                return dbPut('drivers/' + driver._id, {
                    current_delivery_id: deliveryId
                });
            });
}

function sendUpdate(deliveryId, status) {
    return got(`${context.DISPATCH_URL}/deliveries/${deliveryId}/status`, {
        json: true,
        headers: { Authorization: 'Bearer ' + context.DISPATCH_API_KEY },
        body: {
            status
        }
    })
}

function respond(message) {
    let twiml = new Twilio.twiml.MessagingResponse();
    twiml.message(message);
    return callback(null, twiml);
}

    const messageParts = event.Body.toLowerCase().split(' ');
    const command = messageParts[0];
    const phoneNumber = event.From;

    switch (command) {
        case 'drive':
            return getDriver(phoneNumber)
                    .then(driver => {
                        if (driver) return respond(`You are already driving! Your fee is $${driver.fee} and you service zip codes ${driver.zip_codes}. Send the command "Done" to stop driving.`);
                        
                        const zips = messageParts[1];
                        if (!zips) return respond('Can\'t start driving, the zip codes you service were not specified.');
                        
                        const fee = messageParts[2];
                        if (!fee) return respond('Can\'t start driving, the fee you charge was not specified.');

                        return createDriver(phoneNumber, zips, fee)
                                .then(() => respond(`You are now driving! Send the command "Done" to stop driving.`));
                    });
        break;
        
        case 'done':
            return deleteDriver(phoneNumber)
                    .then(() => respond('You are done driving... for now!'));
        break;

        case 'pickup':
            return getDriver(phoneNumber)
                    .then(driver => {
                        if (!driver.current_delivery_id) return respond('Sorry, you are not currently driving! Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');

                        return sendUpdate(driver.current_delivery_id, 'InTransit')
                                .then(() => respond('Ok.'));
                    });
        break;

        case 'dropoff':
            return getDriver(phoneNumber)
                    .then(driver => {
                        if (!driver.current_delivery_id) return respond('Sorry, you are not currently driving! Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');

                        return sendUpdate(driver.current_delivery_id, 'Delivered')
                                .then(() => {
                                    return setDelivery(phoneNumber, null)
                                            .then(() => respond('Ok.'));
                                });
                    });
        break;
        
        default:
            return respond('Ready to start driving for yourself? Send the command\n"Drive  <zip>,<zip>  <fee>"\nto start driving.');
    }
};