import { v4 as uuid } from "uuid";
import { Client } from "cassandra-driver";
import { hash, compare } from "bcrypt";
import { createTransport } from "nodemailer";
import secrets from "../../secrets.json";

export interface Token {
    iss: string;
    sub: string;
    email: string;
    name: string;
}

export interface User {
    id: string;
    displayName: string;
    email: string;
}

const LocalIss = "https://localhost:3000";
const SaltRounds = 12;

const client = new Client({ contactPoints: ["localhost"], keyspace: "auth_prototype" });

const ensureUser = (token: Token): Promise<User> => {
    // Local users are assumed to already be in the database
    if (token.iss === LocalIss) {
        return Promise.resolve({
            id: token.sub,
            displayName: token.name,
            email: token.email,
        });
    }

    const getUserIdQuery = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";
    return client.execute(getUserIdQuery, [ token.iss, token.email ], { prepare: true }).then(result => {
        if (result.rowLength > 0) {
            return {
                id: result.rows[0].user_id,
                displayName: token.name,
                email: token.email,
            };
        }

        const id = uuid();
        return client.batch([
            { query: "INSERT INTO user (id, email, name) VALUES (?, ?, ?)", params: [id, token.email, token.name], },
            { query: "INSERT INTO token_link (iss, email, sub, user_id) VALUES (?, ?, ?, ?)", params: [token.iss, token.email, token.sub, id], }
        ], { prepare: true }).then(result => ({
            id: id,
            displayName: token.name,
            email: token.email,
        }));
    });
};

const createLocalUser = (id: string, email: string, passwordHash: string): Promise<User> => {
    const getUserIdQuery = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";
    return client.execute(getUserIdQuery, [ LocalIss, email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0)
                throw "User already exists";

            return client.batch([
                { query: "INSERT INTO user (id, email, name) VALUES (?, ?, ?)", params: [id, email, email], },
                { query: "INSERT INTO password_hash (email, password_hash, user_id) VALUES (?, ?, ?)", params: [email, passwordHash, id], },
                { query: "INSERT INTO token_link (iss, email, sub, user_id) VALUES (?, ?, ?, ?)", params: [LocalIss, email, id, id], }
            ], { prepare: true }).then(result => ({
                id: id,
                displayName: email,
                email: email,
            }));
        });
};

const createPendingUser = (email: string, password: string): Promise<void> => {
    const token = uuid(); // node-uuid uses cryptographically strong v4 uuids (122 bits of randomness)
    const getUserIdQuery = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";

    // TODO: Don't make the UI wait for the email to be sent prior to getting a response
    return client.execute(getUserIdQuery, [ LocalIss, email ], { prepare: true })
        .then(result => result.rowLength > 0 ? Promise.reject("User already exists") : Promise.resolve())
        .then(() => Promise.all([hash(token, SaltRounds), hash(password, SaltRounds)]))
        .then(([tokenHash, passwordHash]) => {
            const user_id = uuid();
            const createPendingUser =
                "INSERT INTO pending_user (email, token_hash, password_hash, user_id) VALUES (?, ?, ?, ?) USING TTL 300";
            return client.execute(createPendingUser, [email, tokenHash, passwordHash, user_id], { prepare: true });
        })
        .then(result => {
            let transporter = createTransport(secrets.smtp);
            // TODO: Figure out an acceptable template
            let mailOptions = {
                from: `"Fred Foo 👻" <foo@example.com>`,
                to: email,
                subject: "Hello ✔",
                text: "Hello world?",
                html: `<a href="https://localhost:3000/confirm-account?email=${email}&token=${token}">Confirm your account</a>`
            };
            return transporter.sendMail(mailOptions);
        })
        .then(info => { console.log("Message sent: %s", info.messageId); });
};

const confirmAccount = (email: string, token: string): Promise<User> => {
    const getPendingUserQuery = "SELECT email, token_hash, password_hash, user_id FROM pending_user WHERE email = ?";
    return client.execute(getPendingUserQuery, [ email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                const pendingUser = result.rows[0];
                return compare(token, pendingUser.token_hash)
                    .then(isValidToken => {
                        if (isValidToken)
                            return createLocalUser(
                                pendingUser.user_id.toString(),
                                pendingUser.email,
                                pendingUser.password_hash);
                        throw "Invalid token";
                    });
            }
            throw "Pending user not found";
        });
};

const loginWithLocalCredentials = (email: string, password: string): Promise<User> => {
    const getHash = "SELECT password_hash, user_id FROM password_hash WHERE email = ?";
    return client.execute(getHash, [ email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                return compare(password, result.rows[0].password_hash)
                    .then(passwordMatches => {
                        if (passwordMatches) {
                            const getUser = "SELECT id, email, name FROM user WHERE id = ?";
                            return client.execute(getUser, [ result.rows[0].user_id ], { prepare: true });
                        }
                        throw "Invalid password";
                    });
            }
            throw "Invalid username";
        })
        .then(result => {
            if (result.rowLength > 0) {
                return {
                    id: result.rows[0].id,
                    displayName: result.rows[0].name,
                    email: result.rows[0].email,
                };
            }
            throw "Invalid username";
        });
};

const beginPasswordReset = (email: string): Promise<void> => {
    const token = uuid();
    const getUserId = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";
    return client.execute(getUserId, [ LocalIss, email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                const user_id = result.rows[0].user_id;
                return hash(token, 12)
                    .then(tokenHash => {
                        // TODO: support upsert or delete record on confirmation to handle back to back forgots?
                        const createResetRequest = "INSERT INTO reset_password (email, token_hash) VALUES (?, ?) USING TTL 300";
                        return client.execute(createResetRequest, [ email, tokenHash ], { prepare: true });
                    });
            }
            throw "Invalid email";
        })
        .then(result => {
            let transporter = createTransport(secrets.smtp);
            // TODO: Figure out an acceptable template
            let mailOptions = {
                from: `"Fred Foo 👻" <foo@example.com>`,
                to: email,
                subject: "Hello ✔",
                text: "Hello world?",
                html: `<a href="https://localhost:3000/reset-password?email=${email}&token=${token}">Reset your password</a>`
            };
            return transporter.sendMail(mailOptions);
        })
        .then(info => { console.log("Message sent: %s", info.messageId); });
};

const confirmPasswordReset = (email: string, token: string, password: string): Promise<void> => {
    const confirmResetQuery = "SELECT email, token_hash FROM reset_password WHERE email = ?";
    return client.execute(confirmResetQuery, [ email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                return compare(token, result.rows[0].token_hash);
            }

            throw "Invalid account to reset.";
        })
        .then(match => {
            if (match) {
                return hash(password, SaltRounds);
            }

            throw "Invalid reset token.";
        })
        .then(hashedPassword => {
            // TODO: support upsert or delete record on confirmation to handle back to back forgots?
            const resetPasswordQuery = "UPDATE password_hash SET password_hash = ? WHERE email = ?";
            return client.execute(resetPasswordQuery, [ hashedPassword, email ], { prepare: true });
        })
        .then(result => undefined);
};

const changePassword = (email: string, currentPassword: string, proposedPassword: string): Promise<void> => {
    const getPasswordHashQuery = "SELECT password_hash FROM password_hash WHERE email = ?";
    return client.execute(getPasswordHashQuery, [ email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                return compare(currentPassword, result.rows[0].password_hash);
            }
            throw "Invalid email";
        })
        .then(match => {
            if (match) {
                return hash(proposedPassword, SaltRounds);
            }
            throw "Invalid password";
        })
        .then(proposedPasswordHash => {
            const changePasswordQuery = "UPDATE password_hash SET password_hash = ? WHERE email = ?";
            return client.execute(changePasswordQuery, [ proposedPasswordHash, email ], { prepare: true });
        })
        .then(result => undefined);
};

export {
    ensureUser,
    confirmAccount,
    loginWithLocalCredentials,
    createPendingUser,
    beginPasswordReset,
    confirmPasswordReset,
    changePassword
};