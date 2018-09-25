var auth = require(__dirname +'/auth');
var express = require('express');
var url=require('url');
var bodyParser  = require('body-parser');
var app = express();
var util = require('util');
var path = require('path');
var fs = require('fs');
var db = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

db.connect("mongodb://localhost/", function(error, database) {
    if (error) return funcCallback(error);
    db=database.db("chauffage");

    console.log("Connecté à la base de données 'chauffage'");
});;

var morgan = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));


app.use(auth);

app.set('views', path.join(__dirname, '/views'));


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

    db.collection("programme_semaine").findOne(
	{ "_id":  ObjectId(req.query.id) },
	(err, selected_prog) => {
	    if(err) throw err;
	    if(selected_prog == null) {
		console.log("cannot find "+req.query.id);
		return afficher_program_sem(req, res);
	    } else {
		if(err) throw err;
		req.selected_prog = selected_prog;
		return afficher_program_sem(req, res);
	    }
	});

}

function afficher_program_sem(req, res) {
    var selected_prog=req.selected_prog;
    db.collection("programme_semaine").find().toArray((err, result_prog) => {
	db.collection("programme_journee").find().toArray((err, progs_jour) => {
	    if(err) throw err;
	    console.log(selected_prog);
	    res.render('afficher_program_sem.ejs',
		   {progs: result_prog,
		    selected_prog:selected_prog,
		    progs_jour:progs_jour});
	});
    });
}

function afficher_logs(req, res) {
    res.render('logs.ejs');
}

app.get('/', (req, res) => {
    var d=new Date().toISOString().
	replace(/T/, ' ').      // replace T with a space
	replace(/\..+/, '')     // delete the dot and everything after

    db.collection("zones").find().toArray((err, result) =>{
	if(err) console.log(err);
	res.render('index.ejs', {today:d, zones:result});
    });
});


app.post('/ajouter_zone', (req, res) => {
    if(req.body.id.length == 0) {
	// new zone
	db.collection("zones").save(
	    {
		"name":req.body.name,
		"pin1":req.body.pin1,
		"pin2":req.body.pin2
	    }, (err, results) => {
		if (err) return console.log(err);
		console.log("add zone: "+req.body.name+ " - pin1="+req.body.pin1+ " - pin2="+req.body.pin2+" - program="+req.body.program);
		console.log('saved zone to database');
		res.redirect('/afficher_zones');
	    });
    } else {
	// edit an existing zone

	db.collection("zones").update(
	    {"_id": ObjectId(req.body.id)},
	    {
		"name":req.body.name,
		"pin1": req.body.pin1,
		"pin2": req.body.pin2,
	    })
	    .then((success) => {
		console.log("edit zone: "+req.body.name+ " - pin1="+req.body.pin1+ " - pin2="+req.body.pin2+" - program="+req.body.program);
		console.log('saved zone to database');
		res.redirect('/afficher_zones');
	    })
	    .catch((error) => {
		console.log(error);
	    });
    }
});

app.get('/edit_zones', (req, res) => {

    db.collection("zones").findOne(
	{ "_id":  ObjectId(req.query.id) },
	(err, selected_zone) => {
	    if(err) throw err;
	    if(selected_zone == null) {
		console.log("cannot find "+req.query.id);
	    } else {
		if(err) throw err;
		console.log(selected_zone);
		db.collection("zones").find().toArray((err, result_zones) =>{
		    res.render('afficher_zones.ejs',
			       {zones: result_zones,
				selected_zone:selected_zone,
				selected_prog:"",
				programs:"",
				nb_programs:""});
		});
	    }
	});
});

app.get('/supprime_zone', (req, res) => {
    db.collection("zones").remove(
	{ "_id":  ObjectId(req.query.id) },
	(err, document) => {
	    if(err) throw err;
	    console.log("Zone supprimée: "+req.query.id);

	    res.redirect('/afficher_zones');
	});

});

app.get('/afficher_zones', (req, res) => {

    db.collection("zones").find().toArray((err, result_zones) =>{
	res.render('afficher_zones.ejs',
	       {zones: result_zones,
		selected_zone:"",
		selected_prog:"",
		programs:"",
		nb_programs:""});
    });
});

app.get('/afficher_programs', (req, res) => {
    db.collection("programme_journee").find().toArray((err, result_prog) => {
	res.render('afficher_programs.ejs',
		   {progs: result_prog,
		    selected_prog:"",
		    util:util});

    });
});

function Heure(heure) {
    var array = heure.toString().match("([0-9][0-9]?):([0-9][0-9]?)");
    if(! array){
	console.log("Heure '"+heure+"' incorrecte");
	return null;
    }

    this.h=parseInt(array[1]);
    this.m=parseInt(array[2]);

    if(this.h<0 || this.h>23) {
	// special processing for 24:00
	if(this.m != 0 || this.h != 24) {
	    return null;
	}
    }
    if(this.m<0 || this.m>59) {
	return null;
    }
    this.pos=parseInt(this.h*4+(this.m/15));
}

function modeToInt(mode) {
    if (mode == "Arret") {
	return 0;
    } else if (mode == "Hors-gel") {
	return 1;
    } else if(mode=="Eco") {
	return 2;
    } else if(mode=="Confort") {
	return 3;
    }
}

function createProg(start, stop, mode, prog) {
    var len = 24*4;
    if(! prog) {
	prog = [];
	for(i=0; i<len; i++){
	    prog.push(0);
	}
    }
    mode=modeToInt(mode);
    console.log("create progr from "+start+" to "+stop);
    start=new Heure(start).pos;
    stop=new Heure(stop).pos;
    console.log("->from "+start+" to "+stop);
    for(i=start; i<stop; i++)
	prog[i]=mode;
    return prog;
}

app.post('/ajouter_prog', (req, res) => {
    if(req.body.id.length == 0) {
	// new program
	prog=createProg(req.body.heure_debut, req.body.heure_fin, req.body.mode);
	db.collection("programme_journee").save(
	    {
		"program":prog,
		"name":req.body.name
	    }
	    , (err, results) => {
	    if (err) return console.log(err);
	    console.log('saved program '+req.body.name+' to database');
	    res.redirect('/afficher_programs');
	    });
    } else {
	db.collection("programme_journee").findOne(
	    { "_id":  ObjectId(req.body.id) },
	    (err, selected_prog) => {
		if(err) throw err;

		prog=createProg(req.body.heure_debut, req.body.heure_fin, req.body.mode, selected_prog.program);
		db.collection("programme_journee").update(
		    {"_id": ObjectId(req.body.id)},
		    {
			"program":prog,
			"name":req.body.name
		    })
		    .then((success) => {
			console.log('edit program '+req.body.name+' to database');
			console.log('saved program to database');
			res.redirect('/edit_prog?id='+req.body.id);
		    })
		    .catch((error) => {
			console.log(error);
		    });

	    });

    }
});

app.get('/supprime_prog', (req, res) => {
    db.collection("programme_journee").remove(
	{ "_id":  ObjectId(req.query.id) },
	(err, document) => {
	    if(err) throw err;
	    console.log("Programme supprimée: "+req.query.id);

	    res.redirect('/afficher_programs');
	});
});

app.get('/edit_prog', (req, res) => {

    db.collection("programme_journee").findOne(
	{ "_id":  ObjectId(req.query.id) },
	(err, selected_prog) => {
	    if(err) throw err;
	    if(selected_prog == null) {
		console.log("cannot find "+req.query.id);
	    } else {
		if(err) throw err;
		db.collection("programme_journee").find().toArray((err, result_prog) =>{

		    res.render('afficher_programs.ejs',
			       {progs: result_prog,
				selected_prog:selected_prog,
				util:util});
		});
	    }
	});

});



app.post('/ajouter_prog_sem', (req, res) => {
    var name=req.body.prog_name;
    var program=[];
    program[0]=req.body.prog_0;
    program[1]=req.body.prog_1;
    program[2]=req.body.prog_2;
    program[3]=req.body.prog_3;
    program[4]=req.body.prog_4;
    program[5]=req.body.prog_5;
    program[6]=req.body.prog_6;

    if(req.body.id.length == 0) {
	// new program
	db.collection("programme_semaine").save(
	    {
		"name":req.body.prog_name,
		"program":program,
	    }, (err, results) => {
		if (err) return console.log(err);
		console.log('saved program_semaine '+req.body.prog_name+' to database');
		res.redirect('/program_semaine');
	    });
	
    } else {
	// update

	db.collection("programme_semaine").update(
	    {"_id": ObjectId(req.body.id)},
	    {
		"name":name,
		"program":program
	    })
	    .then((success) => {
		console.log("edit programme_semaine: "+name+": "+req.body);
		console.log('saved zone to database');
		res.redirect('/program_semaine');
	    })
	    .catch((error) => {
		console.log(error);
	    });

    }
});

app.get('/supprime_prog_sem', supprime_prog_sem);
app.get('/edit_prog_sem', edit_prog_sem);

app.get('/program_semaine', (req, res) => {
    db.collection("programme_semaine").find().toArray((err, result_prog) => {
	db.collection("programme_journee").find().toArray((err, progs_jour) => {
	    if(err) throw err;
	    res.render('afficher_program_sem.ejs',
		   {progs: result_prog,
		    selected_prog:"",
		    progs_jour:progs_jour});
	});
    });
});


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
