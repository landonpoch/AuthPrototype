import fs from "fs";
import http from "http";
import https from "https";
import socketio from "socket.io";
import express from "express";
import bodyParser from "body-parser";
import { jwtValidator, isValidToken, registerIssuer } from "./auth/jwtValidator";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Protect everything under the /token path
app.use("/token", jwtValidator);

app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send("hello world");
});

app.options("/token/test", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
    res.setHeader("Access-Control-Allow-Headers", "authorization");
    res.sendStatus(200);
});

app.get("/token/test", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
    res.send("Protected resource reached.");
});

registerIssuer(googleIssuerKey, new GoogleConfig());

const server = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
    passphrase: "password"
}, app);

// TODO: Cleanup and abstract to middleware
const io = socketio.listen(server);
io.use((socket, next) => {
    console.log(socket.handshake.query);
    if (socket.handshake.query && socket.handshake.query.token) {
        isValidToken(socket.handshake.query.token)
            .then(jwtPayload => {
                (socket as any)["decoded"] = jwtPayload;
                next();
            })
            .catch(err => {
                next(new Error("Authentication error"));
            });
      } else {
          next(new Error("Authentication error"));
      }
})
.on("connection", (socket) => {
    console.log("Connection!");
    socket.emit("thing", "You are connected!");
    setTimeout(() => { socket.emit("thing", "Second message!"); }, 1000);
});

server.listen(process.env.PORT || 8443);
console.log(`App listening on port ${process.env.PORT || 8443}`);