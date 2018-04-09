import jwks from "jwks-rsa"; // TODO: Remove this reference and use a better suited generic interface
import axios from "axios";
import { IssuerConfig, registerIssuer } from "./jwtValidator";
import secrets from "../../secrets.json";

const localIssuerKey = "https://localhost:3000";
class LocalConfig implements IssuerConfig {
    private jwksClient?: jwks.JwksClient;

    public clientId = "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com";
    public getJwksClient = () => {
        return Promise.resolve(new LocalJwksClient() as jwks.JwksClient);
    }
}

class LocalJwksClient {
    public getKeys = (cb: (err: Error, keys: jwks.Jwk[]) => any): any => {
        //
    }
    public getSigningKeys = (cb: (err: Error, keys: jwks.Jwk[]) => any): any => {
        //
    }
    public getSigningKey = (kid: string, cb: (err: Error, key: jwks.Jwk) => any): any => {
        cb(undefined as any, {
            kid: kid,
            rsaPublicKey: secrets.jwtSigningSecret,
        });
    }
}

export { localIssuerKey, LocalConfig };
