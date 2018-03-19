import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import bodyParser from "body-parser";
import { isValidToken, registerIssuer } from "./auth/jwtValidator";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt"

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send("hello world");
});

app.options("/", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.send("");
});

// TODO: Update endpoint path to be something related to authentication
app.post("/", (req, res) => {
    const now = Date.now();
    isValidToken(req.body.token)
        .then(response => {
            console.log(`jwt validation duration: ${Date.now() - now}`)
            console.log(`Decoded token: ${JSON.stringify(response, undefined, 4)}`);
        })
        .catch(err => {
            console.log(err);
        });
});

registerIssuer(googleIssuerKey, new GoogleConfig());

https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
    passphrase: "password"
}, app).listen(process.env.PORT || 8443);
console.log(`App listening on port ${process.env.PORT || 8443}`);