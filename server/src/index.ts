import fs from "fs";
import http from "http";
import https from "https";
import socketio from "socket.io";
import express from "express";
import bodyParser from "body-parser";
import { httpJwtValidator, socketJwtValidator, registerIssuer } from "./auth/jwtHelper";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt";
import { localIssuerKey, LocalConfig, issueJwt } from "./auth/localJwt";
import { validateToken as validateFacebookToken, getTokenDetails as getFacebookTokenDetails } from "./auth/facebookTokenValidator";

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

// https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46
app.put("/account/create", (req, res) => {
    const username = req.body.username; // Should be an email
    const password = req.body.password;

    // TODO: Create account and issue 1st party JWT
    // This doesn't have to be done prior to functional facebook auth
});

app.post("/account/reset", (req, res) => {

});

app.get("/token", (req, res) => {
    const grantType = req.query.grant_type;
    if (grantType === "password") {
        const username = req.query.username;
        const password = req.query.password;
        // TODO: Validate username and password
        // Issue 1st party JWT
        // https://tools.ietf.org/html/rfc6749#section-4.3
        // https://alexbilbie.com/guide-to-oauth-2-grants/ (see section 4.3)
        // This doesn't have to be done prior to functional facebook auth
    } else if (grantType === "facebook_access_token") {
        validateFacebookToken(req.query.client_id, req.query.facebook_access_token)
            .then(() => getFacebookTokenDetails(req.query.facebook_access_token))
            .then(body => {
                const issuedJwt = issueJwt({ ...body, iss: "https://localhost:3000" });
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
        const interval = setInterval(() => { socket.emit("thing", new Date().toString()); }, 1000);
        socket.on("disconnect", () => {
            clearInterval(interval);
            console.log("Disconnected!");
        });
    });

server.listen(process.env.PORT || 8443);
console.log(`App listening on port ${process.env.PORT || 8443}`);