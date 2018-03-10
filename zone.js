var exec = require('child_process').execSync;
var fs = require('fs');

var exports = module.exports = {};
var progSem=require(__dirname +'/program_sem');
var progs=require(__dirname +'/program');

function print_zone(zone) {
    console.log("Zone ID: '"+zone._id+"'");
    console.log("Zone name: '"+zone._name+"'");
    console.log("Zone PIN1: '"+zone._pin1+"'");
    console.log("Zone PIN2: '"+zone._pin2+"'");
    console.log("Zone Program: '"+zone._program+"'");
}

var Zone = function(id, name, pin1, pin2, program) {
    this._id = id;
    this._name = name;
    this._pin1 = pin1;
    this._pin2 = pin2;
    this._program = program;
}

exports.getZones = function(db) {
    var zones_ =  [];

    cursor = db.collection("zones").find().each(function(err, obj) {
	if(err) throw err;
	if(obj != null) {
	    // probleme ici: la fonction est asynchrone
	    zones_.push(new Zone(obj._id,
				 obj.name,
				 obj.pin1,
				 obj.pin2,
				 obj.program));
	    console.log("on ajoute"+obj.name+" -> "+zones_.length);
	}
    });
    console.log("IL Y A "+zones_.length+" zones");
    return zones_;
}

exports.searchZone = function(db, zone_name) {
    var zones = exports.getZones(db );
    for( var i in zones ){
	print_zone(zones[i]);
	if(zones[i]._name == zone_name) {
	    return zones[i];
	}
    }
    return null;
}

exports.deleteZone = function(db, id) {
    var MongoObjectID = require("mongodb").ObjectID;
    var objToFind     = { _id: new MongoObjectID(id) };

    db.collection("zones").remove(objToFind, null, function(error, result) {
	if (error) throw error;
    });
}

exports.addZone = function(db, zone_name, pin1, pin2, program) {
    // check if parameters are filled correctly
    if(zone_name =="") {
	console.log("[addZone] zone_name='"+zone_name+"' !");
	return;
    }
    var p1=parseInt(pin1);
    var p2=parseInt(pin2);
    if(isNaN(p1) || isNaN(p2)) {
	console.log("[addZone] pin1 ou pin2 NaN!");
	return;
    }

    console.log("Creating zone "+zone_name);
    var new_zone = {name:zone_name, pin1:pin1, pin2:pin2, program:program};
    db.collection("zones").insert(new_zone, null, function(error, results) {
	if(error) throw error;
	console.log("Ajouté zone '"+zone_name+"'");
    });
}
