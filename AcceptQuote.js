const uuidv4 = require('uuid/v4');
const moment = require('moment');
const got = require('got');

exports.handler = function(context, event, callback) {

function dbGet(collection) {
    return got(context['RESTDB_URL'] + collection, {
        json: true,
        headers: { 'x-apikey': context['RESTDB_API_KEY'] }
    })
    .catch(err => {
        console.log('** GET ERROR **\n' + err);
        callback(err);
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

function getDrivers() {
    return dbGet('drivers');
}

function getDriver(phoneNumber) {
    return dbGet('drivers').then(response => {
        return response.body.find(driver => driver.phone_number === phoneNumber);
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

function makeMessage() {
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
}

    
    return getDrivers()
        .then(response => {
            const drivers = response.body;
            const driver = drivers.find(d => d.zip_codes.split(',').some(z => z === event.pickup.postalCode));
            if (!driver) return callback('No drivers available');

            const deliveryId = event.deliveryId;
            return setDelivery(driver.phone_number, deliveryId)
                    .then(() => {
                        const client = context.getTwilioClient();
                        const body = makeMessage();

                        client.messages.create({
                            body: body,
                            to: driver.phone_number,
                            from: context.TWILIO_PHONE_NUMBER
                        })
                        .then(() => {
                            const response = { 
                                confirmationId: uuidv4()
                            };
                        
                            callback(null, response);
                        })
                        .catch(err => {
                            console.log('ERR ' + err);
                            return callback(err);
                        });
                    });
        });
};