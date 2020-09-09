const app = require('express')(),
express = require('express'),
fs = require('fs'), 
server = require('http').createServer(app),
formidable = require('formidable'),
baseDir = "C:/Users/nics/Desktop/NVS/Opgaver/Opgave 8 - Node.js/NodeOpgaver/M&N Aps";
var user = "";
app.use(express.bodyParser());
app.get('/', (req, res) => {
    res.sendFile(baseDir + "/index.html");
});

app.get('/new/user', (req, res) => {
    res.sendFile(baseDir + "/newaccount.html");
});

app.post('/new/user/create', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    console.log(`Username: ${username}\nPassword: ${password}`)
    res.redirect('back');
});

app.get('/user', (req, res) => {
    var username = req.query.username;

    fs.mkdir(`${`${baseDir}/UserFiles/${username}`}`, function(){});

    if (username != "" && username != null){
        user = new User(username);
    }

    var htmlDir = "";

    if (fs.existsSync(user.dir)){
        user.files.forEach(file => {
            htmlDir = htmlDir.concat(`<p>${file}</p> <form action="/filedelete" method="get"><button type="submit" formaction="/filedelete/${file}">Delete</button></form>`);
        });
    };

    res.write(headerHtml()+htmlDir+fileHtml()+footerHtml());
    res.end();
})

app.get('/filedelete/:fileName', (req, res) => {
    fs.unlinkSync(`${baseDir}/UserFiles/${user.username}/${req.params.fileName}`);
    console.log(`${req.params.fileName} deleted`);
    res.redirect('back');
});

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

            res.redirect('back');
        })
    })
});
server.listen(8080);

class User {
    constructor(username){
        this.username = username;
        this.dir = `${baseDir}/UserFiles/${username}`;

        if (fs.existsSync(this.dir)){
            this.files = fs.readdirSync(this.dir, function(err, list) {
                if (err) throw err;
                this.files = list;
                return list;
            });
        }
    }
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