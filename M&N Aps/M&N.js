// Singletons / Constant variables
const app = require('express')(), // The App required to set up the server.
express = require('express'), // Required to set the urlencoded option further down.
session = require('express-session'),
path = require('path'),
bcrypt = require('bcrypt'), // Bcrypt is a hashing tool which is used for our passwords
saltRounds = 10, // The factor to which bcrypt encrypts the passwords - The higher the salt, the longer it takes.
fs = require('fs'), // FileSystem to manipulate serverfiles
formidable = require('formidable'), // Formidable is required to do formparsing
baseDir = "C:/Users/nics/Desktop/NVS/Opgaver/Opgave 8 - Node.js/NodeOpgaver/M&N Aps", // The base directory for the managable filesystem
json = JSON.parse(fs.readFileSync('M&N Aps/users.json', (err, data) => {})),
admin = json.admin; // Admin info from JSON

// Required to read the request body
app.use(express.urlencoded({
    extended: true
}));

// Sets up the ability to create sessions for each individual user
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static(path.join(__dirname, `public`)));

// Sends the index.html file to the client to be loaded in the browser when the base url is called
app.get('/', (req, res) => {
    res.sendFile(baseDir + "/index.html");
});

// Sends the newaccount.html file to the client to be loaded in the browser when the /new/users route is called
app.get('/new/users', (req, res) => {
    res.sendFile(baseDir + "/newaccount.html");
});

// When a post request is sent to new/users/create route form variables are used to create a new user
app.post('/new/users/create', (req, res) => {
    var username = req.body.username,
    password = req.body.password;

    // Checks if username or password is empty or null
    if (username !== null && username !== "" && password !== null && password !== ""){

        // Encryption function from bcrypt module
        bcrypt.hash(password, saltRounds, function(err, hash){
            if (err) throw err;

            // Reads from the users.json file 
            fs.readFile('M&N Aps/users.json', (err, data) => {
                if (err) throw err;
                
                // Parses the json bytes into a readable string format
                let json = JSON.parse(data);
                
                // Checks if the username already exists in the json document
                if (json.users.some(user => user.username === username) || admin.username === username){
                    // Calls the end function which calls the informationHtml function which sends back a message and button in html
                    res.end(headerHtml() + informationHtml("Account name already taken, try again.", "/new/users") + footerHtml());
                }
                else{
                    // If the user doesn't exist, the server creates a directory for the new user
                    fs.mkdir(`${baseDir}/userfiles/${username}`, function(){
                        console.log(`Directory created`);
                    });

                    // Adds the new user to the json string
                    json.users.push({username: username, password: hash});
                    
                    // Overwrites the old json file with the updated version
                    fs.writeFile('./M&N Aps/users.json', JSON.stringify(json), 'utf8', function(){});

                    // Calls the end function which calls the informationHtml function which sends back a message and button in html
                    res.end(headerHtml() + informationHtml("Account created successfully!", "/", "Back to login") + footerHtml());
                }
            });
        })
    }
    else{
        // Calls the end function which calls the informationHtml function which sends back a message and button in html
        res.end(headerHtml() + informationHtml("Account name or password not valid, try again.", "/new/users") + footerHtml());
    }
});

// When a get request for logging in form variables are used to authenticate the user and sets up a session variable for the user 
app.get('/users/login', (req, res) => {
    var username = req.query.username,
    password = req.query.password;
    
    // Checks that the login parameters are valid
    if (username !== null && username !== "" && username !== undefined && password !== null && password !== "" && password !== undefined){

        // Reads from the users.json file 
        fs.readFile('M&N Aps/users.json', (err, data) => {
            if (err) throw err;

            // Parses the json bytes into a readable string format
            let json = JSON.parse(data);

            if (json.admin.username === username && bcrypt.compare(password, json.admin.password)){
                // If the username and password matches, the session variable "user" is initialised with a new User object
                req.session.user = new User(username, true);

                // Redirects the client to the appropriate userpage
                res.redirect(302, `/users/${req.session.user.username}`);
            }

            // Checks if the users username and password matches any of the json objects
            else if (json.users.some(user => user.username === username && bcrypt.compare(password, user.password))){

                // If the username and password matches, the session variable "user" is initialised with a new User object
                req.session.user = new User(username, true);

                // Redirects the client to the appropriate userpage
                res.redirect(302, `/users/${req.session.user.username}`);
            }
            else{
                // Calls the end function which calls the informationHtml function which sends back a message and button in html
                res.end(informationHtml("Username or password was incorrect, try again.", "/"));
            }
        });
    }
    else{
        // Calls the end function which calls the informationHtml function which sends back a message and button in html
        res.end(headerHtml()+informationHtml("Username or password was invalid, try again.", "/")+footerHtml())
    }
})

// When the users/login route function has been resolved, this route function is called
app.get('/users/:userName', (req, res) =>{
    // Initialisation of htmlDir string, which will contain information about the users directory in html format
    htmlDir = `<div class="container d-flex justify-content-center"><h2>${req.params.userName}'s directory</h2></div><br>`;
    console.log("User auth: " + req.session.user.authenticated + "\nReq sess user: " + req.session.user.username + "\nReq params user: " + req.params.userName)
    // QUERY SMOLL LETTER MEMBER, HAPPY MONDAI GLHF
    try{
        // Checks if the user session object is authenticated and if the parameter name matches the session username to avoid security breaches
        if (req.session.user.authenticated !== undefined && req.session.user.authenticated !== false && req.params.userName === req.session.user.username){
            console.log("Access2")
            // Reinitialises the User object to update the directory information
            req.session.user = new User(req.params.userName, true);

            // Checks if the user is admin
            if (req.session.user.username === admin.username){

                // Checks if the users directory exists
                if (fs.existsSync(req.session.user.dir)){

                    // A loop which goes through every user directory
                    req.session.user.files.forEach(directory => {

                        // Checks if a users directory exists
                        if (fs.existsSync(`${req.session.user.dir}/${directory}`)){

                            // Lists all the files in the given directory
                            var files = fs.readdirSync(`${req.session.user.dir}/${directory}`, function(err, list) {
                                if (err) throw err;
                                return list;
                            });

                            // Tjekker hvorvidt der er indhold i den angivne mappe
                            if (files.length > 0){
                                // En container wrapper der har en h3 header
                                htmlDir = htmlDir.concat(`<div class="container userfiles border border-dark rounded"><div class="container d-flex justify-content-center"><h3>${directory}'s files</h3></div>`);

                                // Concatenates filename, deletebutton and downloadbutton html to string
                                files.forEach(file => {
                                    htmlDir = htmlDir.concat(`<div class="container d-flex justify-content-between"><div class="row"><div class="col-sm"><h4>${file}</h4></div></div><div class="row"><div class="container d-flex"><div class="row"><div class="col-sm">${downloadButtonHtml("get", "submit", directory, "Download", file)}</div></div><div class="row"><div class="col-sm">${deleteButtonHtml("get", "submit", directory, "Delete", file)}</div></div></div></div></div><br>`);
                                });

                                htmlDir = htmlDir.concat('</div>');
                            };
                        };
                    });
                };  
            }
            else{
                if (req.session.user.files.length > 0){
                console.log("Access3")

                    // If the users directory exists, a forEach loop will list all directories in html with a delete button
                    htmlDir = htmlDir.concat(`<div class="container userfiles border border-dark rounded">`);
                    if (fs.existsSync(req.session.user.dir)){
                        req.session.user.files.forEach(file => {
                            htmlDir = htmlDir.concat(`<div class="container d-flex justify-content-between"><div class="row"><div class="col-sm"><h4>${file}</h4></div></div><div class="row"><div class="container d-flex"><div class="row"><div class="col-sm">${deleteButtonHtml("get", "submit", req.session.user.username, "Delete", file)}</div></div></div></div></div><br>`);
                        });
                    };  
                    htmlDir = htmlDir.concat(`</div>`);
                };
            };
            // Calls the end function with different html strings, to form a simple html page
            res.end(headerHtml()+htmlDir+fileHtml()+footerHtml());
        }
        else{
            // If the session user is not authenticated or username doesn't match, the client will get an authorization error
            res.status(401).send("Not authorized.");
        };
    }
    catch (err){
        // If an error occurs, the client will get an authorization error
        console.log(err);
        res.status(401).send("Not authorized.");
    };
});

// When a get request with route filedelete/:fileName is called, the callback function will use the form parameters to delete the specific file
app.get('/filedelete/:user/:fileName', (req, res) => {
    try{
        // Deletes a specific file based on path
        fs.unlinkSync(`${baseDir}/userfiles/${req.params.user}/${req.params.fileName}`);

        // Logs the deletion of said file
        console.log(`${req.params.fileName} deleted by user ${req.session.user.username}`);

        // Redirects the user to the specific userpage after deleting the specified file
        res.redirect(`/users/${req.session.user.username}`);
    }
    catch (err) {
        // Logs an error occuring when trying to delete a file
        console.log("An error occured: " + err);

        // Sends a response with a message
        res.send("An error occured.");
    };
});

// Allows the admin to download userfiles
app.get('/filedownload/:user/:fileName', (req, res) => {
    try{
        const file = `${req.session.user.dir}/${req.params.user}/${req.params.fileName}`;
        res.download(file, fn(err));
    }
    catch{
        res.send(headerHtml()+informationHtml(`An error occured trying to process your request, please try again.`, `/users/${req.session.user.username}`));
    }
});

// When a post function is called with /fileupload, this function will upload the specified file to the users directory
app.post('/fileupload', (req, res) => {
    var path = `${baseDir}/userfiles/${req.session.user.username}`;

    // Uses the formidable module to read forms
    var form = new formidable.IncomingForm();

    // Parses the form and handles the data in a callback function
    form.parse(req, function (err, fields, files){
        if (err) throw err;

        var oldpath = files.filetoupload.path;
        var newpath = `${path}/${files.filetoupload.name}`;

        // Places the file in the correct directory
        fs.rename(oldpath, newpath, function (err){
            if (err) throw err;

            console.log(`File created and placed in ${newpath} by ${req.session.user.username}`);

            // Redirects the user to the specific userpage after uploading the file
            res.redirect(`/users/${req.session.user.username}`);
        });
    });
});
// Tells our server to listen to port 8080 for testing purposes
app.listen(8080);

// Declaring a class to create User objects
class User {

    // Declaring a constructor that is called whenever a new User is created in memory, creating the object for use on the site
    constructor(username){
        this.username = username;
        this.authenticated = true;

        if (this.username === "Admin"){
            this.dir = `${baseDir}/userfiles`;
        }
        else{
            this.dir = `${baseDir}/userfiles/${username}`;
        };

        // Checks if the directory for the user exists and generates a list of the files in the directory
        if (fs.existsSync(this.dir)){
            this.files = fs.readdirSync(this.dir, function(err, list) {
                if (err) throw err;
                return list;
            });
        };
    };
};

// The functions below this comment are functions that return strings in html form, which can be used to quickly create a simple html site with modularity

function headerHtml(){
    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta http-equiv="X-UA-Compatible" content="ie=edge"><link rel="stylesheet" type="text/css" href="/css/bootstrap.min.css"><link rel="stylesheet" type="text/css" href="/css/styles.css"><title>M&N file management</title></head><body>'
};

function fileHtml(){
    return '<br><div class="container d-flex justify-content-center"><form action="/fileupload" method="post" enctype="multipart/form-data"><div class="container"><div class="row"><div class="col-sm"><input type="file" name="filetoupload"></div></div></div><br><div class="container"><div class="row"><div class="col-sm"><input class="btn btn-success" type="submit" value="Upload"></div></div></div></form></div>';
};

function footerHtml(){
    return '</body></html>'
};

function downloadButtonHtml(method, type, user, text, variable){
    return `<form action="/filedownload" method="${method}"><button type="${type}" class="btn btn-dark" formaction="/filedownload/${user}/${variable}">${text}</button></form>`
};

function deleteButtonHtml(method, type, user, text, variable){
    return `<form action="/filedelete" method="${method}"><button type="${type}" class="btn btn-danger" formaction="/filedelete/${user}/${variable}">${text}</button></form>`
};

function informationHtml(message, action, buttonText = "Back"){
    return `<div class="container d-flex justify-content-center"><div class="row"><h3>${message}</h3></div></div><br><div class="container d-flex justify-content-center"><div class="row"><form method="GET" action="${action}"><button type="submit" class="btn btn-dark" formaction="${action}">${buttonText}</button></div></div></form>`
};