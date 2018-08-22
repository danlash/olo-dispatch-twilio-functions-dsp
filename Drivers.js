const got = require('got');

module.exports = function(context) {
    const exports = {};

    const restDBPath = Runtime.getAssets()['RestDB.js'].path;
    const restDB = require(restDBPath)(context);

    exports.getDrivers = function() {
        return restDB.get('drivers')
                        .then(response => response.body);
    };

    exports.getDriver = function (phoneNumber) {
        return exports.getDrivers()
                        .then(drivers => {
                            return drivers.find(driver => driver.phone_number === phoneNumber);
                        });
    };

    exports.setDelivery = function (phoneNumber, deliveryId) {
        return exports.getDriver(phoneNumber)
                        .then(driver => {
                            return restDB.put('drivers', driver._id, {
                                current_delivery_id: deliveryId
                            });
                        });
    };

    exports.getDriverForZip = function(pickupZipCode) {
        return exports.getDrivers()
                        .then(drivers => {
                            return drivers.find(driver => {
                                
                                if (driver.current_delivery_id) return null;

                                const zips = driver.zip_codes.split(',');
                                return zips.some(zip => zip === pickupZipCode);
                            });
                        });
    };

    exports.createDriver = function (phoneNumber, zipCodes, fee) {
        return restDB.post('drivers', {
            phone_number: phoneNumber,
            zip_codes: zipCodes,
            fee: fee
        });
    };

    exports.deleteDriver = function (phoneNumber) {
        return exports.getDriver(phoneNumber)
                        .then(driver => {
                            if (!driver) return;
                            return restDB.delete('drivers', driver._id);
                        });
    };
    
    
    return exports;
};
