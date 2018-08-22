const moment = require('moment');
const _ = require('lodash');

exports.handler = function(context, event, callback) {
    
    const id = _.uniqueId('foo-');
    const now = moment();
    const pickupTime = now.clone().add(context.PICKUP_MINUTES, 'minutes');
    const dropoffTime = pickupTime.clone().add(context.TRANSIT_MINUTES, 'minutes');
    const expireTime = now.clone().add(5, 'minutes');
    
    const response = {
        isAvailable: true,
        quoteId: id,
        fee: context.FEE,
        estimatedPickupTime: pickupTime.toISOString(),
        estimatedDropoffTime: dropoffTime.toISOString(),
        expires: expireTime.toISOString()
    };

    callback(null, response);
};