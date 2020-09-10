const app = require('express')(),
express = require('express'),
bcrypt = require('bcrypt'),
saltRounds = 10,
fs = require('fs'), 
server = require('http').createServer(app),
formidable = require('formidable'),
baseDir = "C:/Users/nics/Desktop/NVS/Opgaver/Opgave 8 - Node.js/NodeOpgaver/M&N Aps";

app.use(express.urlencoded({
    extended: true
}));

var user;

app.get('/', (req, res) => {
    res.sendFile(baseDir + "/index.html");
});

app.get('/new/users', (req, res) => {
    res.sendFile(baseDir + "/newaccount.html");
});

app.post('/new/users/create', async (req, res) => {
    var username = req.body.username,
    password = req.body.password;

    if (username !== null && username !== "" && password !== null && password !== ""){

        bcrypt.hash(password, saltRounds, function(err, hash){
            fs.readFile('M&N Aps/users.json', (err, data) => {
                if (err) throw err;
                let json = JSON.parse(data);
                
                if (json.users.some(user => user.username === username)){
                    res.write(errorHtml("Account name already taken, try again.", "/new/users"));
                    res.end();
                }
                else{
                    fs.mkdir(`${baseDir}/userfiles/${username}`, function(){
                        console.log(`Directory created`);
                    });
                    json.users.push({username: username, password: hash});
                    fs.writeFile('./M&N Aps/users.json', JSON.stringify(json), 'utf8', function(){});
                    res.write(errorHtml("Account created successfully!", "/", "Back to login"));
                    res.end();
                }
            });
        })
    }
    else{
        res.write(errorHtml("Account name or password not valid, try again.", "/new/users"));
        res.end();
    }
});

app.get('/users/login', (req, res) => {
    var username = req.query.username,
    password = req.query.password;

    if (username !== null && username !== "" && username !== undefined && password !== null && password !== "" && password !== undefined){
        fs.readFile('M&N Aps/users.json', (err, data) => {
            if (err) throw err;
            let json = JSON.parse(data);
            
            if (json.users.some(user => user.username === username && bcrypt.compare(password, user.password))){
                user = new User(username, true);

                res.redirect(`/users/${user.username}`);
            }
            else{
                res.write(errorHtml("Username or password was incorrect, try again.", "/"));
                res.end();
            }
        });
    }
    else{
        res.write(errorHtml("Username or password was invalid, try again.", "/"));
        res.end();
    }
})

app.get('/users/:userName', (req, res) =>{
    htmlDir = `<h3>${req.params.userName}</h3>`;

    try{
        if (user.authenticated !== undefined && user.authenticated !== false && req.params.userName === user.username){
            user = new User(req.params.userName, true);
    
            if (fs.existsSync(user.dir)){
                user.files.forEach(file => {
                    htmlDir = htmlDir.concat(`<p>${file}</p> ${buttonHtml("/filedelete", "get", "submit", "Delete", file)}`);
                });
            };     
        
            res.write(headerHtml()+htmlDir+fileHtml()+footerHtml());
        }
        else{
            res.status(401).send("Not authorized.");
        }
    }
    catch (err){
        res.status(401).send("Not authorized.");
    }
    
});

app.get('/filedelete/:fileName', (req, res) => {
    try{
        fs.unlinkSync(`${baseDir}/userfiles/${user.username}/${req.params.fileName}`);
        console.log(`${req.params.fileName} deleted`);
        res.redirect(`/users/${user.username}`);
    }
    catch (err) {
        console.log("An error occured: " + err);
        res.send("An error occured.");
    }    
});

app.post('/fileupload', (req, res) => {
    var path = `${baseDir}/userfiles/${user.username}`;
    var form = new formidable.IncomingForm();

    form.parse(req, function (err, fields, files){
        if (err) throw err;

        var oldpath = files.filetoupload.path;
        var newpath = `${path}/${files.filetoupload.name}`;

        fs.rename(oldpath, newpath, function (err){
            if (err) throw err;

            console.log(`File created and placed in ${newpath} by ${user.username}`)

            res.redirect(`/users/${user.username}`);
        })
    })
});
server.listen(8080);

class User {
    constructor(username, authentication){
        this.username = username;
        this.dir = `${baseDir}/UserFiles/${username}`;
        this.authenticated = true;

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
    return '<div><form action="/fileupload" method="post" enctype="multipart/form-data"><input type="file" name="filetoupload"><br><input type="submit"></div>';
}

function footerHtml(){
    return '</body></html>'
}

function buttonHtml(action, method, type, text, variable){
    return `<form action="${action}" method="${method}"><button type="${type}" formaction="/filedelete/${variable}">${text}</button></form>`
}

function errorHtml(message, action, buttonText = "Back"){
    return `<p>${message}</p> <br><form method="GET" action="${action}"><button type="submit" formaction="${action}">${buttonText}</button></form>`
}