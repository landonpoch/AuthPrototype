import { UserManager, User, UserManagerSettings } from 'oidc-client';
import * as H from 'history';
import * as socketio from 'socket.io-client';
import loadScript from './scriptLoader';

const AuthProvider = {
    Google: 'Google' as 'Google',
    Facebook: 'Facebook' as 'Facebook',
};
type AuthProvider = keyof typeof AuthProvider;
export { AuthProvider };

type Listener = () => void;
export interface EventHelper<T extends string> {
    addListener: (event: T, listener: Listener) => number;
    removeListener: (event: T, handle: number) => void;
}

const AuthEvents = {
    login: 'login' as 'login',
    logout: 'logout' as 'logout',
    connect: 'connect' as 'connect',
    disconnect: 'disconnect' as 'disconnect',
};
type AuthEvents = keyof typeof AuthEvents;
export { AuthEvents };

type AuthListenerIndexes = { [K in AuthEvents]: number };
type AuthListeners = { [K in AuthEvents]: Map<number, Listener>; };

interface IAuthHelper {
    init(): Promise<void>;
    login(redirectUrl?: string): Promise<void>;
    loggedIn(history: H.History): Promise<void>;
    logout(): Promise<void>;
}

// tslint:disable-next-line:no-string-literal
window['fbAsyncInit'] = function() {
    FB.init({ appId: '174980966636737', cookie: true, version: 'v2.12' });
    FB.AppEvents.logPageView();
    FB.getLoginStatus(response => {
        // tslint:disable-next-line:no-console
        console.log('Being getLoginStatus');
        // tslint:disable-next-line:no-console
        console.log(response);
        // tslint:disable-next-line:no-console
        console.log('End getLoginStatus');
    });
};

class FacebookAuth implements IAuthHelper {
    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        // 
    }

    public init = (): Promise<void> => {
        setTimeout(() => loadScript('facebook-jssdk', '//connect.facebook.net/en_US/sdk.js').catch(console.log), 0);
        return Promise.resolve();
    }
    
    login(redirectUrl?: string | undefined): Promise<void> {
        throw new Error('Method not implemented.');
    }
    loggedIn(history: H.History): Promise<void> {
        throw new Error('Method not implemented.');
    }
    logout(): Promise<void> {
        throw new Error('Method not implemented.');
    }
}

const googleSettings: UserManagerSettings = {
    authority: 'https://accounts.google.com/.well-known/openid-configuration',
    client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
    redirect_uri: 'https://localhost:3000/signinhandler',
    response_type: 'id_token',
    scope: 'openid profile email',
    prompt: 'consent',
};

class OpenIdAuth implements IAuthHelper {
    private userManager: UserManager;
    private onLogin: (user: User) => void;
    private onLogout: () => void;

    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        this.onLogout = onLogout;
        this.userManager = this.createUserManager();
    }
    
    public init = (): Promise<void> => this.loadUser();

    public login = (redirectUrl?: string): Promise<void> => {
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
        // tslint:disable-next-line:max-line-length
        userManager.events.addUserLoaded(() => { this.loadUser(); });
        userManager.events.addUserUnloaded(this.onLogout);
        return userManager;
    }

    private loadUser = (): Promise<void> => {
        return this.userManager.getUser().then(user => { if (user) { this.onLogin(user); } });
    }
}

export default class AuthHelper implements EventHelper<AuthEvents> {

    static readonly AuthProviderKey = 'AuthProvider';

    private listenerIndexes: AuthListenerIndexes;
    private listeners: AuthListeners;
    private socketConnection?: SocketIOClient.Socket;
    
    private user?: User;
    private facebookAuth: IAuthHelper;
    private openIdAuth: IAuthHelper;

    constructor() {
        this.facebookAuth = new FacebookAuth(this.onLogin, this.onLogout);
        this.openIdAuth = new OpenIdAuth(this.onLogin, this.onLogout);
        this.listenerIndexes = this.constructListnerIndexes();
        this.listeners = this.constructListeners();
    }
    
    public init = (): Promise<void> => {
        const authProvider = sessionStorage.getItem(AuthHelper.AuthProviderKey) as AuthProvider;
        switch (authProvider) {
            case AuthProvider.Google:
                return this.openIdAuth.init();
            default:
                return this.facebookAuth.init();
        }
    }

    public addListener = (eventName: AuthEvents, listener: Listener): number => {
        const currentIndex = this.listenerIndexes[eventName];
        this.listeners[eventName].set(currentIndex, listener);
        this.listenerIndexes[eventName]++;
        return currentIndex;
    }

    public removeListener = (eventName: AuthEvents, handle: number): void => {
        this.listeners[eventName].delete(handle);
    }

    public isAuthenticated = (): boolean => !!this.user && !!this.user.profile;

    public getDisplayName = (): string => {
        if (this.user && !!this.user.profile) {
            return this.user.profile.name;
        } else {
            throw `Can't get display name. Not authenticated!`;
        }
    }

    public getToken = (): string => {
        if (this.user) {
            return this.user.id_token;
        } else {
            throw `Can't get token. Not authenticated!`;
        }
    }

    public isConnected = (): boolean => !!this.socketConnection && this.socketConnection.connected;

    public getSocket = (): SocketIOClient.Socket => {
        if (this.socketConnection && this.socketConnection.connected) {
            return this.socketConnection;
        } else {
            throw `Can't get socket.  Not connected!`;
        }
    }

    public onCreateSignInRequest = (authProvider: AuthProvider, redirectUrl?: string) => {
        switch (authProvider) {
            case AuthProvider.Google:
                sessionStorage.setItem(AuthHelper.AuthProviderKey, AuthProvider.Google);
                return this.openIdAuth.login(redirectUrl);
            case AuthProvider.Facebook:
                sessionStorage.setItem(AuthHelper.AuthProviderKey, AuthProvider.Facebook);
                return Promise.resolve();
            default:
                return Promise.resolve();
        }
    }

    public onCreateSignOutRequest = (history: H.History) => {
        const authProvider = sessionStorage.getItem(AuthHelper.AuthProviderKey) as AuthProvider;
        const loggedOut = () => sessionStorage.removeItem(AuthHelper.AuthProviderKey);
        switch (authProvider) {
            case AuthProvider.Google:
                return this.openIdAuth.logout().then(() => { history.push('/'); }).then(loggedOut);
            default:
                return Promise.resolve().then(loggedOut);
        }
        
    }

    public onSignInResponse = (history: H.History): Promise<void> => {
        const authProvider = sessionStorage.getItem(AuthHelper.AuthProviderKey) as AuthProvider;
        switch (authProvider) {
            case AuthProvider.Google:
                return this.openIdAuth.loggedIn(history);
            default:
                return Promise.resolve();
        }
    }

    private onLogin = (user: User): void => {
        this.user = user;
        this.socketConnection = this.createSocketConnection();
        this.listeners.login.forEach(l => l());
    }

    private onLogout = () => {
        this.listeners.logout.forEach(l => l());
        if (this.socketConnection) { this.socketConnection.disconnect(); }
        this.user = undefined;
    }

    private createSocketConnection = (): SocketIOClient.Socket => {
        const socket = socketio('https://localhost:8443', { query: { token: this.getToken() } });
        socket.on('connect', () => { this.listeners.connect.forEach(l => l()); });
        socket.on('disconnect', () => { this.listeners.disconnect.forEach(l => l()); });
        return socket;
    }

    private constructListnerIndexes = (): AuthListenerIndexes => {
        let result = {} as AuthListenerIndexes;
        // tslint:disable-next-line:forin
        for (const k in AuthEvents) { result[k] = 0; }
        return result;
    }

    private constructListeners = (): AuthListeners => {
        let result = {} as AuthListeners;
        // tslint:disable-next-line:forin
        for (const k in AuthEvents) { result[k] = new Map<number, Listener>(); }
        return result;
    }
}
