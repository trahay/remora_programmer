var exec = require('child_process').execSync;
var fs = require('fs');

var exports = module.exports = {};
var programs=require('./program');

var jours=["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

function getConfigField(file, field) {
    var cmd='grep "^'+field+'=" '+ file+' | sed \'s/'+field+'=//\'';
    var result = exec(cmd);
    return result.toString();
}

function printProgramSem(prog) {
    console.log("Program: "+prog._full_path);
    console.log("Program Name: "+prog._name);
    console.log("Program: '"+prog._program.join(", ")+"'");
}

function sanitize(string) {
    return string.replace(/\n/g, "").replace(/ /g, "_");
}

var ProgramSem = function(dir, filename) {
    this._filename = filename;
    this._full_path=dir+"/"+filename;

    this._status = "OK";
    this._name = getConfigField(this._full_path, "Program_Name");
    if(this._name == "") { this._status = "KO";}
    this._name= sanitize(this._name);
    this._program=["", "", "", "", "", "", ""];
    for(var i=0; i<7; i++) {
	this._program[i] = getConfigField(this._full_path, "Program_"+jours[i]);
	if(this._program[i] == "") { this._status = "KO";}
	this._program[i] = sanitize(this._program[i]);
    }
};

exports.createProgramSem = function(filename, p) {
    filename = filename.replace(/ /g, "_");
    console.log("Writing file "+filename);
    fs.writeFileSync(filename, "Program_Name="+p._name+"\n");
    for(var i=0; i<7; i++) {
	fs.appendFileSync(filename, "Program_"+jours[i]+"="+p._program[i]+"\n");
    }
}

exports.getProgramSem = function(dir, files_) {
    dir = dir || "program_sem";
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
	    var p = new ProgramSem(dir, files[i]);
	    files_.push(p);
        }
    }
    return files_;
}

exports.searchProgramSem = function(prog_name) {
    var programs = exports.getProgramSem();
    for( var i in programs ){
	if(programs[i]._name == prog_name) {
	    return programs[i];
	}
    }
    return null;
}

exports.deleteProgSem = function(prog_name) {
    var prog = exports.searchProgramSem(prog_name);
    if(prog != null) {
	console.log("rm "+prog._full_path);
	fs.unlinkSync(prog._full_path);
    }
}


exports.addProgSem = function(prog_name, program) {
    // check if parameters are filled correctly
    if(prog_name =="") {
 	console.log("prog_name='"+prog_name+"' !");
 	return;
    }

    for(var i =0; i<7; i++) {
	var p = programs.searchProgram(program[i]);
	if(! p) {
	    console.log("Le programme "+program[i]+" n'existe pas !");
	    return;
	} else {
	    console.log("Le programme "+program[i]+" existe !");
	}
    }

    // check if the program already exists
    var p = exports.searchProgramSem(prog_name);
    if(p) {
	if(p._status=="OK") {
	    console.log("Le programme "+prog_name+" existe deja!");
	}
    } else {
	p = new ProgramSem("program_sem", prog_name);
	p._name=prog_name;
	p._program=["", "", "", "", "", "", ""];
	p._status="OK";
    }

    for(var i=0; i<7; i++) {
	p._program[i]=program[i];
    }
    exports.createProgramSem("program_sem/"+prog_name, p);
}
