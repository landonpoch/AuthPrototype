import * as H from 'history';
import { IAuthHelper, User } from './interfaces';

export default class LocalAuth implements IAuthHelper {
    private static readonly LocalUserKey = 'LocalUser';

    private onLogin: (user: User) => void;
    private onLogout: () => void;
    private redirectUrl: string | undefined;

    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        this.onLogout = onLogout;
    }

    init(): Promise<void> {
        const userStr = sessionStorage.getItem(LocalAuth.LocalUserKey);
        if (userStr) {
            const user = JSON.parse(userStr) as User;
            this.onLogin(user);
        }
        return Promise.resolve();
    }
    login(redirectUrl?: string | undefined): Promise<void> {
        const userStr = sessionStorage.getItem(LocalAuth.LocalUserKey);
        if (userStr) {
            const user = JSON.parse(userStr) as User;
            this.onLogin(user);
            this.redirectUrl = redirectUrl;
        }
        return Promise.resolve();
    }
    loggedIn(history: H.History): Promise<void> {
        history.push(this.redirectUrl || '/');
        return Promise.resolve();
    }
    logout(): Promise<void> {
        sessionStorage.removeItem(LocalAuth.LocalUserKey);
        this.onLogout();
        return Promise.resolve();
    }
}
