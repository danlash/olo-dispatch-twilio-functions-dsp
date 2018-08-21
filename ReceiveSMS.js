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
                        if (driver) return respond(`Already driving! Fee:${driver.fee} Zip Codes:${driver.zip_codes}`);
                        
                        const zips = messageParts[1];
                        if (!zips) return respond('Zip codes not specified.');
                        
                        const fee = messageParts[2];
                        if (!fee) return respond('Fee not specified.');

                        return createDriver(phoneNumber, zips, fee)
                                .then(() => respond(`Driving!`));
                    });
        break;
        
        case 'done':
            return deleteDriver(phoneNumber)
                    .then(() => respond('Done!'));
        break;

        case 'pickup':
            return getDriver(phoneNumber)
                    .then(driver => {
                        if (!driver.current_delivery_id) return respond('Not currently delivering!');

                        return sendUpdate(driver.current_delivery_id, 'InTransit')
                                .then(() => respond('Ok.'));
                    });
        break;

        case 'dropoff':
            return getDriver(phoneNumber)
                    .then(driver => {
                        if (!driver.current_delivery_id) return respond('Not currently delivering!');

                        return sendUpdate(driver.current_delivery_id, 'Delivered')
                                .then(() => {
                                    return setDelivery(phoneNumber, null)
                                            .then(() => respond('Ok.'));
                                });
                    });
        break;
        
        default:
            return respond('Command not found.');
    }
};