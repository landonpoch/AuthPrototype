import * as H from 'history';

import { IAuthHelper, User } from './interfaces';
import loadScript from './scriptLoader';

const initialized = new Promise<void>((resolve, reject) => {
    // tslint:disable-next-line:no-string-literal
    window['fbAsyncInit'] = function() {
        FB.init({ appId: '174980966636737', cookie: true, version: 'v2.12' });
        resolve();
    };
});

export default class FacebookAuth implements IAuthHelper {
    private onLogin: (user: User) => void;
    // private onLogout: () => void;

    constructor(onLogin: (user: User) => void, onLogout: () => void) {
        this.onLogin = onLogin;
        // this.onLogout = onLogout;
    }

    public init = (): Promise<void> => {
        return this.load();
    }
    
    public login = (redirectUrl?: string | undefined): Promise<void> => {
        return this.load().then(() => {
            // https://stackoverflow.com/questions/7125320/facebook-login-without-pop-up
            // var uri = encodeURI(location.href);
            const uri = encodeURI('https://localhost:3000/signinhandler/');
            // https://developers.facebook.com/apps/174980966636737/fb-login/settings/
            // https://www.facebook.com/settings?tab=applications
            FB.getLoginStatus(response => {
                if (response.status === 'connected') {
                    // window.location.href=uri;
                } else {
                    const state = 'bleh'; // Should be used for validation
                    const sessionState = redirectUrl ? `&session_state=${redirectUrl}` : '';
                    // tslint:disable-next-line:max-line-length
                    const loginUri = encodeURI(`https://www.facebook.com/dialog/oauth?client_id=174980966636737&redirect_uri=${uri}&response_type=token&state=${state}${sessionState}`);
                    location.replace(loginUri);
                    // this.props.history.push(loginUri);
                }
            });

            // FB.login(
            //     response => {
            //         // tslint:disable-next-line:no-console
            //         console.log('Begin login callback');
            // tslint:disable-next-line:max-line-length
            //         fetch(`//localhost:8443/token?grant_type=facebook_access_token&client_id=174980966636737&facebook_access_token=${response.authResponse.accessToken}`)
            //             .then(r => r.json())
            //             .then(console.log)
            //             .catch(console.log);
            //         // tslint:disable-next-line:no-console
            //         console.log(response);
            //         // tslint:disable-next-line:no-console
            //         console.log('End login callback');
            //     },
            //     { scope: 'public_profile,email' });

            throw new Error('Method not implemented.');
        });
    }

    public loggedIn = (history: H.History): Promise<void> => {
        // const accessToken = ''; // TODO: get access_token from query string
        // // tslint:disable-next-line:no-console
        // console.log(accessToken);
        // throw new Error('Method not implemented.');
        return this.load();
    }

    public logout = (): Promise<void> => {
        return new Promise<void>((resolve, reject) => {
            FB.logout(response => {
                // tslint:disable-next-line:no-console
                console.log('Begin logout callback');
                // tslint:disable-next-line:no-console
                console.log(response);
                // tslint:disable-next-line:no-console
                console.log('End logout callback');
                resolve();
            });
        });
    }

    private load = (): Promise<void> => {
        return Promise.all([loadScript('facebook-jssdk', '//connect.facebook.net/en_US/sdk.js'), initialized])
            .then(r => {
                return new Promise<void>((resolve, reject) => {
                    // FB.AppEvents.logPageView();
                    FB.getLoginStatus(response => {
                        
                        // tslint:disable-next-line:no-console
                        console.log('Being getLoginStatus');
                        // tslint:disable-next-line:no-console
                        console.log(response);
                        // tslint:disable-next-line:no-console
                        console.log('End getLoginStatus');

                        if (response.status === 'connected') {
                            // tslint:disable-next-line:max-line-length
                            fetch(`//localhost:8443/token?grant_type=facebook_access_token&client_id=174980966636737&facebook_access_token=${response.authResponse.accessToken}`)
                            .then(resp => resp.json())
                            .then(json => {
                                this.onLogin({
                                    email: 'user@facebook.com', // TODO: Fix hardcoding
                                    idToken: json.access_token,
                                });
                                resolve();
                            })
                            .catch(reject);
                        } else {
                            resolve();
                        }
                    });
                });
            });
    }
}