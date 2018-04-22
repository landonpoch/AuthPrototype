import * as H from 'history';

const AuthProvider = {
    Google: 'Google' as 'Google',
    Facebook: 'Facebook' as 'Facebook',
    Local: 'Local' as 'Local',
};
type AuthProvider = keyof typeof AuthProvider;
export { AuthProvider };

export interface IAuthHelper {
    init(): Promise<void>;
    login(redirectUrl?: string): Promise<void>;
    loggedIn(history: H.History): Promise<void>;
    logout(): Promise<void>;
}

export interface User {
    displayName?: string;
    email: string;
    idToken: string;
}