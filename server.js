var auth = require(__dirname +'/auth');
var express = require('express');
var url=require('url');
var bodyParser  = require('body-parser');
var app = express();
var util = require('util');
var path = require('path');
var fs = require('fs');

const sqlite3 = require('sqlite3').verbose();
var db_path=__dirname+'/db_chauffage.db';
let db = new sqlite3.Database(db_path, (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the SQlite database '+db_path);
});

var morgan = require('morgan');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'logs/access.log'), {flags: 'a'});
app.use(morgan('combined', {stream: accessLogStream}));


app.use(auth);

app.set('views', path.join(__dirname, '/views'));

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


function edit_prog_sem(req, res) {
    let sql=`select * from programme_semaine where id=?`;
    db.all(sql, req.query.id, (err, selected_prog) => {
	    if(err) throw err;
	    if(selected_prog.length == 0) {
		console.log("cannot find "+req.query.id);
		return afficher_program_sem(req, res);
	    } else {
		if(err) throw err;
		req.selected_prog = selected_prog[0];
		return afficher_program_sem(req, res);
	    }
    });
}

function afficher_program_sem(req, res) {
    var selected_prog=req.selected_prog;
    let sql=`select * from programme_semaine`;
    db.all(sql, [], (err, result_prog) => {
	if(err) throw err;
	let sql=`select * from programme_journee`;
	db.all(sql, [], (err, progs_jour) => {
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
    let sql_zone=`select * from zones`;
    let sql_prog_sem=`select * from programme_semaine`;
    let sql_prog_jour=`select * from programme_journee`;
    db.all(sql_zone, [], (err, result) => {
	if(err) console.log(err);
	db.all(sql_prog_sem, [], (err, programs) => {
	    if(err) console.log(err);
	    db.all(sql_prog_jour, [], (err, progs_jour) => {
		if(err) console.log(err);
		res.render('index.ejs', {zones:result,
					 programs:programs,
					 progs_jour:progs_jour});
	    });
	});
    });
});


app.post('/ajouter_zone', (req, res) => {
    if(req.body.id.length == 0) {
	// new zone
	let sql='insert into zones (name, url, program) values (?, ?, ?)';
	db.run(sql, req.body.name, req.body.url, req.body.program, (err) => {
	    if (err) return console.log(err);
	    console.log("add zone: "+req.body.name+ " - url="+req.body.url+" - program="+req.body.program);
	    console.log('saved zone to database');
	    res.redirect('/afficher_zones');
	});
    } else {
	// edit an existing zone

	let sql='update zones set name=?, url=?, program=? where id=?';
	db.run(sql, req.body.name, req.body.url, req.body.program, req.body.id, (err) => {
	    if(err) {
		console.log(err);
		return;
	    }
	    console.log("edit zone: "+req.body.name+ " - url="+req.body.url+" - program="+req.body.program);
	    console.log('saved zone to database');
	    res.redirect('/afficher_zones');
	});
    }
});

app.get('/edit_zones', (req, res) => {

    let sql='select * from zones where id=?';
    db.all(sql, req.query.id, (err, selected_zone) => {
	    if(err) throw err;
	    if(selected_zone.length == 0) {
		console.log("cannot find "+req.query.id);
	    } else {
		if(err) throw err;
		console.log(selected_zone[0]);
		let sql='select * from programme_semaine';
		db.all(sql, [], (err, programs) => {
		    if(err) throw err;

		    let sql='select * from zones';
		    db.all(sql, [], (err, result_zones) => {
			if(err) throw err;
			res.render('afficher_zones.ejs',
				   {zones: result_zones,
				    selected_zone:selected_zone[0],
				    selected_prog:"",
				    programs:programs});
		    });
		});
	    }
    });
});

app.get('/supprime_zone', (req, res) => {

    let sql = 'DELETE FROM zones where id=?';
    db.run(sql, req.query.id, (err)=> {
	if(err) throw err;
	console.log("Zone supprimée: "+req.query.id);

	res.redirect('/afficher_zones');
    });
});

app.get('/afficher_zones', (req, res) => {
    let sql='select * from zones';
    db.all(sql, [], (err, result_zones) =>{
	if(err) throw err;

	let sql='select * from programme_semaine';
	db.all(sql, [], (err, programs) =>{
	    if(err) throw err;
	    res.render('afficher_zones.ejs',
		       {zones: result_zones,
			selected_zone:"",
			selected_prog:"",
			programs:programs});
	});
    });
});

app.get('/afficher_programs', (req, res) => {
    let sql='select * from programme_journee';
    db.all(sql, [], (err, result_prog) => {
	console.log(result_prog[0]);
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
    p=[];
    var i=0;
    if(prog) {
	for(i=0; i<prog.length; i++){
	    p.push(prog[i]);
	}
    }
    for(; i<len; i++){
	p.push(0);
    }

    mode=modeToInt(mode);
    console.log("create progr from "+start+" to "+stop);
    start=new Heure(start).pos;
    stop=new Heure(stop).pos;
    console.log("->from "+start+" to "+stop);
    for(i=start; i<stop; i++)
	p[i]=mode;
    return p.join('');
}

app.post('/ajouter_prog', (req, res) => {
    if(req.body.id.length == 0) {
	// new program
	if(req.body.name.length > 0) {
	    
	    prog=createProg(req.body.heure_debut, req.body.heure_fin, req.body.mode);
	    let sql='insert into programme_journee(program, name) values(?, ?)';
	    db.run(sql, prog, req.body.name, (err) => {
		if (err) {
		    console.log("Error while running "+sql+", "+prog+", "+req.body.name);
		    console.log(err);
		    return;
		}
		console.log('saved program '+req.body.name+' to database');
		res.redirect('/afficher_programs');
	    });
	    return;
	}
    } else {
	if(req.body.name.length > 0) {

	    let sql='select * from programme_journee where id=?';
	    db.all(sql, req.body.id, (err, selected_prog) => {
		if(err) throw err;
		
		prog=createProg(req.body.heure_debut, req.body.heure_fin, req.body.mode, selected_prog[0].program);
		let sql='update programme_journee set program=?, name=? where id=?';
		db.run(sql, prog, req.body.name, req.body.id, (err) => {
		    if(err) {
			console.log(err);
		    } else {
			console.log('edit program '+req.body.name+' to database');
			console.log('saved program to database');
		    }
		    res.redirect('/edit_prog?id='+req.body.id);
		});
		
	    });
	    return;   
	}
    }
    res.redirect('/afficher_programs');
});

app.get('/supprime_prog', (req, res) => {
    let sql='delete from programme_journee where id=?';
    db.run(sql, req.query.id, (err)=> {
	if(err) throw err;
	console.log("Programme supprimée: "+req.query.id);
	res.redirect('/afficher_programs');
    });
});

app.get('/edit_prog', (req, res) => {
    let sql='select * from programme_journee where id=?';
    db.all(sql, req.query.id, (err, selected_prog) => {
	if(err) throw err;
	if(selected_prog.length == 0) {
	    console.log("cannot find "+req.query.id);
	} else {
	    if(err) throw err;
	    let sql='select * from programme_journee';
	    db.all(sql, [], (err, result_prog) =>{
		if(err) {
		    console.log(err.message);
		}
		res.render('afficher_programs.ejs',
			   {progs: result_prog,
			    selected_prog:selected_prog[0],
			    util:util});
	    });
	}
    });
});



app.post('/ajouter_prog_sem', (req, res) => {
    var name=req.body.prog_name;
    if(req.body.id.length == 0) {
	// new program
	let sql='insert into programme_semaine (name, prog_0, prog_1, prog_2, prog_3, prog_4, prog_5, prog_6) values(?, ?, ?, ?, ?, ?, ?, ?)';
	db.run(sql, req.body.prog_name,
	       req.body.prog_0,
	       req.body.prog_1,
	       req.body.prog_2,
	       req.body.prog_3,
	       req.body.prog_4,
	       req.body.prog_5,
	       req.body.prog_6, (err) => {
		   if (err) return console.log(err);
		   console.log('saved program_semaine '+req.body.prog_name+' to database');
		   res.redirect('/program_semaine');
	       });
	
    } else {
	// update
	let sql='update programme_semaine set name=?, prog_0=?, prog_1=?, prog_2=?, prog_3=?, prog_4=?, prog_5=?, prog_6=? where id=?';
	db.run(sql, name,
	       req.body.prog_0,
	       req.body.prog_1,
	       req.body.prog_2,
	       req.body.prog_3,
	       req.body.prog_4,
	       req.body.prog_5,
	       req.body.prog_6,
	       req.body.id, (err) => {
		   if(err) {
		       console.log(err.message);
		   } else {
		       console.log("edit programme_semaine: "+name+": "+req.body);
		       console.log('saved zone to database');
		   }
		res.redirect('/program_semaine');
	       });
    }
});

app.get('/supprime_prog_sem', (req, res) => {
    let sql='delete from programme_semaine where id=?';
    db.run(sql, req.query.id, (err)=> {
	if(err) throw err;
	console.log("Programme semaine supprimé: "+req.query.id);
	return afficher_program_sem(req, res);
    });
});

app.get('/edit_prog_sem', edit_prog_sem);

app.get('/program_semaine', (req, res) => {
    let sql='select * from programme_semaine';
    db.all(sql, [], (err, result_prog) => {
	if(err) throw err;
	let sql='select * from programme_journee';
	db.all(sql, [], (err, progs_jour) => {
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
