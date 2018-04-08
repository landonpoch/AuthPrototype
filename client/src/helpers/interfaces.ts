import * as H from 'history';

const AuthProvider = {
    Google: 'Google' as 'Google',
    Facebook: 'Facebook' as 'Facebook',
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
    email: string;
    idToken: string;
}