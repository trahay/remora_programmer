var exec = require('child_process').execSync;
var fs = require('fs');

var exports = module.exports = {};


function getConfigField(file, field) {
    var cmd='grep "^'+field+'=" '+ file+' | sed \'s/'+field+'=//\'';
    var result = exec(cmd);
    return result.toString();
}

function printProgram(prog) {
    console.log("Program: "+prog._full_path);
    console.log("Program Name: "+prog._name);
    console.log("Program: '"+prog._program.join("")+"'");
}

var Program = function(dir, filename) {
    this._filename = filename;
    this._full_path=dir+"/"+filename;

    this._status = "OK";
    this._name = getConfigField(this._full_path, "Program_Name");
    if(this._name == "") { this._status = "KO";}
    this._name= this._name.replace(/\n/g, "");
    this._program = getConfigField(this._full_path, "Program");
    if(this._program == "") { this._status = "KO";}
    this._program=this._program.split('');
};

exports.createProgram = function(filename, p) {
    filename = filename.replace(/ /g, "_");
    console.log("Writing file "+filename);;
    fs.writeFileSync(filename, "Program_Name="+p._name+"\nProgram="+p._program.join("")+"\n");
}

exports.getPrograms = function(dir, files_) {
    dir = dir || "programs";
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
	    var p = new Program(dir, files[i]);
	    files_.push(p);
        }
    }
    return files_;
}

exports.searchProgram = function(prog_name) {
    var programs = exports.getPrograms();
    for( var i in programs ){
	if(programs[i]._name == prog_name) {
	    return programs[i];
	}
    }
    return null;
}

exports.deleteProg = function(prog_name) {
    var prog = exports.searchProgram(prog_name);
    if(prog != null) {
	console.log("rm "+prog._full_path);
	fs.unlinkSync(prog._full_path);
    }
}

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

exports.addProg = function(prog_name, heure_debut, heure_fin, mode) {
    // check if parameters are filled correctly
    if(prog_name =="") {
 	console.log("prog_name='"+prog_name+"' !");
 	return;
    }
    var h_debut=new Heure(heure_debut);
    var h_fin=new Heure(heure_fin);
    if((!h_debut) || (!h_fin)) {
 	console.log("Heure_debut ou Heure_fin NaN!");
 	return;
    }

    if(mode <0 || mode >3) {
	console.log("Mode "+mode+" incorrect");
	return;
    }
    // check if the program already exists
    var p = exports.searchProgram(prog_name);
    if(p) {
	if(p._status=="OK") {
	    console.log("Le programme "+prog_name+" existe deja!");
	}
    } else {
	p = new Program("programs", prog_name);
	p._name=prog_name;
	p._program=new Array(24);
	for(var i=0; i<24*4;i++) {
	    p._program[i]="0";
	}

	p._status="OK";
    }

    if (mode == "Arret") {
	m = 0;
    } else if (mode == "Hors-gel") {
	m = 1;
    } else if(mode=="Eco") {
	m = 2;
    } else if(mode=="Confort") {
	m = 3;
    } else {
	console.log("Mode incorrect: '"+mode+"'");
	return;
    }
    for(var i=h_debut.pos; i<h_fin.pos; i++) {
	p._program[i]=m;
    }
    exports.createProgram("programs/"+prog_name, p);
}


// exports.addZone = function(zone_name, pin1, pin2) {
//     // check if parameters are filled correctly
//     if(zone_name =="") {
// 	console.log("zone_name='"+zone_name+"' !");
// 	return;
//     }
//     var p1=parseInt(pin1);
//     var p2=parseInt(pin2);
//     if(isNaN(p1) || isNaN(p2)) {
// 	console.log("pin1 ou pin2 NaN!");
// 	return;
//     }
// 
//     // check if the zone already exists
//     var zone = searchZone(zone_name);
//     if(zone) {
// 	if(zone._status=="OK") {
// 	    console.log("La zone "+zone_name+" existe deja!");
// 	    return;
// 	}
//     }
// 
//     exports.createZone("zones/"+zone_name, zone_name, p1, p2);
// }
