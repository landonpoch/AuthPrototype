
import jwt from "jsonwebtoken";
import jwks from "jwks-rsa";
import { filter, first } from "lodash";

export interface Jwt {
    header: JwtHeader;
    payload: JwtPayload;
}

export interface JwtHeader {
    alg: "RS256" | "HS256";
    kid: string;
}

export interface JwtPayload {
    /** Registered Claim - Issuer, the 3rd party that is issuing the JWT */
    iss: string; // "https://accounts.google.com",
    /** Registered Claim - Audience, should be your registered client id */
    aud: string; // "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com",
    /** Registered Claim - Subject, The 3rd party unique identifier for the user (subject) */
    sub: string; // "115532470754936214388",
    /** Registered Claim - Expiration time for the JWT in NumericDate value */
    exp: number; // 1521269562,
    /** Registered Claim - Defines the time before which the JWT MUST NOT be accepted for processing */
    nbf?: number;
    /** Registered Claim - The time the JWT was issued. Can be used to determine the age of the JWT */
    iat?: number; // 1521265962,
    /** Registered Claim - Unique identifier for the JWT. Can be used to prevent the JWT from being replayed. This is helpful for a one time use token. */
    jti?: string; // "228f7ad064db58b4a62f211792fed978bf1158fa",

    /** A display name for the user */
    name?: string; // "Landon Poch",
    /**	Given name(s) or first name(s) */
    given_name?: string; // "Landon",
    /** Surname(s) or last name(s) */
    family_name?: string; // "Poch",
    /** Image url for the user */
    picture?: string; // "https://lh6.googleusercontent.com/-PRelXpjOo2E/AAAAAAAAAAI/AAAAAAAAAAA/uD4f4GOi_QU/s96-c/photo.jpg",
    /** Authorized party - the party to which the ID Token was issued */
    azp?: string; // "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com",
    /** Value used to associate a Client session with an ID Token */
    nonce?: string; // "cdf98f0a06ac4be99cdbc7b29c19b9cd",
    /** Access Token hash value */
    at_hash?: string; // "RXRmkFRXShjP4nvymUmskw",
    locale?: string; // "en"
    email?: string;
    email_verified?: boolean;
}

export interface IssuerMap {
    [iss: string]: IssuerConfig;
}
export interface IssuerConfig {
    clientId: string;
    getJwksClient: () => Promise<jwks.JwksClient>;
}
const issuerMap: IssuerMap = {};
const registerIssuer = (iss: string, config : IssuerConfig): void => {
    issuerMap[iss] = config;
}

const isValidToken = (token: string): Promise<JwtPayload> => {
    const { header, payload } = decodeJwt(token);
    const issuerConfig = issuerMap[payload.iss];
    if (!issuerConfig) throw "JWT issuer not supported";
    
    const { clientId, getJwksClient } = issuerConfig;
    return getJwksClient()
        .then(client => hasValidSignature(token, header, client))
        .then(decoded => {
            if (decoded.aud !== clientId) throw "Invalid client id";
            if ((decoded.exp * 1000) < Date.now()) throw "Expired JWT";
            return decoded;
        });
};

const hasValidSignature = (token: string, header: JwtHeader, client: jwks.JwksClient): Promise<JwtPayload> => {
    return new Promise<jwks.Jwk>((resolve, reject) => {
        client.getSigningKey(header.kid, (err, key) => {
            if (err) return reject(`Invalid signature: ${err.message}`);
            resolve(key);
        });
    }).then(key => {
        if (key && key.rsaPublicKey) {
            const decoded = jwt.verify(token, key.rsaPublicKey, { algorithms: [header.alg] });
            if (decoded && typeof decoded === "object") return decoded as JwtPayload;
        }
        throw "Unable to get rsaPublicKey";
    });
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

export { isValidToken, registerIssuer };
