// auth.js

var auth = require('basic-auth');
var admins = {
  'Fuentas': { password: 'FuentasFTW' },
};


module.exports = function(req, res, next) {

    var user = auth(req);
    if (!user || !admins[user.name] || admins[user.name].password !== user.pass) {
	res.set('WWW-Authenticate', 'Basic realm="example"');
	if(user &&  user.name &&user.pass) {
	    console.log("Invalid connection from ["+req.connection.remoteAddress+"] login='"+user.name+"' - password='"+user.pass+"'");
	}
	return res.status(401).send();
    }
    return next();
};
