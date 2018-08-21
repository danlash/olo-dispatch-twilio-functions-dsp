const moment = require('moment');
const _ = require('lodash');
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

function getDrivers() {
    return dbGet('drivers');
}

function makeQuote(fee) {

    let estimatedPickupTime = null, estimatedDropoffTime = null;

    if (event.pickupTime) {
        const requestedPickupTime = moment(event.pickupTime, moment.ISO_8601);
        estimatedPickupTime = requestedPickupTime.clone().add(context.PICKUP_MINUTES, 'minutes');
        estimatedDropoffTime = estimatedPickupTime.clone().add(context.TRANSIT_MINUTES, 'minutes');
    } else {
        const requestedDropoffTime = moment(event.dropoffTime, moment.ISO_8601);
        estimatedPickupTime = requestedDropoffTime.clone().subtract(context.TRANSIT_MINUTES, 'minutes');
        estimatedDropoffTime = requestedDropoffTime.clone();
    }

    const id = _.uniqueId('foo-');
    const now = moment();
    const expireTime = now.clone().add(5, 'minutes');
    
    const quote = {
        isAvailable: true,
        quoteId: id,
        fee: fee,
        estimatedPickupTime: estimatedPickupTime.toISOString(),
        estimatedDropoffTime: estimatedDropoffTime.toISOString(),
        expires: expireTime.toISOString()
    };

    return quote;
}
    
    return getDrivers()
        .then(response => {
            const drivers = response.body;
            const driver = drivers.find(d => d.zip_codes.split(',').some(z => z === event.pickup.postalCode));
            if (driver) {
                const quote = makeQuote(driver.fee);
                callback(null, quote);
            } else {
                callback(null, { isAvailable: false });
            }
        });
};