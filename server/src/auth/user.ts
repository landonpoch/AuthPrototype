import { v4 as uuid } from "uuid";
import { Client } from "cassandra-driver";

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

const client = new Client({ contactPoints: ["localhost"], keyspace: "auth_prototype" });
const LocalIss = "https://localhost:3000";
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

            // TODO: Hash the password and store into the new password_hash table.
            const id = uuid();
            return client.batch([
                { query: "INSERT INTO user (id, email, name) VALUES (?, ?, ?)", params: [id, email, email], },
                { query: "INSERT INTO token_link (iss, email, sub, user_id) VALUES (?, ?, ?, ?)", params: [LocalIss, email, id, id], }
            ], { prepare: true }).then(result => ({
                id: id,
                displayName: email,
                email: email,
            }));
        });
};

const loginWithLocalCredentials = (email: string, password: string): Promise<User> => {
    // TODO: lookup the user from the new password_hash table and return it
    throw "Not implemented";
};

export { ensureUser, createLocalUser, loginWithLocalCredentials };