import jwks from "jwks-rsa";
import axios from "axios";
import { IssuerConfig, registerIssuer } from "./jwtValidator";

const googleIssuerKey = "https://accounts.google.com";
class GoogleConfig implements IssuerConfig {
    private jwksClient?: jwks.JwksClient;

    public clientId = "832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com";
    public getJwksClient = () => {
        if (this.jwksClient) return Promise.resolve(this.jwksClient);

        return axios.get<{ jwks_uri: string }>("https://accounts.google.com/.well-known/openid-configuration")
            .then(response => {
                return this.jwksClient = jwks({
                    jwksUri: response.data.jwks_uri,
                    cache: true,
                    rateLimit: true,
                });
            });
    }
}

export { googleIssuerKey, GoogleConfig };
