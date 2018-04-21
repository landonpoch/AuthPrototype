import jwt from "jsonwebtoken";
import { IssuerConfig } from "./jwtHelper";
import secrets from "../../secrets.json";
import { User } from "./user";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    public verifyJwt = (token: string, alg: "HS256"): Promise<LocalJwtPayload> => {
        const key = secrets.jwtSigningSecret;
        const decoded = jwt.verify(token, key, { algorithms: [alg]});
        const isJwtPayload = (decoded: string | object): decoded is LocalJwtPayload => {
            return !!decoded && typeof decoded === "object";
        };
        if (isJwtPayload(decoded)) {
            return Promise.resolve(decoded);
        } else {
            return Promise.reject("Unable to verify token");
        }
    }
}

const issueJwt = (body: User): string => {
    // TODO: consider expiration of locally issued jwts
    // TODO: consider aud verification of locally issued jwts
    const jwtPayload: LocalJwtPayload = {
        iss: "https://localhost:3000",
        sub: body.id,
        email: body.email,
        name: body.displayName,
    };
    return jwt.sign(jwtPayload, secrets.jwtSigningSecret);
};

export { localIssuerKey, LocalConfig, issueJwt };

export interface LocalJwtPayload {
    iss: string;
    sub: string;
    email: string;
    name: string;
}