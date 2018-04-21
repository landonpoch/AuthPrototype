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

const ensureUser = (token: Token): Promise<User> => {
    // Local users are assumed to already be in the database
    if (token.iss === "https://localhost:3000") {
        return Promise.resolve({
            id: token.sub,
            displayName: token.name,
            email: token.email,
        });
    }

    const getUserQuery = "SELECT user_id FROM token_link WHERE iss = ? AND sub = ?";
    return client.execute(getUserQuery, [ token.iss, token.sub ], { prepare: true }).then(result => {
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
            { query: "INSERT INTO token_link (iss, sub, user_id) VALUES (?, ?, ?)", params: [token.iss, token.sub, id], }
        ], { prepare: true }).then(result => ({
            id: id,
            displayName: token.name,
            email: token.email,
        }));
    });
};

export { ensureUser };