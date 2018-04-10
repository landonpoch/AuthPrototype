import jwks from "jwks-rsa";
import axios from "axios";
import { IssuerConfig } from "./jwtHelper";

const googleIssuerKey = "https://accounts.google.com";
const googleWellKnownOidConfig = "https://accounts.google.com/.well-known/openid-configuration";

class GoogleConfig implements IssuerConfig {
    private jwksClient?: jwks.JwksClient;
    public clientId = "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com";

    public getKey = (id?: string): Promise<string> => {
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
