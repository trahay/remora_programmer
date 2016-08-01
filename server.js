var express = require('express');
var url=require('url');
var app = express();
var fs = require('fs');
var exec = require('child_process').execSync;
var bodyParser  = require('body-parser');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());



app.get('/', function(req, res) {
    res.render('index.ejs');
});


var Zone = function(dir, filename) {
    this._filename=filename;
    this._full_path=dir+"/"+filename;
    this._name = filename;
    this._status="OK";

    var cmd='grep "^PIN1=" '+ this._full_path+' | sed \'s/PIN1=//\'';
    this._pin1=parseInt(exec(cmd));
    if(isNaN(this._pin1)) {
	this._status = "KO";
    }

    var cmd='grep "^PIN2=" '+ this._full_path+' | sed \'s/PIN2=//\'';
    this._pin2=parseInt(exec(cmd));
    if(isNaN(this._pin2)) {
	this._status = "KO";
    }
};

function getZones(dir, files_) {
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
    var zones = getZones();
    for( var i in zones ){
	if(zones[i]._name == zone_name) {
	    return zones[i];
	}
    }
    return null;
}

function addZone(zone_name, pin1, pin2) {
    var zone = searchZone(zone_name);
    if(zone) {
	if(zone._status=="OK") {
	    console.log("La zone "+zone_name+" existe deja!");
	    return;
	} else {
	    console.log("La zone "+zone_name+" existe deja, mais est mal configurée!");
	}
    } else {
	console.log("La zone "+zone_name+" n'existe pas");
    }
}

app.post('/ajouter_zone', function(request, res){
    var zone_name=request.body.zone_name;
    var pin1=request.body.pin1;
    var pin2=request.body.pin2;

    console.log("Nouvelle zone: "+zone_name+ " - pin1="+pin1+ "- pin2="+pin2);
    addZone(zone_name, pin1, pin2);
    res.redirect('/afficher_zones');
});

app.get('/afficher_zones', function(req, res) {
    var zones=getZones();
    var nb_zones=zones.length;
    res.render('afficher_zones.ejs', {zones: zones});
});


app.use(function(req, res, next){
    var page = url.parse(req.url).pathname;
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable: "'+page+'"');
});


app.listen(8080);
