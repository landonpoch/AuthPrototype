import jwt from "jsonwebtoken";
import { IssuerConfig } from "./jwtHelper";
import secrets from "../../secrets.json";
import { User } from "./user";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    public getKey = (id?: string): Promise<string> => Promise.resolve(secrets.jwtSigningSecret);
}

const issueJwt = (body: User): string => {
    // TODO: consider expiration of locally issued jwts
    // TODO: consider aud verification of locally issued jwts
    return jwt.sign({
        iss: "https://localhost:3000",
        sub: body.id,
        email: body.email,
        name: body.displayName,
    }, secrets.jwtSigningSecret);
};

export { localIssuerKey, LocalConfig, issueJwt };
