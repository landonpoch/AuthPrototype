import * as H from 'history';
import { IAuthHelper, User } from './interfaces';

export default class FacebookAuth implements IAuthHelper {
    private static readonly FacebookAppId = '174980966636737';

    private onLogin: (user: User) => void;
    private onLogout: () => void;

    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        this.onLogout = onLogout;
    }

    public init = (): Promise<void> => {
        return Promise.resolve();
    }
    
    public login = (redirectUrl?: string | undefined): Promise<void> => {
        const uri = encodeURI('https://localhost:3000/signinhandler');
        // TODO: state validation with session storage and guids
        const state = encodeURI(JSON.stringify({ randomState: 'bleh', redirectUrl: redirectUrl || '/' }));
        const loginUri = encodeURI(`https://www.facebook.com/dialog/oauth` +
            `?client_id=${FacebookAuth.FacebookAppId}` +
            `&redirect_uri=${uri}` +
            `&state=${state}` +
            `&scope=public_profile,email` +
            `&response_type=token`);
        location.replace(loginUri);
        return Promise.resolve();
    }

    public loggedIn = (history: H.History): Promise<void> => {
        const searchParams = new URLSearchParams(location.hash.slice(1));
        const params = {
            accessToken: searchParams.get('access_token'),
            state: JSON.parse(decodeURI(searchParams.get('state') || '{}')),
            expiresIn: searchParams.get('expires_in'),
        };
        // tslint:disable-next-line:no-console
        console.log(params);

        return fetch(`//localhost:8443/token` +
            `?grant_type=facebook_access_token` +
            `&client_id=${FacebookAuth.FacebookAppId}` +
            `&facebook_access_token=${params.accessToken}`)
            .then(r => r.json())
            .then(json => {
                // TODO: Session storage persistence of user

                this.onLogin({
                    email: 'user@facebook.com', // TODO: Fix hardcoding
                    idToken: json.access_token,
                });

                history.push(params.state.redirectUrl);
            });
    }

    public logout = (): Promise<void> => {
        // TODO: Session storage removal of user

        this.onLogout();
        return Promise.resolve();
    }
}
