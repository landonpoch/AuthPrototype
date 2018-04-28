import fs from "fs";
import http from "http";
import https from "https";
import socketio from "socket.io";
import express from "express";
import bodyParser from "body-parser";
import { httpJwtValidator, socketJwtValidator, registerIssuer } from "./auth/jwtHelper";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt";
import { localIssuerKey, LocalConfig } from "./auth/localJwt";
import createAccountRoutes from "./account";

const app = express();
app.use(
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    (req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
        res.setHeader("Access-Control-Allow-Headers", "authorization,Content-Type");
        res.setHeader("Access-Control-Allow-Methods", "POST,PUT");
        next();
    }
);

// could be used for health checks
app.get("/", (req, res) => { res.sendStatus(200); });

createAccountRoutes(app);

// Protect everything under the /api path
app.use("/api", httpJwtValidator);
app.options("/api/test", (req, res) => {
    res.setHeader("Access-Control-Allow-Headers", "authorization");
    res.sendStatus(200);
});
app.get("/api/test", (req, res) => { res.send("Protected resource reached."); });

registerIssuer(googleIssuerKey, new GoogleConfig());
registerIssuer(localIssuerKey, new LocalConfig());

const server = https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
    passphrase: "password"
}, app);

const io = socketio.listen(server);
io.use(socketJwtValidator)
    .on("connection", (socket) => {
        console.log("Connection!");
        socket.emit("thing", "You are connected!");
        const interval = setInterval(() => {
            socket.emit("thing", `UserId: ${(socket as any).user.id} Time: ${new Date().toString()}`);
        }, 1000);
        socket.on("disconnect", () => {
            clearInterval(interval);
            console.log("Disconnected!");
        });
    });

server.listen(process.env.PORT || 8443);
console.log(`App listening on port ${process.env.PORT || 8443}`);