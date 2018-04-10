import { IssuerConfig, JwtKeyGetter } from "./jwtValidator";
import secrets from "../../secrets.json";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    public clientId = "";
    public getJwtKeyGetter = () => new LocalJwtKeyGetter();
}

export class LocalJwtKeyGetter implements JwtKeyGetter {
    public getKey = (id?: string): Promise<string> => Promise.resolve(secrets.jwtSigningSecret);
}

export { localIssuerKey, LocalConfig };
