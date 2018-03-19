import fs from "fs";
import http from "http";
import https from "https";
import express from "express";
import bodyParser from "body-parser";
import { jwtValidator, registerIssuer } from "./auth/jwtValidator";
import { googleIssuerKey, GoogleConfig } from "./auth/googleJwt"

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
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.send("");
});

app.post("/token/test", (req, res) => {
    res.write("Protected resource reached.");
    res.status(200);
    res.end();
});

registerIssuer(googleIssuerKey, new GoogleConfig());

https.createServer({
    key: fs.readFileSync("key.pem"),
    cert: fs.readFileSync("cert.pem"),
    passphrase: "password"
}, app).listen(process.env.PORT || 8443);
console.log(`App listening on port ${process.env.PORT || 8443}`);