import jwt from "jsonwebtoken";
import jwks from "jwks-rsa";
import axios from "axios";
import { IssuerConfig } from "./jwtHelper";

const googleIssuerKey = "https://accounts.google.com";
const googleWellKnownOidConfig = "https://accounts.google.com/.well-known/openid-configuration";
const clientId = "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com";

class GoogleConfig implements IssuerConfig {
    private jwksClient?: jwks.JwksClient;

    public verifyJwt = (token: string, alg: "RS256", keyId: string): Promise<GoogleJwtPayload> => {
        return this.getKey(keyId)
            .then(key => {
                const decoded = jwt.verify(token, key, { algorithms: [alg]});
                const isJwtPayload = (decoded: string | object): decoded is GoogleJwtPayload => {
                    return !!decoded && typeof decoded === "object";
                };
                if (isJwtPayload(decoded)) {
                    if (decoded.aud && decoded.aud !== clientId) throw "Invalid client id";
                    // TODO: Look into supporting 3rd party refresh tokens
                    // Looks like the client should just perform "silent authentication" for
                    // both facebook and google authentication scenarios
                    if (decoded.exp && (decoded.exp * 1000) < Date.now()) throw "Expired JWT";
                    return decoded;
                } else {
                    throw "Unable to verify token";
                }
            });
    }

    private getKey = (id: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
            if (!id) {
                reject("Id must be supplied for google authentication provider");
            } else {
                (this.jwksClient ?
                    Promise.resolve(this.jwksClient) :
                    (axios.get<{ jwks_uri: string }>(googleWellKnownOidConfig)
                        .then(response => {
                            return jwks({
                                jwksUri: response.data.jwks_uri,
                                cache: true,
                                rateLimit: true,
                            });
                        })))
                        .then(client => {
                            this.jwksClient = client;
                            client.getSigningKey(id, (err, key) => {
                                if (err) {
                                    reject(err);
                                }
                                if (!key || !key.rsaPublicKey) {
                                    reject("could not get key for google authentication provider");
                                } else {
                                    resolve(key.rsaPublicKey);
                                }
                            });
                        });
            }
        });
    }
}

export { googleIssuerKey, GoogleConfig };

export interface GoogleJwtPayload {
    /** Registered Claim - Issuer, the 3rd party that is issuing the JWT */
    iss: "https://accounts.google.com";
    /** Registered Claim - Audience, should be your registered client id */
    aud: string;
    /** Registered Claim - Subject, The 3rd party unique identifier for the user (subject) */
    sub: string;
    /** Registered Claim - Expiration time for the JWT in NumericDate value */
    exp: number;
    /** Registered Claim - Defines the time before which the JWT MUST NOT be accepted for processing */
    nbf: number;
    /** Registered Claim - The time the JWT was issued. Can be used to determine the age of the JWT */
    iat: number;
    /** Registered Claim - Unique identifier for the JWT. Can be used to prevent the JWT from being replayed. This is helpful for a one time use token. */
    jti: string;
    /** A display name for the user */
    name: string;
    /**	Given name(s) or first name(s) */
    given_name: string;
    /** Surname(s) or last name(s) */
    family_name: string;
    /** Image url for the user */
    picture: string;
    /** Authorized party - the party to which the ID Token was issued */
    azp: string;
    /** Value used to associate a Client session with an ID Token */
    nonce: string;
    /** Access Token hash value */
    at_hash: string;
    locale: string;
    email: string;
    email_verified: boolean;
}
