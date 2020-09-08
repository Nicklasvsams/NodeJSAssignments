const app = require('express')(),
fs = require('fs'), 
server = require('http').createServer(app),
formidable = require('formidable'),
baseDir = "C:/Users/nics/Desktop/NVS/Opgaver/Opgave 8 - Node.js/NodeOpgaver/M&N Aps";
var user = "";

app.get('/', (req, res) => {
    res.sendFile(baseDir + "/index.html");
});

app.get('/user', (req, res) => {
    var username = req.query.username;

    if (username != "" && username != null){
        user = new User(username);
    }

    createUserDir(user);

    var userDir = getUserFilesPage(user);

    res.write(headerHtml()+fileHtml()+footerHtml());
    res.end();
})

app.post('/fileupload', (req, res) => {
    var path = `${baseDir}/UserFiles/${user.username}`;
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files){
        if (err) throw err;

        var oldpath = files.filetoupload.path;
        var newpath = `${path}/${files.filetoupload.name}`;

        fs.rename(oldpath, newpath, function (err){
            if (err) throw err;

            console.log(`File created and placed in ${newpath}`)

            res.write(headerHtml()+fileHtml()+footerHtml());
            res.end();
        })
    })
});
server.listen(8080);

class User {
    constructor(username){
        this.username = username;
        this.dir = `${baseDir}/UserFiles/${username}`;
    }
}

function createUserDir(user){
    fs.mkdir(`${user.dir}`, function(){});
}

function headerHtml(){
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><title>Files</title></head><body>'
}

function fileHtml(){
    return '<div><form action="fileupload" method="post" enctype="multipart/form-data"><input type="file" name="filetoupload"><br><input type="submit"></div>';
}

function footerHtml(){
    return '</body></html>'
}

function getUserFilesPage(user){
    let userDir = `${baseDir}/UserFiles/${user.username}`;

    return fs.readdir(userDir, function(err, files) {
        if (err) throw err;

        var directoryFiles = [];
        
        files.forEach(file => {
            directoryFiles.push(file);
        })

        directoryFiles.forEach(file => {
            console.log(file);
        });

        return directoryFiles;
    });
}