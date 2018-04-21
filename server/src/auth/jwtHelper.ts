import { RequestHandler } from "express";
import socketio from "socket.io";
import jwt from "jsonwebtoken";
import { filter, first } from "lodash";
import { ensureUser } from "./user";

const issuerMap: IssuerMap = {};
const registerIssuer = (iss: string, config: IssuerConfig): void => {
    issuerMap[iss] = config;
};

const socketJwtValidator = (socket: socketio.Socket, next: (err?: any) => void): void => {
    if (socket.handshake.query && socket.handshake.query.token) {
        isValidToken(socket.handshake.query.token)
            .then(ensureUser)
            .then(user => {
                (socket as any)["user"] = user;
                next();
            })
            .catch(err => {
                next(new Error("Authentication error"));
            });
      } else {
          next(new Error("Authentication error"));
      }
};

const httpJwtValidator: RequestHandler = (req, res, next) => {
    if (req.method === "OPTIONS") return next();

    const denyAccess = () => {
        res.status(401);
        res.setHeader("WWW-Authenticate", "Bearer");
        res.end();
    };

    const authHeader = req.get("authorization");
    if (!authHeader) return denyAccess();
    const [authType, token] = authHeader.split(" ");
    if (authType !== "Bearer") return denyAccess();

    isValidToken(token)
        .then(ensureUser)
        .then(user => {
            (req as any)["user"] = user;
            next();
        })
        .catch(err => {
            console.log(err);
            denyAccess();
        });
};

const isValidToken = (token: string): Promise<JwtPayload> => {
    const { header, payload } = decodeJwt(token);
    const issuerConfig = issuerMap[payload.iss];
    if (!issuerConfig) throw "JWT issuer not supported";
    return issuerConfig.verifyJwt(token, header.alg, header.kid);
};

const decodeJwt = (token: string): Jwt => {
    const decodedToken = jwt.decode(token, { complete: true });
    const isCompleteDecodedJwt = (decoded: string | object | null): decoded is Jwt => {
        return typeof decoded === "object" && decoded != null && (<Jwt>decoded).header !== undefined;
    };
    if (isCompleteDecodedJwt(decodedToken)) {
        return decodedToken;
    }
    throw "Unable to decode JWT";
};

export { httpJwtValidator, socketJwtValidator, registerIssuer };

// Interfaces
export interface IssuerMap {
    [iss: string]: IssuerConfig;
}
export interface IssuerConfig {
    verifyJwt(token: string, alg: "RS256" | "HS256", keyId?: string): Promise<JwtPayload>;
}

export interface Jwt {
    header: JwtHeader;
    payload: JwtPayload;
}

export interface JwtHeader {
    alg: "RS256" | "HS256";
    kid: string;
}

export interface JwtPayload {
    /** Registered Claim - Audience, should be your registered client id */
    aud?: string;
    /** Registered Claim - Issuer, the 3rd party that is issuing the JWT */
    iss: string;
    /** Registered Claim - Subject, The 3rd party unique identifier for the user (subject) */
    sub: string;
    /** Registered Claim - Expiration time for the JWT in NumericDate value */
    exp?: number;
    /** Registered Claim - Defines the time before which the JWT MUST NOT be accepted for processing */
    nbf?: number;
    /** Registered Claim - The time the JWT was issued. Can be used to determine the age of the JWT */
    iat?: number;
    /** Registered Claim - Unique identifier for the JWT. Can be used to prevent the JWT from being replayed. This is helpful for a one time use token. */
    jti?: string;

    /** A display name for the user */
    name: string;
    /**	Given name(s) or first name(s) */
    given_name?: string;
    /** Surname(s) or last name(s) */
    family_name?: string;
    /** Image url for the user */
    picture?: string;
    /** Authorized party - the party to which the ID Token was issued */
    azp?: string;
    /** Value used to associate a Client session with an ID Token */
    nonce?: string;
    /** Access Token hash value */
    at_hash?: string;
    locale?: string;
    email: string;
    email_verified?: boolean;
}
