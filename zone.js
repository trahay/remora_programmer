var exec = require('child_process').execSync;
var fs = require('fs');

var exports = module.exports = {};

function getConfigField(file, field) {
    var cmd='grep "^'+field+'=" '+ file+' | sed \'s/'+field+'=//\'';
//    console.log("exec("+cmd+")");
    var result = exec(cmd);
//    console.log("Result : "+result.toString());
    return result;
}

function print_zone(zone) {
    console.log("Zone name: '"+zone._name+"'");
    console.log("Zone PIN1: '"+zone._pin1+"'");
    console.log("Zone PIN2: '"+zone._pin2+"'");
    console.log("Zone Program: '"+zone._program+"'");
}

var Zone = function(dir, filename) {
    this._filename=filename;
    this._full_path=dir+"/"+filename;
    this._name = filename;
    this._status="OK";

    this._name = getConfigField(this._full_path, "Zone_Name").toString();
    this._name= this._name.replace(/\n/g, "");
    this._pin1=parseInt(getConfigField(this._full_path, "PIN1"));
    if(isNaN(this._pin1)) {
	this._status = "KO";
    }
    this._pin2=parseInt(getConfigField(this._full_path, "PIN2"));
    if(isNaN(this._pin2)) {
	this._status = "KO";
    }
    this._program = getConfigField(this._full_path, "Program").toString();
    this._program= this._program.replace(/\n/g, "");
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

exports.searchZone = function(zone_name) {
//    console.log("Searching for "+zone_name);
    var zones = exports.getZones();
    for( var i in zones ){
//	console.log("cmp '"+zones[i]._name+"', '"+zone_name+"'");
	print_zone(zones[i]);
	if(zones[i]._name == zone_name) {
//	    console.log("-> Trouve !");
	    return zones[i];
	}
    }
    return null;
}

exports.createZone = function(filename, zone_name, pin1, pin2, program) {
    filename = filename.replace(/ /g, "_");
    console.log("Writing file "+filename);;
    var ws = fs.createWriteStream(filename);
    ws.write("Zone_Name="+zone_name+"\n");
    ws.write("PIN1="+pin1+"\n");
    ws.write("PIN2="+pin2+"\n");
    ws.write("Program="+program+"\n");
    ws.end();
}

exports.deleteZone = function(zone_name) {
    var zone = exports.searchZone(zone_name);
    if(zone != null) {
	console.log("rm "+zone._full_path);
	fs.unlinkSync(zone._full_path);
    }
}

exports.addZone = function(zone_name, pin1, pin2, program) {
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

    exports.createZone("zones/"+zone_name, zone_name, p1, p2, program);
}
