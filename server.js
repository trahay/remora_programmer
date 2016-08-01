var auth = require('./auth');
var express = require('express');
var url=require('url');
var bodyParser  = require('body-parser');
var app = express();

app.use(auth);

var zone=require('./zone');
var program=require('./program');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/', function(req, res) {
    res.render('index.ejs');
});


app.post('/ajouter_zone', function(request, res){
    var zone_name=request.body.zone_name;
    var pin1=request.body.pin1;
    var pin2=request.body.pin2;

    console.log("Nouvelle zone: "+zone_name+ " - pin1="+pin1+ "- pin2="+pin2);
    zone.addZone(zone_name, pin1, pin2);
    res.redirect('/afficher_zones');
});

app.get('/edit_zones', function(req, res) {
    var zone_name = req.query.name;
    var selected_zone = zone.searchZone(zone_name);
    console.log("name = "+selected_zone._name);
    var zones=zone.getZones();
    var nb_zones=zones.length;
    res.render('afficher_zones.ejs', {zones: zones, selected_zone:selected_zone});
});

app.get('/afficher_zones', function(req, res) {
    var zones=zone.getZones();
    var nb_zones=zones.length;
    res.render('afficher_zones.ejs', {zones: zones});
});

app.get('/afficher_programs', function(req, res) {
    var progs=program.getPrograms();
    var nb_progs=progs.length;
    res.render('afficher_programs.ejs', {progs: progs});
});


app.use(function(req, res, next){
    var page = url.parse(req.url).pathname;
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable: "'+page+'"');
});


app.listen(8080);
