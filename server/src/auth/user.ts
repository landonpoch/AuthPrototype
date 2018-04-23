import { v4 as uuid } from "uuid";
import { Client } from "cassandra-driver";
import { hash, compare } from "bcrypt";
import { createTestAccount, createTransport, getTestMessageUrl } from "nodemailer";

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

const createLocalUser = (id: string, email: string, passwordHash: string): Promise<User> => {
    console.log(`createLocalUser - id: ${id} email: ${email} passwordHash: ${passwordHash}`);
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
    const id = uuid();
    const getUserIdQuery = "SELECT user_id FROM token_link WHERE iss = ? AND email = ?";
    return client.execute(getUserIdQuery, [ LocalIss, email ], { prepare: true })
        .then(result => result.rowLength > 0 ? Promise.reject("User already exists") : Promise.resolve())
        .then(() => hash(password, SaltRounds))
        .then(passwordHash => {
            const user_id = uuid();
            const createPendingUser =
                "INSERT INTO pending_user (id, email, password_hash, user_id) VALUES (?, ?, ?, ?) USING TTL 300";
            return client.execute(createPendingUser, [id, email, passwordHash, user_id], { prepare: true });
        })
        .then(result => createTestAccount())
        .then(account => {
            let transporter = createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: {
                    user: account.user,
                    pass: account.pass
                }
            });
            let mailOptions = {
                from: `"Fred Foo 👻" <foo@example.com>`,
                to: email,
                subject: "Hello ✔",
                text: "Hello world?",
                html: `<a href="https://localhost:3000/confirm-account?token=${id}">Confirm your account</a>`
            };
            return transporter.sendMail(mailOptions);
        })
        .then(info => {
            console.log("Message sent: %s", info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log("Preview URL: %s", getTestMessageUrl(info));
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
};

const confirmAccount = (id: string): Promise<User> => {
    const getPendingUserQuery = "SELECT email, password_hash, user_id FROM pending_user WHERE id = ?";
    return client.execute(getPendingUserQuery, [ id ], { prepare: true })
        .then(result => {
            if (result.rowLength > 0) {
                const pendingUser = result.rows[0];
                return createLocalUser(pendingUser.user_id.toString(), pendingUser.email, pendingUser.password_hash);
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

export { ensureUser, confirmAccount, loginWithLocalCredentials, createPendingUser };