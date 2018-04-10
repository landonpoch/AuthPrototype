import { IssuerConfig } from "./jwtValidator";
import secrets from "../../secrets.json";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    public getKey = (id?: string): Promise<string> => Promise.resolve(secrets.jwtSigningSecret);
}

export { localIssuerKey, LocalConfig };
