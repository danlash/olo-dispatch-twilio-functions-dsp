exports.handler = function(context, event, callback) {
    
    const driversPath = Runtime.getAssets()['Drivers.js'].path;
    const drivers = require(driversPath)(context);

    const dispatchPath = Runtime.getAssets()['Dispatch.js'].path;
    const dispatch = require(dispatchPath)(context);

    return drivers.getDriverForZip(event.pickup.postalCode)
                    .then(driver => {
                        if (!driver) return callback(null, dispatch.rejectQuote());
                        
                        return callback(null, dispatch.makeQuote(event, driver));
                    });
};