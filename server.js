var auth = require(__dirname +'/auth');
var express = require('express');
var url=require('url');
var bodyParser  = require('body-parser');
var app = express();
var util = require('util');
var path = require('path');
var fs = require('fs');


var morgan = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));


app.use(auth);

app.set('views', path.join(__dirname, '/views'));

var zone=require(__dirname +'/zone');
var program=require(__dirname +'/program');
var program_sem=require(__dirname +'/program_sem');

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));

var log_file = fs.createWriteStream(__dirname + '/logs/server.log', {flags : 'a'});
var log_stdout = process.stdout;

console.log = function(text) { //
    var d=new Date().toISOString().
	replace(/T/, ' ').      // replace T with a space
	replace(/\..+/, '')     // delete the dot and everything after

    log_file.write(d+"\t"+util.format(text) + '\n');
    log_stdout.write(d+"\t"+util.format(text) + '\n');
};

function sanitize(string) {
    return string.replace(/ /g, "_");
}


function index(req, res) {
    var d=new Date().toISOString().
	replace(/T/, ' ').      // replace T with a space
	replace(/\..+/, '')     // delete the dot and everything after

    var zones=zone.getZones();
    res.render('index.ejs', {today:d, zones:zones});
}

function ajouter_zone(req, res){
    var zone_name=sanitize(req.body.zone_name);
    var pin1=req.body.pin1;
    var pin2=req.body.pin2;
    var program=req.body.program;

    console.log("add zone: "+zone_name+ " - pin1="+pin1+ " - pin2="+pin2+" - program="+program);
    zone.addZone(zone_name, pin1, pin2, program);
    req.selected_zone=zone;
    return afficher_zones(req, res);
}

function supprime_zone(req, res) {
    var zone_name = sanitize(req.query.name);
    console.log("delete zone = "+zone_name);
    zone.deleteZone(zone_name);
    return afficher_zones(req, res);
}

function edit_zones(req, res) {
    var zone_name = sanitize(req.query.name);
    req.selected_zone = zone.searchZone(zone_name);
    console.log("name = "+req.selected_zone._name);
    return afficher_zones(req, res);
}

function afficher_zones(req, res) {
    var zones=zone.getZones();
    var nb_zones=zones.length;

    var selected_prog=req.selected_prog;
    var programs=program_sem.getProgramSem();
    var nb_programs=programs.length;
    res.render('afficher_zones.ejs',
	       {zones: zones,
		selected_zone:req.selected_zone,
		selected_prog:req.selected_prog,
		programs:programs,
		nb_programs:nb_programs});
}

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
    if(req.selected_prog == null) {
	console.log("Cannot find program '"+prog_name+"'");
    } else {
	console.log("Edit Program name = "+req.selected_prog._name);
    }
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

function afficher_logs(req, res) {
    res.render('logs.ejs');
}

app.get('/', index);
app.get('/index', index);

app.post('/ajouter_zone', ajouter_zone);
app.get('/supprime_zone', supprime_zone);
app.get('/edit_zones', edit_zones);
app.get('/afficher_zones', afficher_zones);

app.post('/ajouter_prog', ajouter_prog);
app.get('/supprime_prog', supprime_prog);
app.get('/edit_prog', edit_prog);
app.get('/afficher_programs', afficher_programs);

app.post('/ajouter_prog_sem', ajouter_prog_sem);
app.get('/supprime_prog_sem', supprime_prog_sem);
app.get('/edit_prog_sem', edit_prog_sem);
app.get('/program_semaine', afficher_program_sem);

app.get('/logs', afficher_logs);

app.use(function(req, res, next){
    var page = url.parse(req.url).pathname;
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable: "'+page+'"');
});

console.log("");
console.log("---------------");
console.log("Server starting");

app.listen(8080);
