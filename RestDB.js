const got = require('got');

module.exports = function(context) {
    var exports = {};

    exports.get = function (collection) {
        return got(context.RESTDB_URL + collection, {
            json: true,
            headers: { 'x-apikey': context.RESTDB_API_KEY }
        })
        .catch(err => {
            console.log('** GET ERROR **\n' + err);
            throw err;
        });
    };
    
    exports.post = function (collection, obj) {
        return got(context.RESTDB_URL + collection, {
            json: true,
            headers: { 'x-apikey': context.RESTDB_API_KEY },
            body: obj
        })
        .catch(err => {
            console.log('** POST ERROR **\n' + err);
            throw err;
        });
    };
    
    exports.delete = function (collection, id) {
        return got(context.RESTDB_URL + collection + '/' + id, {
            json: true,
            headers: { 'x-apikey': context.RESTDB_API_KEY },
            method: 'DELETE'
        })
        .catch(err => {
            console.log('** DELETE ERROR **\n' + err);
            throw err;
        });
    };
    
    exports.put = function (collection, id, obj) {
        return got(context.RESTDB_URL + collection + '/' + id, {
            json: true,
            headers: { 'x-apikey': context['RESTDB_API_KEY'] },
            method: 'PUT',
            body: obj
        })
        .catch(err => {
            console.log('** PUT ERROR **\n' + err);
            throw err;
        });
    };

    return exports;
};
