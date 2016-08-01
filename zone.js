var exec = require('child_process').execSync;
var fs = require('fs');

var exports = module.exports = {};

function getConfigField(file, field) {
    var cmd='grep "^'+field+'=" '+ file+' | sed \'s/'+field+'=//\'';
    var result = exec(cmd);
    return result;
}

var Zone = function(dir, filename) {
    this._filename=filename;
    this._full_path=dir+"/"+filename;
    this._name = filename;
    this._status="OK";

    this._name = getConfigField(this._full_path, "Zone_Name");
    this._pin1=parseInt(getConfigField(this._full_path, "PIN1"));
    if(isNaN(this._pin1)) {
	this._status = "KO";
    }
    this._pin2=parseInt(getConfigField(this._full_path, "PIN2"));
    if(isNaN(this._pin2)) {
	this._status = "KO";
    }
};

exports.getZones = function(dir, files_) {
    dir = dir || "zones";
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
	    files_.push(new Zone(dir, files[i]));
        }
    }
    return files_;
}

function searchZone(zone_name) {
    var zones = exports.getZones();
    for( var i in zones ){
	if(zones[i]._name == zone_name) {
	    return zones[i];
	}
    }
    return null;
}

exports.createZone = function(filename, zone_name, pin1, pin2) {
    filename = filename.replace(/ /g, "_");
    console.log("Writing file "+filename);;
    var ws = fs.createWriteStream(filename);
    ws.write("Zone_Name="+zone_name+"\n");
    ws.write("PIN1="+pin1+"\n");
    ws.write("PIN2="+pin2+"\n");
    ws.end();
}

exports.addZone = function(zone_name, pin1, pin2) {
    // check if parameters are filled correctly
    if(zone_name =="") {
	console.log("zone_name='"+zone_name+"' !");
	return;
    }
    var p1=parseInt(pin1);
    var p2=parseInt(pin2);
    if(isNaN(p1) || isNaN(p2)) {
	console.log("pin1 ou pin2 NaN!");
	return;
    }

    // check if the zone already exists
    var zone = searchZone(zone_name);
    if(zone) {
	if(zone._status=="OK") {
	    console.log("La zone "+zone_name+" existe deja!");
	    return;
	}
    }

    exports.createZone("zones/"+zone_name, zone_name, p1, p2);
}
