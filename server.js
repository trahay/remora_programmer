var auth = require('./auth');
var express = require('express');
var url=require('url');
var bodyParser  = require('body-parser');
var app = express();
var util = require('util');

app.use(auth);

var zone=require('./zone');
var program=require('./program');
var program_sem=require('./program_sem');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


app.get('/', function(req, res) {
    res.render('index.ejs');
});


function sanitize(string) {
    return string.replace(/ /g, "_");
}


app.post('/ajouter_zone', function(request, res){
    var zone_name=sanitize(request.body.zone_name);
    var pin1=request.body.pin1;
    var pin2=request.body.pin2;

    console.log("Nouvelle zone: "+zone_name+ " - pin1="+pin1+ "- pin2="+pin2);
    zone.addZone(zone_name, pin1, pin2);
    res.redirect('/afficher_zones');
});

app.get('/supprime_zone', function(req, res) {
    var zone_name = sanitize(req.query.name);
    console.log("delete zone = "+zone_name);
    zone.deleteZone(zone_name);

    res.redirect('/afficher_zones');
});

app.get('/edit_zones', function(req, res) {
    var zone_name = sanitize(req.query.name);
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

function ajouter_prog(req, res){
    var prog_name=sanitize(req.body.prog_name);
    var heure_debut=req.body.heure_debut;
    var heure_fin=req.body.heure_fin;
    var mode=req.body.mode;
    program.addProg(prog_name, heure_debut, heure_fin, mode);
    req.selected_prog = program.searchProgram(prog_name);
    return afficher_programs(req, res);
}


function supprime_prog(req, res) {
    var prog_name = sanitize(req.query.name);
    console.log("delete prog = "+prog_name);
    program.deleteProg(prog_name);

    return afficher_programs(req, res);
}

function edit_prog(req, res) {
    var prog_name = sanitize(req.query.name);
    req.selected_prog = program.searchProgram(prog_name);
    if(! req.selected_prog) {
	console.log("Cannot find program '"+prog_name+"'");
    }
    console.log("Edit Program name = "+req.selected_prog._name);
    return afficher_programs(req, res);
}

function afficher_programs(req, res) {
    var selected_prog=req.selected_prog;
    var progs=program.getPrograms();
    var nb_progs=progs.length;
    res.render('afficher_programs.ejs', {progs: progs, selected_prog:selected_prog, util:util});
 }


function ajouter_prog_sem(req, res){
    var prog_name=sanitize(req.body.prog_name);
    console.log("new prog: "+prog_name);
    var prog = [req.body.lundi,
		req.body.mardi,
		req.body.mercredi,
		req.body.jeudi,
		req.body.vendredi,
		req.body.samedi,
		req.body.dimanche];
    program_sem.addProgSem(prog_name, prog);
    req.selected_prog = program_sem.searchProgramSem(prog_name);
    return afficher_program_sem(req, res);
}


function supprime_prog_sem(req, res) {

    var prog_name = sanitize(req.query.name);
    console.log("delete prog = "+prog_name);
    program_sem.deleteProgSem(prog_name);

    return afficher_program_sem(req, res);
}

function edit_prog_sem(req, res) {

    var prog_name = sanitize(req.query.name);
    req.selected_prog = program_sem.searchProgramSem(prog_name);
    if(! req.selected_prog) {
	console.log("Cannot find program '"+prog_name+"'");
    }
    console.log("Edit Program name = "+req.selected_prog._name);

    return afficher_program_sem(req, res);
}

function afficher_program_sem(req, res) {
    var selected_prog=req.selected_prog;
    var progs=program_sem.getProgramSem();
    var nb_progs=progs.length;

    var progs_jour=program.getPrograms();
    var nb_progs_jour=progs_jour.length;

    res.render('afficher_program_sem.ejs', {progs: progs, selected_prog:selected_prog, util:util, progs_jour:progs_jour, nb_progs_jour:nb_progs_jour});
}

app.post('/ajouter_prog', ajouter_prog);
app.get('/supprime_prog', supprime_prog);
app.get('/edit_prog', edit_prog);
app.get('/afficher_programs', afficher_programs);

app.post('/ajouter_prog_sem', ajouter_prog_sem);
app.get('/supprime_prog_sem', supprime_prog_sem);
app.get('/edit_prog_sem', edit_prog_sem);
app.get('/program_semaine', afficher_program_sem);

app.use(function(req, res, next){
    var page = url.parse(req.url).pathname;
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable: "'+page+'"');
});


app.listen(8080);
