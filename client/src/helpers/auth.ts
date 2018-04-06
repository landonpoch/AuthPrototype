import { UserManager, User } from 'oidc-client';
import * as H from 'history';
import * as socketio from 'socket.io-client';
import loadScript from './scriptLoader';

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
    public init = (): Promise<void> => {
        setTimeout(() => loadScript('facebook-jssdk', '//connect.facebook.net/en_US/sdk.js').catch(console.log), 0);
        return Promise.resolve();
    }
}

export default class AuthHelper implements IAuthHelper, EventHelper<AuthEvents> {

    private listenerIndexes: AuthListenerIndexes;
    private listeners: AuthListeners;
    private userManager: UserManager;
    private user?: User;
    private socketConnection?: SocketIOClient.Socket;
    private facebookAuth: IAuthHelper;

    constructor() {
        this.facebookAuth = new FacebookAuth();
        this.userManager = this.createUserManager();
        this.listenerIndexes = this.constructListnerIndexes();
        this.listeners = this.constructListeners();
    }
    
    public init = (): Promise<void> => {
        return Promise.all([this.facebookAuth.init(), this.loadUser()])
            .then(val => undefined);
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

    public onCreateSignInRequest = (redirectUrl?: string) => {
        this.userManager = this.createUserManager();
        return this.userManager.signinRedirect({ state: redirectUrl });
    }

    public onCreateSignOutRequest = (history: H.History) => {
        this.user = undefined;
        sessionStorage.removeItem('UserManagerSettings');
        return this.userManager.removeUser().then(() => {
            this.userManager = new UserManager({});
            history.push('/');
        });
    }

    public onSignInResponse = (history: H.History): Promise<void> =>
        this.userManager.signinRedirectCallback()
            .then(user => { history.push(user.state || '/'); })

    private onLogin = (): void => { this.loadUser(); };
    private loadUser = (): Promise<void> => {
        return this.userManager.getUser().then(user => {
            if (user) {
                this.user = user;
                this.socketConnection = this.createSocketConnection();
                this.listeners.login.forEach(l => l());
            }
        });
    }

    private onLogout = () => {
        if (this.socketConnection) { this.socketConnection.disconnect(); }
        this.listeners.logout.forEach(l => l());
    }

    private createUserManager = (): UserManager => {
        const userManagerSettings = sessionStorage.getItem('UserManagerSettings');
        const userManager = new UserManager(userManagerSettings ? JSON.parse(userManagerSettings) : {});
        userManager.events.addUserLoaded(this.onLogin);
        userManager.events.addUserUnloaded(this.onLogout);
        return userManager;
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
