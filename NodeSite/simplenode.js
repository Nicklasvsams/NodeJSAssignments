// importering af HTTP modulet
const http = require('http');

// En tæller for at vise events funktionalitet
var EventCounter = 0;

// Oprettelse af en server - Opsættelse af requests og responses via funktionen efter lambda udtrykket
const server = http.createServer((req, res) => {
    // Konstante variabler der har information om den IP addresse der anmoder forbindelse, den port der bruges til at forbinde med og hvilken port serveren bruger.
    const ip = res.socket.remoteAddress;
    const port = res.socket.remotePort;
    const myPort = res.socket.localPort;

    // Køres hvis den anmodede URL er hovedsiden
    if (req.url === '/'){
        // Sender et svar der viser informationerne
        res.write(`Hello!\nYour IP: ${ip}\nYour port: ${port}\nServer port: ${myPort}`);
        res.end();

        // Her sætter vi vores event kalder, dvs at vores "listener" får besked om at de skal køre deres event
        server.emit('counter', {counter: EventCounter+=1, socket: res.socket})
    }
});
// Registrerer en "listener" som kører funktionen heri når eventet bliver kaldt
server.on('counter', (args) => {
    console.log(`Connection established on port ${args.socket.localPort} from ${args.socket.remotePort} - Count: ${args.counter}`)
})

// Fortæller vores server at den skal lytte på port 3000 for aktivitet.
server.listen(3000);
