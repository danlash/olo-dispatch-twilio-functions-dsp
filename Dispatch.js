const got = require('got');
const uuidv4 = require('uuid/v4');
const moment = require('moment');

module.exports = function(context) {
    var exports = {};

    exports.sendStatus = function(deliveryId, status) {

        return got(`${context.DISPATCH_URL}/deliveries/${deliveryId}/status`, {
            json: true,
            headers: { Authorization: 'Bearer ' + context.DISPATCH_API_KEY },
            body: { status }
        })
        .catch(function(err){
            console.log('*** DISPATCH ERROR ***\n'+err);
            throw err;
        });

    };

    exports.rejectQuote = function() {
        return { isAvailable: false };
    };

    exports.acceptQuote = function() {
        return { confirmationId: uuidv4() }; 
    };

    exports.makeQuote = function makeQuote(event, driver) {
        const fee = driver.fee;
    
        let estimatedPickupTime = null, 
            estimatedDropoffTime = null;
    
        if (event.pickupTime) {
            const requestedPickupTime = moment(event.pickupTime, moment.ISO_8601);
            estimatedPickupTime = requestedPickupTime.clone().add(context.PICKUP_MINUTES, 'minutes');
            estimatedDropoffTime = estimatedPickupTime.clone().add(context.TRANSIT_MINUTES, 'minutes');
        } else {
            const requestedDropoffTime = moment(event.dropoffTime, moment.ISO_8601);
            estimatedPickupTime = requestedDropoffTime.clone().subtract(context.TRANSIT_MINUTES, 'minutes');
            estimatedDropoffTime = requestedDropoffTime.clone();
        }
    
        const id = uuidv4();
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
    };

    return exports;
};
