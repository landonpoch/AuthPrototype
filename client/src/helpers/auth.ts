import * as H from 'history';
import * as socketio from 'socket.io-client';

import { IAuthHelper, AuthProvider, User } from './interfaces';
import OpenIdAuth from './openIdAuth';
import FacebookAuth from './facebookAuth';
import LocalAuth from './localAuth';

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

export default class AuthHelper implements EventHelper<AuthEvents> {

    static readonly AuthProviderKey = 'AuthProvider';

    private listenerIndexes: AuthListenerIndexes;
    private listeners: AuthListeners;
    private socketConnection?: SocketIOClient.Socket;
    
    private user?: User;
    private facebookAuth: IAuthHelper;
    private openIdAuth: IAuthHelper;
    private localAuth: IAuthHelper;

    constructor() {
        this.facebookAuth = new FacebookAuth(this.onLogin, this.onLogout);
        this.openIdAuth = new OpenIdAuth(this.onLogin, this.onLogout);
        this.localAuth = new LocalAuth(this.onLogin, this.onLogout);
        this.listenerIndexes = this.constructListnerIndexes();
        this.listeners = this.constructListeners();
    }
    
    public init = (): Promise<void> => {
        const authProvider = sessionStorage.getItem(AuthHelper.AuthProviderKey) as AuthProvider;
        switch (authProvider) {
            case AuthProvider.Google:
                return this.openIdAuth.init();
            case AuthProvider.Facebook:
                return this.facebookAuth.init();
            case AuthProvider.Local:
                return this.localAuth.init();
            default:
                return Promise.resolve();
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

    public isAuthenticated = (): boolean => !!this.user;

    public getDisplayName = (): string => {
        if (this.user) {
            return this.user.displayName || this.user.email;
        } else {
            throw `Can't get display name. Not authenticated!`;
        }
    }

    public getToken = (): string => {
        if (this.user) {
            return this.user.idToken;
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
                return this.facebookAuth.login(redirectUrl);
            case AuthProvider.Local:
                sessionStorage.setItem(AuthHelper.AuthProviderKey, AuthProvider.Local);
                return this.localAuth.login(redirectUrl);
            default:
                return Promise.resolve();
        }
    }

    public onSignInResponse = (history: H.History): Promise<void> => {
        const authProvider = sessionStorage.getItem(AuthHelper.AuthProviderKey) as AuthProvider;
        switch (authProvider) {
            case AuthProvider.Google:
                return this.openIdAuth.loggedIn(history);
            case AuthProvider.Facebook:
                return this.facebookAuth.loggedIn(history);
            case AuthProvider.Local:
                return this.localAuth.loggedIn(history);
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
            case AuthProvider.Facebook:
                return this.facebookAuth.logout().then(() => { history.push('/'); }).then(loggedOut);
            case AuthProvider.Local:
                return this.localAuth.logout().then(() => { history.push('/'); }).then(loggedOut);
            default:
                return Promise.resolve().then(loggedOut);
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
