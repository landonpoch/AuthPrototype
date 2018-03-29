import { UserManager, User } from 'oidc-client';
import * as H from 'history';
import * as socketio from 'socket.io-client';

export default class Auth {

    private onLoginHandlers: Array<() => void> = [];
    private onLogoutHandlers: Array<() => void> = [];
    private user?: User;
    private socketConnection?: SocketIOClient.Socket;

    // userManager should be lazy loaded because we don't get config values until
    // the user clicks on the login option they want.
    private _userManager?: UserManager;
    private get userManager(): UserManager {
        if (!this._userManager) {
            const userManagerSettings = sessionStorage.getItem('UserManagerSettings');
            const userManager = new UserManager(userManagerSettings ? JSON.parse(userManagerSettings) : {});
            userManager.events.addUserLoaded(this.onLogin);
            userManager.events.addUserUnloaded(this.onLogout);
            return userManager;
        }
        return this._userManager;
    }

    public addOnLogin(handler: () => void) {
        this.onLoginHandlers.push(handler);
    }

    public removeOnLogin(handler: () => void) {
        const index = this.onLoginHandlers.indexOf(handler);
        if (index !== -1) {
            this.onLoginHandlers.splice(index, 1);
        }
    }

    public addOnLogout(handler: () => void) {
        this.onLogoutHandlers.push(handler);
    }

    public removeOnLogout(handler: () => void) {
        const index = this.onLogoutHandlers.indexOf(handler);
        if (index !== -1) {
            this.onLoginHandlers.splice(index, 1);
        }
    }

    public getDisplayName = (): string => {
        if (this.user && !!this.user.profile) {
            return this.user.profile.name;
        } else {
            throw 'Not authenticated!';
        }
    }

    public getToken = (): string => {
        if (this.user) {
            return this.user.id_token;
        } else {
            throw 'Not authenticated!';
        }
    }

    public isAuthenticated = (): boolean => {
        return !!this.user && !!this.user.profile;
    }

    public getSocket = (): SocketIOClient.Socket => {
        if (this.socketConnection) {
            return this.socketConnection;
        } else {
            throw 'Not connected!';
        }
    }

    public onCreateSignInRequest = (redirectUrl?: string) => {
        return this.userManager.signinRedirect({ state: redirectUrl });
    }

    public onCreateSignOutRequest = (history: H.History) => {
        return this.userManager.removeUser() // TODO: Clear out the user manager entirely
            .then(() => { history.push('/'); });
    }

    public onSignInResponse = (history: H.History) => {
        return this.userManager.signinRedirectCallback()
            .then(user => { history.push(user.state || '/'); });
    }

    private onLogin = () => {
        return this.userManager.getUser()
            .then(user => {
                this.user = user;
                this.socketConnection = socketio('https://localhost:8443', { query: { token: this.getToken() } });
                this.onLoginHandlers.forEach(h => h());
            });
    }

    private onLogout = () => {
        this.user = undefined;
        if (this.socketConnection) {
            this.socketConnection.disconnect();
        }
        this.onLogoutHandlers.forEach(h => h());
    }
}