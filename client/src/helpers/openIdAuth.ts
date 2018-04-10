import { UserManager, UserManagerSettings } from 'oidc-client';
import * as H from 'history';
import { IAuthHelper, User as IUser } from './interfaces';

const googleSettings: UserManagerSettings = {
    authority: 'https://accounts.google.com/.well-known/openid-configuration',
    client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
    redirect_uri: 'https://localhost:3000/signinhandler',
    response_type: 'id_token',
    scope: 'openid profile email',
    prompt: 'consent',
};

export default class OpenIdAuth implements IAuthHelper {
    private userManager: UserManager;
    private onLogin: (user: IUser) => void;
    private onLogout: () => void;

    constructor(onLogin: (user: IUser) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        this.onLogout = onLogout;
        this.userManager = this.createUserManager();
    }
    
    public init = (): Promise<void> => this.loadUser();

    public login = (redirectUrl?: string): Promise<void> => {
        // Assuming google settings because it's currently the only Open ID Connect provider we're using
        sessionStorage.setItem('UserManagerSettings', JSON.stringify(googleSettings));
        this.userManager = this.createUserManager();
        return this.userManager.signinRedirect({ state: redirectUrl });
    }
    
    public loggedIn = (history: H.History): Promise<void> => {
        return this.userManager.signinRedirectCallback()
            .then(user => { history.push(user.state || '/'); });
    }

    public logout = (): Promise<void> => {
        sessionStorage.removeItem('UserManagerSettings');
        return this.userManager.removeUser().then(() => { this.userManager = new UserManager({}); });
    }

    private createUserManager = (): UserManager => {
        const userManagerSettings = sessionStorage.getItem('UserManagerSettings');
        const userManager = new UserManager(userManagerSettings ? JSON.parse(userManagerSettings) : {});
        userManager.events.addUserLoaded(() => { this.loadUser(); });
        userManager.events.addUserUnloaded(this.onLogout);
        return userManager;
    }

    private loadUser = (): Promise<void> => {
        return this.userManager.getUser().then(user => {
            if (user) {
                this.onLogin({
                    displayName: user.profile.name,
                    email: user.profile.email,
                    idToken: user.id_token,
                });
            } 
        });
    }
}