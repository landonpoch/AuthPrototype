import { Express } from "express";
import RateLimiter from "express-rate-limit";
import { issueJwt } from "./auth/localJwt";
import { httpJwtValidator } from "./auth/jwtHelper";
import { validateToken, getTokenDetails } from "./auth/facebookTokenHelper";
import {
    User,
    createPendingUser,
    confirmAccount,
    loginWithLocalCredentials,
    ensureUser,
    changePassword,
    beginPasswordReset,
    confirmPasswordReset
} from "./auth/user";

// https://hackernoon.com/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46
const createAccountRoutes = (app: Express) => {
    app.use("/account", new RateLimiter({})); // Just use defaults

    // Create and verify an account
    app.put("/account/create", (req, res) => {
        const username = req.body.username; // Should be an email
        const password = req.body.password;
        return createPendingUser(username, password)
            .then(() => { res.sendStatus(200); })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    });
    app.put("/account/verify", (req, res) => {
        const email = req.body.email;
        const token = req.body.token;
        return confirmAccount(email, token)
            .then(user => {
                const issuedJwt = issueJwt(user);
                res.send({ access_token: issuedJwt, token_type: "bearer" });
            })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    });

    // Get a token either with creds or with authorization token
    app.get("/account/token", (req, res) => {
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

    app.post("/account/change-password", httpJwtValidator, (req, res) => {
        const user: User = req.user;
        const currentPassword = req.body.password;
        const proposedPassword = req.body.new_password;
        changePassword(user.email, currentPassword, proposedPassword)
            .then(() => { res.send({}); })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    });

    // Send a reset email and reset the password
    app.post("/account/forgot-password", (req, res) => {
        beginPasswordReset(req.body.email)
            .then(() => { res.send({}); })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    });
    app.post("/account/reset-password", (req, res) => {
        const email = req.body.email;
        const token = req.body.token;
        const password = req.body.password; // this is the new password being requested
        confirmPasswordReset(email, token, password)
            .then(() => { res.send({}); })
            .catch(err => {
                console.log(err);
                res.sendStatus(500);
            });
    });
};

export default createAccountRoutes;