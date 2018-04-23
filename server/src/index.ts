import fs from "fs";
import http from "http";
import https from "https";
import socketio from "socket.io";
import express from "express";
import bodyParser from "body-parser";
import { httpJwtValidator, socketJwtValidator, registerIssuer } from "./auth/jwtHelper";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt";
import { localIssuerKey, LocalConfig, issueJwt } from "./auth/localJwt";
import { validateToken, getTokenDetails } from "./auth/facebookTokenHelper";
import { ensureUser, createPendingUser, confirmAccount, loginWithLocalCredentials } from "./auth/user";

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "https://localhost:3000");
    next();
});
// Protect everything under the /token path
app.use("/api", httpJwtValidator);

app.get("/", (req, res) => {
    res.send("hello world");
});

app.options("/account/create", (req, res) => {
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "PUT");
    res.sendStatus(200);
});

// https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46
app.put("/account/create", (req, res) => {
    const username = req.body.username; // Should be an email
    const password = req.body.password;
    return createPendingUser(username, password)
        .then(() => {
            res.sendStatus(200);
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.get("/account/confirm", (req, res) => {
    const id = req.query.id;
    return confirmAccount(id)
        .then(user => {
            const issuedJwt = issueJwt(user);
            res.send({ access_token: issuedJwt, token_type: "bearer" });
        })
        .catch(err => {
            console.log(err);
            res.sendStatus(500);
        });
});

app.post("/account/reset", (req, res) => {
    // TODO: email reset
});

app.get("/token", (req, res) => {
    // TODO: Rate limiting w/ HTTP 429 response
    const grantType = req.query.grant_type;
    if (grantType === "password") {
        const username = req.query.username;
        const password = req.query.password;
        loginWithLocalCredentials(username, password)
            .then(user => {
                const issuedJwt = issueJwt(user);
                res.send({ access_token: issuedJwt, token_type: "bearer" });
            })
            .catch((err: any) => {
                if (err === "Invalid username" || err === "Invalid password") {
                    res.sendStatus(401);
                } else {
                    res.sendStatus(500);
                }
            });
    } else if (grantType === "facebook_access_token") {
        validateToken(req.query.client_id, req.query.facebook_access_token)
            .then(() => getTokenDetails(req.query.facebook_access_token))
            .then(ensureUser)
            .then(user => {
                const issuedJwt = issueJwt(user);
                res.send({ access_token: issuedJwt, token_type: "bearer" });
            })
            .catch((err: any) => {
                console.log(err);
                res.sendStatus(500);
            });
    }
});

app.options("/api/test", (req, res) => {
    res.setHeader("Access-Control-Allow-Headers", "authorization");
    res.sendStatus(200);
});

app.get("/api/test", (req, res) => {
    res.send("Protected resource reached.");
});

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