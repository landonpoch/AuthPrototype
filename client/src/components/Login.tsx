import * as React from 'react';
import AuthHelper from '../helpers/auth';
import { UserManagerSettings } from 'oidc-client';

// tslint:disable-next-line:no-any
declare var FB: any;
const facebookLoginButton = require('../facebook.png');

const googleLoginButton = require('../btn_google_signin_light_normal_web.png');
const googleSettings: UserManagerSettings = {
    authority: 'https://accounts.google.com/.well-known/openid-configuration',
    client_id: '832067986394-it9obigmu3qnemg0em02pocq4q4e1gd8.apps.googleusercontent.com',
    redirect_uri: 'https://localhost:3000/signinhandler',
    response_type: 'id_token',
    scope: 'openid profile email',
    prompt: 'consent',
};

interface Props {
    location?: { state?: { from?: string; }; };
    auth: AuthHelper;
}

export default class Login extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <React.Fragment>
                <h3>Google Login</h3>
                <img src={googleLoginButton} onClick={this.googleSignIn} />
                <h3>Facebook Login</h3>
                <img src={facebookLoginButton} onClick={this.facebookLogin} width="192" />
                <h3>Username and Password</h3>
                <span>TODO!</span>
            </React.Fragment>
        );
    }

    private googleSignIn = () => {
        sessionStorage.setItem('UserManagerSettings', JSON.stringify(googleSettings));
        const redirectUrl = this.props.location && this.props.location.state && this.props.location.state.from;
        return this.props.auth.onCreateSignInRequest(redirectUrl);
    }

    private facebookLogin = () => {
        FB.login(
            // tslint:disable-next-line:no-any
            (response: any) => {
                // tslint:disable-next-line:no-console
                console.log('Begin login callback');
                // tslint:disable-next-line:no-console
                console.log(response);
                // tslint:disable-next-line:no-console
                console.log('End login callback');
            },
            { scope: 'public_profile,email' });
    }
}