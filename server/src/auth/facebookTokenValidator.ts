import fetch from "node-fetch";
import secrets from "../../secrets.json";

const facebookHost = "https://graph.facebook.com/v2.12";
let facebookAccessToken = "";

const validateToken = (clientId: string, accessToken: string): Promise<void> => {
    return (facebookAccessToken ?
        Promise.resolve({ access_token: facebookAccessToken }) :
        (fetch(`${facebookHost}/oauth/access_token` +
            `?client_id=${clientId}` +
            `&client_secret=${secrets.facebookClientSecret}` +
            `&grant_type=client_credentials`)
            .then(r => r.json())))
        .then(body => {
            facebookAccessToken = body.access_token;
            return fetch(`${facebookHost}/debug_token?input_token=${accessToken}&access_token=${facebookAccessToken}`);
        })
        .then(r => r.json())
        .then(body => {
            if (body && body.data && body.data.is_valid && body.data.app_id === clientId) {
                return Promise.resolve();
            } else {
                throw "Invalid token!";
            }
        });
};

const getTokenDetails = (accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
}> => {
    return fetch(`${facebookHost}/me?fields=id,email,name&access_token=${accessToken}`)
        .then(r => r.json());
};

export { validateToken, getTokenDetails };
