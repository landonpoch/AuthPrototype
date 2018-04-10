import * as H from 'history';
import { v4 as uuid } from 'uuid';
import { IAuthHelper, User } from './interfaces';

export default class FacebookAuth implements IAuthHelper {
    private static readonly FacebookAppId = '174980966636737';
    private static readonly FacebookUserKey = 'FacebookUser';
    private static readonly StateValidationKey = 'StateValidation';

    private onLogin: (user: User) => void;
    private onLogout: () => void;

    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        this.onLogout = onLogout;
    }

    public init = (): Promise<void> => {
        const userStr = sessionStorage.getItem(FacebookAuth.FacebookUserKey);
        if (userStr) {
            const user = JSON.parse(userStr) as User;
            this.onLogin(user);
        }
        return Promise.resolve();
    }
    
    public login = (redirectUrl?: string | undefined): Promise<void> => {
        const uri = encodeURI('https://localhost:3000/signinhandler');
        const stateValidation = uuid();
        sessionStorage.setItem(FacebookAuth.StateValidationKey, stateValidation);
        const state = encodeURI(JSON.stringify({ randomState: stateValidation, redirectUrl: redirectUrl || '/' }));
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
        
        if (params.state.randomState !== sessionStorage.getItem(FacebookAuth.StateValidationKey)) {
            return Promise.reject('State validation failed. Not authenticated');
        }

        return fetch(`//localhost:8443/token` +
            `?grant_type=facebook_access_token` +
            `&client_id=${FacebookAuth.FacebookAppId}` +
            `&facebook_access_token=${params.accessToken}`)
            .then(r => r.json())
            .then(json => {
                const userDetails = JSON.parse(atob(json.access_token.split('.')[1]));
                const user = { displayName: userDetails.name, email: userDetails.email, idToken: json.access_token, };
                sessionStorage.setItem(FacebookAuth.FacebookUserKey, JSON.stringify(user));
                this.onLogin(user);
                history.push(params.state.redirectUrl);
            });
    }

    public logout = (): Promise<void> => {
        sessionStorage.removeItem(FacebookAuth.FacebookUserKey);
        this.onLogout();
        return Promise.resolve();
    }
}
