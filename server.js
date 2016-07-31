var express = require('express');
var url=require('url');
var app = express();
var fs = require('fs');

app.get('/', function(req, res) {
    res.render('index.ejs');
});


function getFiles (dir, files_){
    files_ = files_ || [];
    var files = fs.readdirSync(dir);
    for (var i in files){
        var name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(files[i]);
        }
    }
    return files_;
}

app.get('/afficher_zones', function(req, res) {
    var zones=getFiles("zones");
    for (var i in zones) {
	console.log(zones[i]);
    }
    var nb_zones=zones.length;
    console.log("Il y a "+nb_zones+" zones");
    res.render('afficher_zones.ejs', {zones: zones});
});


app.use(function(req, res, next){
    var page = url.parse(req.url).pathname;
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page introuvable: "'+page+'"');
});


app.listen(8080);
