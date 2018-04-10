import jwt from "jsonwebtoken";
import { IssuerConfig } from "./jwtHelper";
import secrets from "../../secrets.json";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    public getKey = (id?: string): Promise<string> => Promise.resolve(secrets.jwtSigningSecret);
}

const issueJwt = (body: any): string => {
    // TODO: consider expiration of locally issued jwts
    // TODO: consider aud verification of locally issued jwts
    return jwt.sign({ ...body, iss: "https://localhost:3000" }, secrets.jwtSigningSecret);
};

export { localIssuerKey, LocalConfig, issueJwt };
