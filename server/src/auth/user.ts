import { v4 as uuid } from "uuid";
import { Client } from "cassandra-driver";
import { hash, compare } from "bcrypt";

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
const SaltRounds = 10;

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

const createLocalUser = (email: string, password: string): Promise<User> => {
    const getUserIdQuery = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";
    return client.execute(getUserIdQuery, [ LocalIss, email ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0)
                throw "User already exists";

            return hash(password, SaltRounds).then(passwordHash => {
                const id = uuid();
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
                            const getUser = "SELECT email, name FROM user WHERE id = ?";
                            return client.execute(getUser, [ result.rows[0].user_id ], { prepare: true });
                        }
                        throw "Invalid password";
                    });
            }
            throw "User doesn't exist";
        })
        .then(result => {
            if (result.rowLength > 0) {
                return {
                    id: result.rows[0].id,
                    displayName: result.rows[0].name,
                    email: result.rows[0].email,
                };
            }
            throw "User doesn't exist";
        });
};

export { ensureUser, createLocalUser, loginWithLocalCredentials };