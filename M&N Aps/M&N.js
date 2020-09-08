const app = require('express')(),
fs = require('fs'), 
server = require('http').createServer(app),
formidable = require('formidable'),
baseDir = "C:/Users/nics/Desktop/NVS/Opgaver/Opgave 8 - Node.js/NodeOpgaver/M&N Aps"

app.get('/', (req, res) =>{
    res.sendFile(baseDir + "/index.html");
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
            res.write('File uploaded and placed in folder');
            console.log(`File created and placed in ${newpath}`)
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
var user = new User("Hansi");

function createUserDir(user){
    fs.mkdir(`${user.dir}`, function (){
        fs.writeFile(`${user.dir}/somefile.txt`, "Something, something", function (err){
            if (err) throw err;
            console.log('File is created succesfully.');
        })
    });
}

createUserDir(user);